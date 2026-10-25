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

router = APIRouter(prefix='/api/ai', tags=['Hygiene Monitor'])

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '').strip().strip('""''')

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)


class HygieneViolation(BaseModel):
    category: str
    severity: str
    description: str
    recommendation: str
    icon: str


class HygieneZoneScore(BaseModel):
    zone: str
    score: int
    status: str
    observations: List[str]


class HygieneAnalysis(BaseModel):
    location_type: str
    overall_score: int
    compliance_grade: str
    compliance_status: str
    is_safe_for_food_prep: bool
    violations: List[HygieneViolation]
    zone_scores: List[HygieneZoneScore]
    positive_findings: List[str]
    priority_actions: List[str]
    estimated_inspection_result: str
    inspector_notes: str
    is_non_kitchen: bool = False
    non_kitchen_message: str = ''


NON_KITCHEN_GUARDRAIL_PROMPT = '''
You are a kitchen and food safety inspector AI. Look at this image.
First, determine: Is this image showing a kitchen, food preparation area, restaurant, cafeteria, food storage, or any space where food is handled?
Respond with ONLY valid JSON:
{
  "is_kitchen_related": true/false,
  "scene_description": "brief one-line description of what you see",
  "confidence": 0.0-1.0
}
Be strict. If the image shows people in non-food contexts, cars, nature, text, artwork, return false.
'''

HYGIENE_ANALYSIS_PROMPT = '''
You are an expert food safety inspector and hygiene auditor with 20+ years of experience.
Analyze this kitchen/food preparation environment image thoroughly.
Return ONLY valid JSON (no markdown, no explanation):
{
  "location_type": "Home Kitchen|Restaurant Kitchen|Commercial Kitchen|Food Prep Area|Cafeteria|Other",
  "overall_score": <integer 0-100>,
  "compliance_grade": "A|B|C|D|F",
  "compliance_status": "Compliant|Needs Attention|Critical",
  "is_safe_for_food_prep": true/false,
  "violations": [
    {
      "category": "Surface Cleanliness|Food Storage|Temperature Control|Personal Hygiene|Pest Control|Equipment|Cross-Contamination|Ventilation",
      "severity": "Critical|Major|Minor",
      "description": "specific observation from the image",
      "recommendation": "actionable fix recommendation",
      "icon": "emoji icon"
    }
  ],
  "zone_scores": [
    {
      "zone": "Prep Surfaces|Cooking Area|Storage|Flooring|Equipment|Ventilation",
      "score": <integer 0-100>,
      "status": "Good|Fair|Poor",
      "observations": ["observation1"]
    }
  ],
  "positive_findings": ["finding1"],
  "priority_actions": ["action1"],
  "estimated_inspection_result": "Pass|Conditional Pass|Fail",
  "inspector_notes": "Professional 2-3 sentence assessment"
}
Rules:
- 85-100 = Grade A (Compliant), 70-84 = Grade B, 55-69 = Grade C, 40-54 = Grade D, below 40 = Grade F
- Identify at least 3-5 zone scores
- Be realistic about what you see
'''


def resize_image_for_api(image_bytes: bytes, max_size: int = 1024) -> bytes:
    img = Image.open(io.BytesIO(image_bytes))
    if img.mode in ('RGBA', 'P', 'LA'):
        img = img.convert('RGB')
    w, h = img.size
    if max(w, h) > max_size:
        ratio = max_size / max(w, h)
        img = img.resize((int(w * ratio), int(h * ratio)), Image.LANCZOS)
    out = io.BytesIO()
    img.save(out, format='JPEG', quality=88)
    return out.getvalue()


@router.post('/hygiene-analysis')
async def analyze_hygiene(file: UploadFile = File(...)):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=503, detail='Gemini API key not configured.')

    raw = await file.read()
    if len(raw) > 15 * 1024 * 1024:
        raise HTTPException(status_code=413, detail='Image too large. Maximum 15MB.')

    try:
        img_bytes = resize_image_for_api(raw)
    except Exception:
        raise HTTPException(status_code=400, detail='Cannot process the uploaded file. Please upload a valid image.')

    img_b64 = base64.b64encode(img_bytes).decode()
    model = genai.GenerativeModel('gemini-2.5-flash')

    try:
        guard_resp = model.generate_content([
            NON_KITCHEN_GUARDRAIL_PROMPT,
            {'mime_type': 'image/jpeg', 'data': img_b64}
        ])
        guard_text = guard_resp.text.strip()
        if '```' in guard_text:
            guard_text = guard_text.split('```')[1]
            if guard_text.startswith('json'):
                guard_text = guard_text[4:]
        guard_data = json.loads(guard_text)

        if not guard_data.get('is_kitchen_related', True):
            scene = guard_data.get('scene_description', 'non-kitchen environment')
            return HygieneAnalysis(
                location_type='Unknown', overall_score=0, compliance_grade='N/A',
                compliance_status='Not Applicable', is_safe_for_food_prep=False,
                violations=[], zone_scores=[], positive_findings=[], priority_actions=[],
                estimated_inspection_result='N/A', inspector_notes='',
                is_non_kitchen=True,
                non_kitchen_message=f'This image appears to show {scene}. Please upload an image of a kitchen or food preparation area.'
            )
    except Exception:
        pass

    try:
        resp = model.generate_content([
            HYGIENE_ANALYSIS_PROMPT,
            {'mime_type': 'image/jpeg', 'data': img_b64}
        ])
        text = resp.text.strip()
        if '```' in text:
            text = text.split('```')[1]
            if text.startswith('json'):
                text = text[4:]
            text = text.split('```')[0]

        data = json.loads(text)
        violations = [HygieneViolation(**v) for v in data.get('violations', [])]
        zones = [HygieneZoneScore(**z) for z in data.get('zone_scores', [])]

        return HygieneAnalysis(
            location_type=data.get('location_type', 'Kitchen'),
            overall_score=data.get('overall_score', 75),
            compliance_grade=data.get('compliance_grade', 'B'),
            compliance_status=data.get('compliance_status', 'Needs Attention'),
            is_safe_for_food_prep=data.get('is_safe_for_food_prep', True),
            violations=violations, zone_scores=zones,
            positive_findings=data.get('positive_findings', []),
            priority_actions=data.get('priority_actions', []),
            estimated_inspection_result=data.get('estimated_inspection_result', 'Conditional Pass'),
            inspector_notes=data.get('inspector_notes', ''),
            is_non_kitchen=False, non_kitchen_message=''
        )
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f'AI response parsing error: {str(e)}')
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Analysis failed: {str(e)}')
