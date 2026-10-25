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

router = APIRouter(prefix="/api/ai", tags=["Freshness Detection"])

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip().strip('"\'')

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)


class FreshnessVisualFeature(BaseModel):
    feature: str
    status: str
    score: int
    observation: str


class FreshnessAnalysis(BaseModel):
    item_name: str
    category: str
    freshness_status: str  # "Fresh", "Moderately Fresh", "Spoiled"
    freshness_score: int    # 0 - 100
    spoilage_risk_pct: int  # 0 - 100
    confidence: float
    is_safe_to_eat: bool
    safety_verdict: str
    shelf_life_room_temp: str
    shelf_life_refrigerated: str
    visual_indicators: List[FreshnessVisualFeature]
    storage_recommendations: List[str]
    spoilage_cues: List[str]
    is_simulated: bool = False


FRESHNESS_PRESETS = [
    {
        "id": "fresh-apple",
        "keywords": ["apple", "fresh_apple", "fruit"],
        "data": {
            "item_name": "Crisp Honeycrisp Apple",
            "category": "Fresh Fruit",
            "freshness_status": "Fresh",
            "freshness_score": 96,
            "spoilage_risk_pct": 4,
            "confidence": 98.2,
            "is_safe_to_eat": True,
            "safety_verdict": "Peak Freshness — Highly nutritious, crisp texture and optimal vitamin retention.",
            "shelf_life_room_temp": "5–7 days",
            "shelf_life_refrigerated": "3–4 weeks",
            "visual_indicators": [
                {"feature": "Skin Color & Vibrancy", "status": "Optimal", "score": 98, "observation": "Uniform vibrant red-yellow pigment with natural protective wax bloom."},
                {"feature": "Surface Texture", "status": "Firm", "score": 96, "observation": "Taut, smooth epidermis with zero bruising, punctures, or softness."},
                {"feature": "Moisture & Rigidity", "status": "Hydrated", "score": 95, "observation": "High cellular turgor pressure; no wrinkling around stem base."},
                {"feature": "Pathogen / Mold Presence", "status": "None", "score": 100, "observation": "Zero fungal hyphae or bacterial softening detected."}
            ],
            "storage_recommendations": [
                "Store in the crisper drawer with low humidity to maintain skin crispness.",
                "Keep isolated from bananas and avocados to prevent premature ripening from ethylene gas."
            ],
            "spoilage_cues": [
                "Stem is intact and naturally firm with no moisture leakage."
            ]
        }
    },
    {
        "id": "ripening-banana",
        "keywords": ["banana", "ripe_banana"],
        "data": {
            "item_name": "Cavendish Banana (Sugar Spotted)",
            "category": "Tropical Fruit",
            "freshness_status": "Moderately Fresh",
            "freshness_score": 68,
            "spoilage_risk_pct": 32,
            "confidence": 96.5,
            "is_safe_to_eat": True,
            "safety_verdict": "Consumable Now — Sweet and ripe with natural sugar spots. Consume within 48 hours or freeze for smoothies.",
            "shelf_life_room_temp": "1–2 days",
            "shelf_life_refrigerated": "3–4 days (peel will darken)",
            "visual_indicators": [
                {"feature": "Skin Color & Vibrancy", "status": "Ripening", "score": 65, "observation": "Yellow peel displaying pronounced brown sugar spots (senescence marks)."},
                {"feature": "Surface Texture", "status": "Yielding", "score": 70, "observation": "Slight softening along the curvature; flesh remains structurally intact."},
                {"feature": "Moisture & Rigidity", "status": "Moderate", "score": 68, "observation": "Starches actively converting to simple sugars with mild cell wall degradation."},
                {"feature": "Pathogen / Mold Presence", "status": "None", "score": 95, "observation": "Stem end remains intact without fungal invasion or rot."}
            ],
            "storage_recommendations": [
                "Consume immediately or peel, slice, and freeze for protein smoothies.",
                "Ideal stage for baking banana bread or making natural oat pancakes."
            ],
            "spoilage_cues": [
                "Darkening concentrated at skin surface; pulp remains free of liquid rot."
            ]
        }
    },
    {
        "id": "spoiled-tomato",
        "keywords": ["tomato", "spoiled", "mold", "rotten"],
        "data": {
            "item_name": "Heirloom Vine Tomato",
            "category": "Vine Vegetable / Fruit",
            "freshness_status": "Spoiled",
            "freshness_score": 14,
            "spoilage_risk_pct": 92,
            "confidence": 97.8,
            "is_safe_to_eat": False,
            "safety_verdict": "Unsafe to Consume — Visible fungal mycelium and severe epidermal collapse indicate microbial decomposition.",
            "shelf_life_room_temp": "0 days (Discard)",
            "shelf_life_refrigerated": "0 days (Discard)",
            "visual_indicators": [
                {"feature": "Skin Color & Vibrancy", "status": "Discolored", "score": 18, "observation": "Dull brownish-black necrotic patches with loss of carotenoid pigment."},
                {"feature": "Surface Texture", "status": "Collapsed", "score": 10, "observation": "Sunken, water-soaked lesions with micro-perforations."},
                {"feature": "Moisture & Rigidity", "status": "Macerated", "score": 12, "observation": "Extracellular fluid leaking; structural integrity completely lost."},
                {"feature": "Pathogen / Mold Presence", "status": "Active Fungal Growth", "score": 8, "observation": "White/greyish mould colonies proliferating across the stem cavity."}
            ],
            "storage_recommendations": [
                "Do not ingest or attempt to cut away spoiled sections due to deep mycotoxin penetration.",
                "Dispose of in organic compost and sanitize storage container to prevent cross-contamination."
            ],
            "spoilage_cues": [
                "Visible greyish mould spores.",
                "Wet epidermal rupture and exudate leakage."
            ]
        }
    },
    {
        "id": "fresh-salmon",
        "keywords": ["salmon", "fish", "meat", "seafood"],
        "data": {
            "item_name": "Wild Pacific Salmon Fillet",
            "category": "Fresh Seafood",
            "freshness_status": "Fresh",
            "freshness_score": 93,
            "spoilage_risk_pct": 7,
            "confidence": 95.4,
            "is_safe_to_eat": True,
            "safety_verdict": "Prime Freshness — Bright flesh, resilient muscle fibers, and clean ocean-fresh characteristics.",
            "shelf_life_room_temp": "0 days (Requires strict refrigeration)",
            "shelf_life_refrigerated": "1–2 days (or freeze up to 3 months)",
            "visual_indicators": [
                {"feature": "Flesh Color & Vibrancy", "status": "Vibrant", "score": 94, "observation": "Intense natural astaxanthin coral-pink hue with clean white fat striations."},
                {"feature": "Surface Texture", "status": "Resilient", "score": 92, "observation": "Muscle fibers tight and springy; no gaping between myotomes."},
                {"feature": "Moisture Level", "status": "Glossy", "score": 93, "observation": "Naturally lustrous surface sheen without slimy or sticky exudate."},
                {"feature": "Oxidation & Rigidity", "status": "Minimal", "score": 95, "observation": "Zero greyish or brown edge discoloration."}
            ],
            "storage_recommendations": [
                "Keep on a bed of crushed ice inside the coldest zone of refrigerator (0°C–2°C).",
                "Cook within 24–48 hours or freeze tightly in vacuum-sealed wrap."
            ],
            "spoilage_cues": [
                "Flesh is translucent and glossy, not milky or dull."
            ]
        }
    }
]


def match_freshness_fallback(filename: str) -> Dict[str, Any]:
    name_lower = filename.lower()
    for preset in FRESHNESS_PRESETS:
        if any(kw in name_lower for kw in preset["keywords"]):
            res = dict(preset["data"])
            res["is_simulated"] = True
            return res
    res = dict(FRESHNESS_PRESETS[0]["data"])
    res["is_simulated"] = True
    return res


@router.post("/freshness-detection")
async def detect_freshness(
    file: Optional[UploadFile] = File(None),
    image_url: Optional[str] = Form(None),
    preset_name: Optional[str] = Form(None)
):
    """
    Multimodal Food Freshness & Spoilage Classification endpoint.
    Uses Gemini 2.5 Flash to analyze visual decay markers, color degradation,
    surface texture, and estimate safe storage shelf-life.
    """
    image_bytes = None
    filename = "food_freshness.jpg"

    if preset_name:
        for preset in FRESHNESS_PRESETS:
            if preset["id"] == preset_name or any(kw in preset_name.lower() for kw in preset["keywords"]):
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

    # If Gemini API key is configured, call Gemini 2.5 Flash Multimodal Vision
    if GEMINI_API_KEY:
        try:
            image = Image.open(io.BytesIO(image_bytes))

            prompt = """
            You are FoodVerse AI Freshness Inspector, an expert multimodal food safety and bio-inspection system.
            First, determine with high precision whether the image contains REAL FOOD, agricultural produce, meat, dairy, or edible grocery items.

            Case 1: If the image DOES NOT contain real food (for example: it is a cartoon, anime, wallpaper, human face, clothing, building, car, animal, document, or non-food object):
            Return ONLY this JSON:
            {
              "is_food": false,
              "item_name": "Non-Food Subject Detected",
              "category": "Illustration / Non-Food",
              "freshness_status": "Not Food",
              "freshness_score": 0,
              "spoilage_risk_pct": 0,
              "confidence": 98.0,
              "is_safe_to_eat": false,
              "safety_verdict": "No food detected in this image. It appears to be an illustration, artwork, or non-food item. Please upload a clear photo of real fruits, vegetables, meat, or groceries.",
              "shelf_life_room_temp": "N/A",
              "shelf_life_refrigerated": "N/A",
              "visual_indicators": [
                {"feature": "Food Content Verification", "status": "Not Food", "score": 0, "observation": "Image identified as non-edible content. Inspection aborted."}
              ],
              "storage_recommendations": [
                "Please upload a photo of edible produce, dairy, bakery, or cooked food."
              ],
              "spoilage_cues": [
                "Non-food content"
              ]
            }

            Case 2: If the image IS real food or produce:
            Evaluate freshness, decay, and shelf-life, and return ONLY this JSON:
            {
              "is_food": true,
              "item_name": "Specific food item identified",
              "category": "Category (e.g. Fresh Fruit, Dairy, Poultry, Seafood, Vegetable, Baked Goods)",
              "freshness_status": "Fresh" or "Moderately Fresh" or "Spoiled",
              "freshness_score": 88,
              "spoilage_risk_pct": 12,
              "confidence": 95.5,
              "is_safe_to_eat": true or false,
              "safety_verdict": "Clear 1-2 sentence safety declaration on whether it should be eaten, cooked immediately, or discarded.",
              "shelf_life_room_temp": "e.g. 3-4 days or 0 days",
              "shelf_life_refrigerated": "e.g. 7-10 days",
              "visual_indicators": [
                {"feature": "Color & Pigmentation", "status": "Optimal or Discolored", "score": 90, "observation": "Detailed scientific observation of surface color"},
                {"feature": "Surface Texture", "status": "Firm or Softened or Shriveled", "score": 85, "observation": "Texture, turgor, or epidermal integrity notes"},
                {"feature": "Moisture & Hydration", "status": "Normal or Dehydrated or Weeping", "score": 88, "observation": "Moisture balance and cellular leakage observation"},
                {"feature": "Decomposition / Pathogens", "status": "None Detected or Fungal Spots", "score": 95, "observation": "Specific indicators regarding mould, bacteria, or rot"}
              ],
              "storage_recommendations": [
                "Specific actionable storage recommendation 1",
                "Specific actionable storage recommendation 2"
              ],
              "spoilage_cues": [
                "Noticeable physical cue 1",
                "Noticeable physical cue 2"
              ]
            }
            Do not include markdown code block backticks. Return raw JSON text only.
            """

            model = genai.GenerativeModel("gemini-2.5-flash")
            response = model.generate_content([prompt, image])
            raw_text = response.text.strip()

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
            raise HTTPException(status_code=502, detail=f"Freshness Inspection failed: {str(e)}")

    raise HTTPException(status_code=503, detail="GEMINI_API_KEY is not configured in ai-service/.env")


@router.get("/freshness-presets")
async def get_freshness_presets():
    """Return available sample presets for 1-click testing."""
    return {
        "success": True,
        "presets": [
            {
                "id": "fresh-apple",
                "name": "Crisp Honeycrisp Apple",
                "status": "Fresh",
                "icon": "🍎",
                "score": 96,
                "color": "green",
                "sampleImg": "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80"
            },
            {
                "id": "ripening-banana",
                "name": "Sugar Spotted Banana",
                "status": "Moderately Fresh",
                "icon": "🍌",
                "score": 68,
                "color": "amber",
                "sampleImg": "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80"
            },
            {
                "id": "spoiled-tomato",
                "name": "Decaying Vine Tomato",
                "status": "Spoiled",
                "icon": "🍅",
                "score": 14,
                "color": "red",
                "sampleImg": "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80"
            },
            {
                "id": "fresh-salmon",
                "name": "Fresh Pacific Salmon",
                "status": "Fresh",
                "icon": "🐟",
                "score": 93,
                "color": "green",
                "sampleImg": "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=600&q=80"
            }
        ]
    }
