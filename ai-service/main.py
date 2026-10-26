import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routers.food_recognition import router as food_router
from routers.freshness import router as freshness_router
from routers.hygiene import router as hygiene_router
from routers.cooking import router as cooking_router
from routers.meal_planner import router as meal_plan_router

load_dotenv()

app = FastAPI(
    title="FoodVerse AI — Multimodal Food Intelligence Engine",
    description="FastAPI service for food recognition, nutrition analysis, freshness detection, hygiene monitoring, and smart cooking.",
    version="1.0.0",
)

# CORS configuration
client_url = os.getenv("CLIENT_URL", "").strip()
origins = [
    "https://food-verse-ai-one.vercel.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5001",
    "http://localhost:3000",
]
if client_url and client_url not in origins:
    origins.append(client_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^https://.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(food_router)
app.include_router(freshness_router)
app.include_router(hygiene_router)
app.include_router(cooking_router)
app.include_router(meal_plan_router)


@app.get("/")
def root():
    return {
        "status": "online",
        "service": "FoodVerse AI Microservice",
        "version": "1.0.0",
        "documentation": "/docs",
        "health": "/api/health",
    }


@app.get("/api/health")
def health_check():
    gemini_configured = bool(os.getenv("GEMINI_API_KEY", "").strip().strip('"\''))
    return {
        "status": "healthy",
        "service": "FoodVerse AI Service",
        "gemini_active": gemini_configured,
        "mode": "live_gemini" if gemini_configured else "simulation_fallback",
        "version": "1.0.0",
    }


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
