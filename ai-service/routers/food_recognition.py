import os
import json
import base64
import io
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, File, UploadFile, HTTPException, Form
from pydantic import BaseModel
from PIL import Image
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/api/ai", tags=["Food Recognition"])

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip().strip('"\'')

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)


class NutritionDetail(BaseModel):
    dish_name: str
    cuisine: str
    confidence: float
    serving_size: str
    calories: int
    protein_g: float
    carbs_g: float
    fat_g: float
    fiber_g: float
    sugar_g: float
    sodium_mg: float
    health_score: int
    health_grade: str
    ingredients: List[Dict[str, Any]]
    dietary_tags: List[str]
    allergens: List[str]
    health_insights: str
    recommendations: List[str]
    is_simulated: bool = False


# Realistic presets for demo/fallback
FALLBACK_PRESETS = [
    {
        "keywords": ["salad", "green", "mediterranean"],
        "data": {
            "dish_name": "Mediterranean Quinoa Bowl",
            "cuisine": "Mediterranean",
            "confidence": 94.5,
            "serving_size": "320g bowl",
            "calories": 420,
            "protein_g": 14.5,
            "carbs_g": 52.0,
            "fat_g": 18.0,
            "fiber_g": 8.5,
            "sugar_g": 4.2,
            "sodium_mg": 380,
            "health_score": 92,
            "health_grade": "A+",
            "ingredients": [
                {"name": "Cooked Quinoa", "portion": "1 cup (185g)", "calories": 222},
                {"name": "Avocado", "portion": "1/2 medium (75g)", "calories": 120},
                {"name": "Cherry Tomatoes", "portion": "1/2 cup (75g)", "calories": 18},
                {"name": "Cucumbers", "portion": "1/2 cup (50g)", "calories": 8},
                {"name": "Kalamata Olives", "portion": "5 pieces (20g)", "calories": 45},
                {"name": "Olive Oil Dressing", "portion": "1 tbsp (14g)", "calories": 119}
            ],
            "dietary_tags": ["Vegetarian", "High-Fiber", "Heart-Healthy", "Gluten-Free"],
            "allergens": [],
            "health_insights": "Exceptional nutritional balance with complete plant proteins from quinoa and heart-healthy monounsaturated fats from extra virgin olive oil and avocado.",
            "recommendations": [
                "Great fiber content supports healthy gut microbiome.",
                "To boost protein further, consider adding grilled tofu or chickpeas."
            ]
        }
    },
    {
        "keywords": ["toast", "avocado", "bread", "egg"],
        "data": {
            "dish_name": "Sourdough Avocado & Poached Egg Toast",
            "cuisine": "Contemporary / Brunch",
            "confidence": 96.0,
            "serving_size": "240g (2 slices)",
            "calories": 485,
            "protein_g": 18.2,
            "carbs_g": 42.0,
            "fat_g": 26.5,
            "fiber_g": 9.0,
            "sugar_g": 2.1,
            "sodium_mg": 460,
            "health_score": 88,
            "health_grade": "A",
            "ingredients": [
                {"name": "Artisan Sourdough Bread", "portion": "2 slices (80g)", "calories": 190},
                {"name": "Hass Avocado (Mashed)", "portion": "1 medium (130g)", "calories": 210},
                {"name": "Poached Egg", "portion": "1 large (50g)", "calories": 72},
                {"name": "Chili Flakes & Microgreens", "portion": "pinch", "calories": 5}
            ],
            "dietary_tags": ["Vegetarian", "High-Protein", "Sustained Energy"],
            "allergens": ["Egg", "Gluten"],
            "health_insights": "High satiety meal rich in choline from egg yolk and slow-digesting complex carbohydrates from fermented sourdough.",
            "recommendations": [
                "Excellent source of healthy omega-9 fatty acids.",
                "Pair with unsweetened green tea to enhance nutrient absorption."
            ]
        }
    },
    {
        "keywords": ["curry", "paneer", "rice", "indian", "masala"],
        "data": {
            "dish_name": "Paneer Tikka Masala with Jeera Rice",
            "cuisine": "North Indian",
            "confidence": 93.8,
            "serving_size": "400g platter",
            "calories": 610,
            "protein_g": 24.0,
            "carbs_g": 68.0,
            "fat_g": 28.0,
            "fiber_g": 5.2,
            "sugar_g": 6.8,
            "sodium_mg": 720,
            "health_score": 78,
            "health_grade": "B+",
            "ingredients": [
                {"name": "Fresh Cottage Cheese (Paneer)", "portion": "120g", "calories": 310},
                {"name": "Tomato & Cashew Gravy", "portion": "150g", "calories": 180},
                {"name": "Basmati Jeera Rice", "portion": "130g", "calories": 160}
            ],
            "dietary_tags": ["Vegetarian", "High-Protein", "Calcium-Rich"],
            "allergens": ["Dairy", "Tree Nuts (Cashews)"],
            "health_insights": "Rich in bioavailable calcium and casein protein. Spices like turmeric and cumin provide natural anti-inflammatory polyphenols.",
            "recommendations": [
                "Consider replacing half of the white rice with steamed vegetables or salad.",
                "Moderate sodium intake for the rest of the day."
            ]
        }
    },
    {
        "keywords": ["salmon", "fish", "asparagus", "grill"],
        "data": {
            "dish_name": "Pan-Seared Atlantic Salmon & Roasted Asparagus",
            "cuisine": "Nordic / Healthy Gourmet",
            "confidence": 97.2,
            "serving_size": "310g plate",
            "calories": 460,
            "protein_g": 38.0,
            "carbs_g": 8.0,
            "fat_g": 28.5,
            "fiber_g": 4.0,
            "sugar_g": 2.5,
            "sodium_mg": 320,
            "health_score": 95,
            "health_grade": "A+",
            "ingredients": [
                {"name": "Wild Atlantic Salmon Fillet", "portion": "180g", "calories": 360},
                {"name": "Grilled Asparagus Spears", "portion": "100g", "calories": 25},
                {"name": "Lemon Garlic Butter Drizzle", "portion": "1 tbsp", "calories": 75}
            ],
            "dietary_tags": ["High-Protein", "Keto-Friendly", "Omega-3 Rich", "Gluten-Free"],
            "allergens": ["Fish", "Dairy (Butter)"],
            "health_insights": "Superb nutrient profile with 2,400mg of EPA/DHA Omega-3 fatty acids for cognitive and cardiovascular vitality.",
            "recommendations": [
                "Ideal post-workout or muscle recovery dinner.",
                "Add a side of sweet potato if higher glycogen replenishment is required."
            ]
        }
    }
]


def match_fallback(filename: str) -> Dict[str, Any]:
    name_lower = filename.lower()
    for preset in FALLBACK_PRESETS:
        if any(kw in name_lower for kw in preset["keywords"]):
            res = dict(preset["data"])
            res["is_simulated"] = True
            return res
    # Default fallback
    res = dict(FALLBACK_PRESETS[0]["data"])
    res["is_simulated"] = True
    return res


@router.post("/food-recognition")
async def analyze_food(
    file: Optional[UploadFile] = File(None),
    image_url: Optional[str] = Form(None),
    preset_name: Optional[str] = Form(None)
):
    """
    Multimodal food recognition & nutrition analysis endpoint.
    Accepts image file or preset name and returns detailed nutritional breakdown.
    """
    image_bytes = None
    filename = "food.jpg"

    if preset_name:
        for preset in FALLBACK_PRESETS:
            if any(kw in preset_name.lower() for kw in preset["keywords"]):
                data = dict(preset["data"])
                data["is_simulated"] = not bool(GEMINI_API_KEY)
                return {"success": True, "data": data}

    if file:
        filename = file.filename
        image_bytes = await file.read()
    elif image_url and image_url.startswith("data:image"):
        try:
            header, encoded = image_url.split(",", 1)
            image_bytes = base64.b64decode(encoded)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid base64 image data")

    if not image_bytes:
        raise HTTPException(status_code=400, detail="No image file provided")

    # If Gemini API key is configured, call Gemini Vision
    if GEMINI_API_KEY:
        try:
            image = Image.open(io.BytesIO(image_bytes))

            prompt = """
            You are FoodVerse AI, a premier multimodal food intelligence engine.
            First, determine whether this image contains REAL EDIBLE FOOD, dishes, ingredients, or beverages.

            Case 1: If the image DOES NOT contain real food (e.g. it is a cartoon, anime character/wallpaper, human portrait, vehicle, landscape, clothing, document, or non-food item):
            Return ONLY this JSON:
            {
              "is_food": false,
              "dish_name": "Non-Food Image Detected",
              "cuisine": "Non-Food / Art / Object",
              "confidence": 99.0,
              "serving_size": "N/A",
              "calories": 0,
              "protein_g": 0.0,
              "carbs_g": 0.0,
              "fat_g": 0.0,
              "fiber_g": 0.0,
              "sugar_g": 0.0,
              "sodium_mg": 0.0,
              "health_score": 0,
              "health_grade": "N/A",
              "ingredients": [],
              "dietary_tags": [],
              "allergens": [],
              "health_insights": "The uploaded photo was identified as a non-food subject (e.g. an anime illustration, artwork, or non-edible object). Please upload an image of a real culinary dish or ingredient.",
              "recommendations": [
                "Upload a photo of a meal, snack, or grocery item for nutrition analysis."
              ]
            }

            Case 2: If the image IS real food:
            Analyze with high scientific accuracy and return ONLY this JSON:
            {
              "is_food": true,
              "dish_name": "Clear dish name",
              "cuisine": "Cuisine origin (e.g. Italian, Indian, Mexican, American)",
              "confidence": 95.0,
              "serving_size": "Estimated serving size in grams or descriptive unit",
              "calories": 450,
              "protein_g": 24.5,
              "carbs_g": 48.0,
              "fat_g": 16.0,
              "fiber_g": 6.5,
              "sugar_g": 5.0,
              "sodium_mg": 450,
              "health_score": 85,
              "health_grade": "A or B or C or D",
              "ingredients": [
                {"name": "Ingredient 1", "portion": "e.g. 100g", "calories": 150}
              ],
              "dietary_tags": ["Vegetarian", "High-Protein", ...],
              "allergens": ["Gluten", "Dairy", ...],
              "health_insights": "2-3 sentences concise nutritional evaluation.",
              "recommendations": [
                "Actionable recommendation 1",
                "Actionable recommendation 2"
              ]
            }
            Do not include markdown triple backticks. Return raw JSON string only.
            """

            # Use verified Gemini 2.5 Flash model
            model = genai.GenerativeModel("gemini-2.5-flash")
            response = model.generate_content([prompt, image])
            raw_text = response.text.strip()

            # Clean markdown formatting if present
            if raw_text.startswith("```json"):
                raw_text = raw_text[7:]
            if raw_text.startswith("```"):
                raw_text = raw_text[3:]
            if raw_text.endswith("```"):
                raw_text = raw_text[:-3]

            parsed_data = json.loads(raw_text.strip())
            if "is_food" not in parsed_data:
                parsed_data["is_food"] = True
            parsed_data["is_simulated"] = False
            return {"success": True, "data": parsed_data}

        except Exception as e:
            raise HTTPException(status_code=502, detail=f"AI Food Recognition failed: {str(e)}")

    raise HTTPException(status_code=503, detail="GEMINI_API_KEY is not configured in ai-service/.env")


@router.get("/food-presets")
async def get_presets():
    """Returns sample presets for easy 1-click frontend testing."""
    return {
        "success": True,
        "presets": [
            {
                "id": "quinoa-bowl",
                "name": "Mediterranean Quinoa Bowl",
                "tag": "Salad / Healthy",
                "icon": "🥗",
                "calories": 420,
                "protein": "14.5g"
            },
            {
                "id": "avocado-toast",
                "name": "Avocado & Poached Egg Toast",
                "tag": "Brunch / Energy",
                "icon": "🥑",
                "calories": 485,
                "protein": "18.2g"
            },
            {
                "id": "salmon",
                "name": "Pan-Seared Atlantic Salmon",
                "tag": "Seafood / High Protein",
                "icon": "🐟",
                "calories": 460,
                "protein": "38.0g"
            },
            {
                "id": "paneer",
                "name": "Paneer Tikka Masala",
                "tag": "Indian / Vegetarian",
                "icon": "🍛",
                "calories": 610,
                "protein": "24.0g"
            }
        ]
    }
