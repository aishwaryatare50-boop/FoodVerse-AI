import os
import json
import base64
import io
from typing import List, Optional
from fastapi import APIRouter, File, UploadFile, HTTPException, Form
from pydantic import BaseModel
from PIL import Image
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/api/ai", tags=["Smart Cooking"])

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip().strip('"\'')
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)


class RecipeStep(BaseModel):
    step_number: int
    title: str
    instruction: str
    duration: str
    tip: Optional[str] = None


class RecipeSuggestion(BaseModel):
    recipe_name: str
    cuisine: str
    difficulty: str
    prep_time: str
    cook_time: str
    servings: int
    calories_per_serving: int
    health_score: int
    description: str
    ingredients_used: List[str]
    missing_ingredients: List[str]
    steps: List[RecipeStep]
    dietary_tags: List[str]
    chef_tip: str
    plating_suggestion: str


class CookingResponse(BaseModel):
    detected_ingredients: List[str]
    recipes: List[RecipeSuggestion]
    cooking_notes: str
    ingredient_storage_tips: List[str]
    is_non_food: bool = False
    non_food_message: str = ""


INGREDIENT_DETECT_PROMPT = """
You are a professional chef AI. Analyze this image and identify all food ingredients visible.
Return ONLY valid JSON (no markdown):
{
  "is_food_image": true/false,
  "scene_description": "one line description",
  "ingredients": ["ingredient1", "ingredient2"],
  "confidence": 0.0-1.0
}
Be strict — only return is_food_image=true if you can see actual food ingredients, produce, pantry items, or food products. Anime, illustrations, people, vehicles, landscapes = false.
"""

RECIPE_GENERATION_PROMPT = """
You are a world-class chef and culinary AI assistant. Given these available ingredients: {ingredients}

Generate 3 creative, practical recipes using primarily these ingredients.
Return ONLY valid JSON (no markdown, no explanation):
{
  "detected_ingredients": ["ingredient1", "ingredient2"],
  "recipes": [
    {
      "recipe_name": "Recipe Name",
      "cuisine": "Italian|Indian|Mexican|Asian|Mediterranean|American|French|Other",
      "difficulty": "Easy|Medium|Advanced",
      "prep_time": "15 mins",
      "cook_time": "30 mins",
      "servings": 2,
      "calories_per_serving": 450,
      "health_score": 82,
      "description": "Enticing 2-sentence description",
      "ingredients_used": ["ingredient from the list used"],
      "missing_ingredients": ["additional ingredients needed"],
      "steps": [
        {
          "step_number": 1,
          "title": "Short step title",
          "instruction": "Detailed instruction",
          "duration": "5 mins",
          "tip": "optional chef tip"
        }
      ],
      "dietary_tags": ["Vegetarian", "Gluten-Free", etc],
      "chef_tip": "Professional chef advice for this dish",
      "plating_suggestion": "How to plate it beautifully"
    }
  ],
  "cooking_notes": "General tips for cooking with these ingredients",
  "ingredient_storage_tips": ["tip1", "tip2"]
}

Rules:
- Make recipes realistic and achievable at home
- Vary cuisines across the 3 recipes
- Include 4-8 steps per recipe
- Health score 0-100 based on nutritional value
"""

TEXT_RECIPE_PROMPT = """
You are a world-class chef. The user has these ingredients or wants this dish: {query}

Generate 3 creative recipes. Return ONLY valid JSON (no markdown):
{
  "detected_ingredients": ["ingredient1"],
  "recipes": [
    {
      "recipe_name": "Recipe Name",
      "cuisine": "Cuisine type",
      "difficulty": "Easy|Medium|Advanced",
      "prep_time": "X mins",
      "cook_time": "X mins",
      "servings": 2,
      "calories_per_serving": 400,
      "health_score": 80,
      "description": "2-sentence description",
      "ingredients_used": ["main ingredients"],
      "missing_ingredients": ["what else you need"],
      "steps": [
        {
          "step_number": 1,
          "title": "Step title",
          "instruction": "Detailed instruction",
          "duration": "5 mins",
          "tip": "optional tip"
        }
      ],
      "dietary_tags": ["tag1"],
      "chef_tip": "Professional tip",
      "plating_suggestion": "Plating advice"
    }
  ],
  "cooking_notes": "General cooking notes",
  "ingredient_storage_tips": ["storage tip"]
}
"""


def resize_image(image_bytes: bytes, max_size: int = 1024) -> bytes:
    img = Image.open(io.BytesIO(image_bytes))
    if img.mode in ("RGBA", "P", "LA"):
        img = img.convert("RGB")
    w, h = img.size
    if max(w, h) > max_size:
        ratio = max_size / max(w, h)
        img = img.resize((int(w * ratio), int(h * ratio)), Image.LANCZOS)
    out = io.BytesIO()
    img.save(out, format="JPEG", quality=88)
    return out.getvalue()


def parse_gemini_json(text: str) -> dict:
    text = text.strip()
    if "```" in text:
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.split("```")[0]
    return json.loads(text.strip())


@router.post("/cooking-assistant")
async def cooking_assistant(
    file: Optional[UploadFile] = File(None),
    query: Optional[str] = Form(None)
):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=503, detail="Gemini API key not configured.")
    if not file and not query:
        raise HTTPException(status_code=400, detail="Provide either an image or a text query.")

    model = genai.GenerativeModel("gemini-2.5-flash")
    ingredients_list = []

    if file:
        raw = await file.read()
        if len(raw) > 15 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="Image too large. Maximum 15MB.")
        try:
            img_bytes = resize_image(raw)
        except Exception:
            raise HTTPException(status_code=400, detail="Cannot process image. Please upload a valid image file.")

        img_b64 = base64.b64encode(img_bytes).decode()

        # Detect ingredients + non-food check
        try:
            detect_resp = model.generate_content([
                INGREDIENT_DETECT_PROMPT,
                {"mime_type": "image/jpeg", "data": img_b64}
            ])
            detect_data = parse_gemini_json(detect_resp.text)

            if not detect_data.get("is_food_image", True):
                scene = detect_data.get("scene_description", "non-food image")
                return CookingResponse(
                    detected_ingredients=[], recipes=[], cooking_notes="",
                    ingredient_storage_tips=[], is_non_food=True,
                    non_food_message=f"This appears to be {scene}. Please upload an image of food ingredients or type what you'd like to cook."
                )
            ingredients_list = detect_data.get("ingredients", [])
        except Exception:
            ingredients_list = ["mixed ingredients"]

        # Generate recipes from image ingredients
        prompt = RECIPE_GENERATION_PROMPT.replace("{ingredients}", ", ".join(ingredients_list) if ingredients_list else "assorted ingredients")
        try:
            recipe_resp = model.generate_content([prompt, {"mime_type": "image/jpeg", "data": img_b64}])
            data = parse_gemini_json(recipe_resp.text)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Recipe generation failed: {str(e)}")

    else:
        # Text-based query
        prompt = TEXT_RECIPE_PROMPT.replace("{query}", query or "")
        try:
            recipe_resp = model.generate_content(prompt)
            data = parse_gemini_json(recipe_resp.text)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Recipe generation failed: {str(e)}")

    recipes = []
    for r in data.get("recipes", []):
        steps = [RecipeStep(**s) for s in r.get("steps", [])]
        recipes.append(RecipeSuggestion(
            recipe_name=r.get("recipe_name", "Recipe"),
            cuisine=r.get("cuisine", "International"),
            difficulty=r.get("difficulty", "Medium"),
            prep_time=r.get("prep_time", "20 mins"),
            cook_time=r.get("cook_time", "30 mins"),
            servings=r.get("servings", 2),
            calories_per_serving=r.get("calories_per_serving", 400),
            health_score=r.get("health_score", 75),
            description=r.get("description", ""),
            ingredients_used=r.get("ingredients_used", []),
            missing_ingredients=r.get("missing_ingredients", []),
            steps=steps,
            dietary_tags=r.get("dietary_tags", []),
            chef_tip=r.get("chef_tip", ""),
            plating_suggestion=r.get("plating_suggestion", "")
        ))

    return CookingResponse(
        detected_ingredients=data.get("detected_ingredients", ingredients_list),
        recipes=recipes,
        cooking_notes=data.get("cooking_notes", ""),
        ingredient_storage_tips=data.get("ingredient_storage_tips", []),
        is_non_food=False,
        non_food_message=""
    )
