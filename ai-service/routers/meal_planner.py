import os
import json
from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/api/ai", tags=["Meal Planner"])

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip().strip('"\'')
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)


class MealPlanRequest(BaseModel):
    dietary_goal: str  # "Weight Loss", "Muscle Gain", "Balanced", "Keto", "Vegan", "Diabetic-Friendly"
    dietary_restrictions: List[str] = []  # ["Vegetarian", "Gluten-Free", etc.]
    calorie_target: int = 2000
    allergies: List[str] = []
    cuisine_preference: str = "Any"
    num_days: int = 7


class Meal(BaseModel):
    name: str
    description: str
    calories: int
    protein_g: float
    carbs_g: float
    fat_g: float
    prep_time: str
    key_ingredients: List[str]
    health_benefit: str


class DayPlan(BaseModel):
    day: str
    breakfast: Meal
    lunch: Meal
    dinner: Meal
    snack: Meal
    total_calories: int
    water_intake: str
    daily_tip: str


class MealPlanResponse(BaseModel):
    plan_title: str
    dietary_goal: str
    weekly_summary: str
    avg_daily_calories: int
    days: List[DayPlan]
    grocery_list: List[str]
    meal_prep_tips: List[str]
    nutritionist_notes: str


MEAL_PLAN_PROMPT = """
You are a world-class nutritionist and meal planning expert.
Create a {num_days}-day personalized meal plan with these requirements:
- Dietary Goal: {dietary_goal}
- Dietary Restrictions: {restrictions}
- Daily Calorie Target: {calories} kcal
- Allergies: {allergies}
- Cuisine Preference: {cuisine}

Return ONLY valid JSON (no markdown):
{{
  "plan_title": "Personalized {dietary_goal} Meal Plan",
  "dietary_goal": "{dietary_goal}",
  "weekly_summary": "2-3 sentence overview of the plan",
  "avg_daily_calories": <integer>,
  "days": [
    {{
      "day": "Monday",
      "breakfast": {{
        "name": "Meal name",
        "description": "Brief description",
        "calories": 350,
        "protein_g": 15.0,
        "carbs_g": 45.0,
        "fat_g": 12.0,
        "prep_time": "10 mins",
        "key_ingredients": ["ingredient1", "ingredient2"],
        "health_benefit": "Why this is good"
      }},
      "lunch": {{ same structure }},
      "dinner": {{ same structure }},
      "snack": {{ same structure }},
      "total_calories": 1950,
      "water_intake": "2.5 liters",
      "daily_tip": "Actionable wellness tip for the day"
    }}
  ],
  "grocery_list": ["ingredient1", "ingredient2"],
  "meal_prep_tips": ["tip1", "tip2", "tip3"],
  "nutritionist_notes": "Professional 2-3 sentence advice"
}}

Rules:
- Generate exactly {num_days} days (Monday through {last_day})
- Vary meals across all days — no repetition
- Match calorie targets accurately
- Grocery list should cover all meals for the week
- Include practical, achievable meals
"""

DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


def parse_gemini_json(text: str) -> dict:
    text = text.strip()
    if "```" in text:
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.split("```")[0]
    return json.loads(text.strip())


@router.post("/meal-plan")
async def generate_meal_plan(request: MealPlanRequest):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=503, detail="Gemini API key not configured.")

    num_days = min(max(request.num_days, 1), 7)
    last_day = DAYS[num_days - 1]
    restrictions = ", ".join(request.dietary_restrictions) if request.dietary_restrictions else "None"
    allergies = ", ".join(request.allergies) if request.allergies else "None"

    prompt = MEAL_PLAN_PROMPT.format(
        num_days=num_days,
        dietary_goal=request.dietary_goal,
        restrictions=restrictions,
        calories=request.calorie_target,
        allergies=allergies,
        cuisine=request.cuisine_preference,
        last_day=last_day
    )

    model = genai.GenerativeModel("gemini-2.5-flash")
    try:
        resp = model.generate_content(prompt)
        data = parse_gemini_json(resp.text)
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"AI response parsing error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Meal plan generation failed: {str(e)}")

    days = []
    for d in data.get("days", []):
        def parse_meal(m: dict) -> Meal:
            return Meal(
                name=m.get("name", "Meal"),
                description=m.get("description", ""),
                calories=m.get("calories", 400),
                protein_g=m.get("protein_g", 15.0),
                carbs_g=m.get("carbs_g", 40.0),
                fat_g=m.get("fat_g", 12.0),
                prep_time=m.get("prep_time", "20 mins"),
                key_ingredients=m.get("key_ingredients", []),
                health_benefit=m.get("health_benefit", "")
            )
        days.append(DayPlan(
            day=d.get("day", "Day"),
            breakfast=parse_meal(d.get("breakfast", {})),
            lunch=parse_meal(d.get("lunch", {})),
            dinner=parse_meal(d.get("dinner", {})),
            snack=parse_meal(d.get("snack", {})),
            total_calories=d.get("total_calories", request.calorie_target),
            water_intake=d.get("water_intake", "2 liters"),
            daily_tip=d.get("daily_tip", "Stay hydrated!")
        ))

    return MealPlanResponse(
        plan_title=data.get("plan_title", f"{request.dietary_goal} Meal Plan"),
        dietary_goal=request.dietary_goal,
        weekly_summary=data.get("weekly_summary", ""),
        avg_daily_calories=data.get("avg_daily_calories", request.calorie_target),
        days=days,
        grocery_list=data.get("grocery_list", []),
        meal_prep_tips=data.get("meal_prep_tips", []),
        nutritionist_notes=data.get("nutritionist_notes", "")
    )
