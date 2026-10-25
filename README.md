# 🌿 FoodVerse AI — Multimodal Food Intelligence Engine

[![Frontend](https://img.shields.io/badge/Frontend-React%20%7C%20Vite-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![AI Service](https://img.shields.io/badge/AI%20Engine-FastAPI%20%7C%20Python-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Database](https://img.shields.io/badge/Database-MongoDB%20Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![AI Model](https://img.shields.io/badge/Multimodal%20AI-Google%20Gemini%202.5%20Flash-4285F4?logo=google&logoColor=white)](https://aistudio.google.com/)

**FoodVerse AI** is an end-to-end, full-stack food intelligence ecosystem powered by Google Gemini Vision. It bridges visual AI with personalized nutrition, real-time freshness detection, restaurant-grade kitchen hygiene auditing, pantry-based recipe generation, and comprehensive wellness tracking.

---

## 🌟 Key Features

### 🍽️ 1. Food Recognition & Nutrition Breakdown
- **Instant Dish Identification:** Upload food photos or dishes to automatically identify culinary items.
- **Macronutrient Analysis:** Real-time breakdown of Calories, Protein, Carbohydrates, Healthy Fats, Fiber, and micronutrient highlights.
- **AI Non-Food Guardrail:** Intelligently rejects non-edible objects, abstract graphics, and irrelevant photos (`is_food: false`).

### 🌿 2. Freshness & Spoilage Detection
- **Visual Shelf-Life Grading:** Scans produce, meats, dairy, and prepared foods for early signs of decay, discoloration, and mold.
- **Freshness Score (0–100):** Assigns a safety rating with an actionable consumption advisory (Eat Immediately, Cook Well, or Discard).

### 🏪 3. Kitchen Hygiene & Safety Auditing
- **Commercial & Home Kitchen Inspections:** Analyzes photos of prep counters, cookware, storage, and sink areas.
- **Compliance & Hazard Reports:** Detects cross-contamination risks, grease buildup, and improper storage with actionable remediation steps.
- **Non-Kitchen Guardrail:** Flags and rejects photos that do not depict food-preparation environments.

### 👨‍🍳 4. Smart Cooking Assistant
- **Pantry-to-Plate Generation:** Input whatever ingredients you have on hand to receive structured, step-by-step recipes.
- **Culinary Customization:** Choose difficulty levels, preparation time limits, and dietary styles.

### 🥗 5. Personalized Multi-Day Meal Planner
- **Goal-Oriented Plans:** Generates comprehensive meal plans tailored to specific goals (Weight Loss, Muscle Gain, Balanced, Keto, Diabetic-Friendly).
- **Allergy & Restriction Filtering:** Respects vegetarian, vegan, gluten-free, peanut, and dairy sensitivities.
- **Complete Grocery Lists:** Auto-generates weekly ingredient shopping checklists and meal-prep tips.

### 📊 6. Real-Time Nutrition Analytics
- **Live Health Metrics:** Automatically tracks logged meals against daily caloric budgets and macronutrient goals.
- **MongoDB Atlas Persistence:** All nutrition logs, health scores, and historical scans are securely stored and tied to authenticated user accounts.

### 🔐 7. Secure Authentication
- **JWT & Bcrypt:** Secure password hashing and token-based session management.
- **MongoDB Atlas Storage:** User profiles and dietary preferences isolated within the dedicated `foodverse` database.

---

## 🏗️ Architecture & Tech Stack

```text
┌────────────────────────────────────────────────────────┐
│              Client Application (React + Vite)         │
│               Port 5173 / Production on Vercel         │
└──────────────────────┬─────────────────────────────────┘
                       │
         ┌─────────────┴─────────────┐
         ▼                           ▼
┌──────────────────┐       ┌──────────────────────────────┐
│  Express Backend │       │    FastAPI AI Service        │
│   (Node.js / JS) │       │       (Python 3)             │
│    Port 5001     │       │       Port 8000              │
└────────┬─────────┘       └──────────────┬───────────────┘
         │                                │
         ▼                                ▼
┌──────────────────┐       ┌──────────────────────────────┐
│  MongoDB Atlas   │       │   Google Gemini 2.5 Flash    │
│ (Cloud Database) │       │   (Multimodal Vision & NLP)  │
└──────────────────┘       └──────────────────────────────┘
```

| Layer | Technologies | Responsibility |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite, React Router 6, React Hot Toast, Lucide Icons, Vanilla CSS Design System | UI/UX, image capture, dashboards, charts, client auth state |
| **Backend** | Node.js, Express.js, Mongoose, JSON Web Tokens (JWT), Bcrypt.js, CORS | User management, session verification, analytics logging, database transactions |
| **AI Service** | FastAPI, Uvicorn, Google Generative AI SDK, Pillow, Pydantic | Gemini Vision prompt engineering, guardrail validation, structured JSON parsing |
| **Database** | MongoDB Atlas (Cloud Cluster M0) | Persistent storage for users, dietary profiles, and meal logs |

---

## 📁 Repository Structure

```text
Food Verse AI/
├── .gitignore                    # Root ignore file protecting secrets & dependencies
├── README.md                     # Project documentation
│
├── frontend/                     # React + Vite Client Application
│   ├── public/                   # Static assets & icons
│   ├── src/
│   │   ├── components/           # Reusable UI components & ProtectedRoute
│   │   ├── context/              # AuthContext & global state
│   │   ├── pages/                # App pages (Dashboard, FoodRec, Freshness, Hygiene, etc.)
│   │   ├── services/             # Axios API client with auth interceptors
│   │   ├── App.jsx               # Route definitions & Toaster provider
│   │   └── main.jsx              # DOM entry point
│   ├── .env.example              # Frontend environment template
│   └── package.json
│
├── backend/                      # Express.js REST API Server
│   ├── config/                   # MongoDB connection with DNS fallback
│   ├── middleware/               # JWT authentication middleware
│   ├── models/                   # Mongoose schemas (User, AnalyticsLog)
│   ├── routes/                   # Auth & Analytics endpoints
│   ├── server.js                 # Express server bootstrap & CORS configuration
│   ├── .env.example              # Backend environment template
│   └── package.json
│
└── ai-service/                   # FastAPI Python Multimodal AI Microservice
    ├── routers/                  # Modular AI routers:
    │   ├── food_recognition.py   # Nutrition & dish identification
    │   ├── freshness.py          # Shelf-life & spoilage analysis
    │   ├── hygiene.py            # Kitchen sanitation audit
    │   ├── cooking.py            # Recipe generation engine
    │   └── meal_planner.py       # Multi-day personalized meal planner
    ├── main.py                   # FastAPI application & health check
    ├── requirements.txt          # Python dependencies
    └── .env.example              # AI service environment template
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Python](https://www.python.org/) (v3.10 or higher)
- Free [Google Gemini API Key](https://aistudio.google.com/)
- Free [MongoDB Atlas Cluster](https://www.mongodb.com/atlas)

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/<YOUR_USERNAME>/food-verse-ai.git
cd "food-verse-ai"
```

---

### Step 2: Configure the AI Service (Python FastAPI)
```bash
cd ai-service

# Create and activate virtual environment (optional but recommended)
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create your .env file
copy .env.example .env   # On macOS/Linux: cp .env.example .env
```

Open `ai-service/.env` and insert your Gemini API Key:
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
PORT=8000
```

Start the AI Service:
```bash
uvicorn main:app --reload --port 8000
```
> Verify at: `http://localhost:8000/api/health`

---

### Step 3: Configure the Express Backend (Node.js)
Open a new terminal window:
```bash
cd backend

# Install dependencies
npm install

# Create your .env file
copy .env.example .env   # On macOS/Linux: cp .env.example .env
```

Open `backend/.env` and update your settings:
```env
PORT=5001
MONGO_URI="mongodb+srv://<username>:<password>@<cluster-host>/foodverse?appName=Cluster0"
JWT_SECRET=super_secret_jwt_key_2024
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
AI_SERVICE_URL=http://localhost:8000
```

Start the Backend:
```bash
npm start   # or: node server.js
```
> Verify at: `http://localhost:5001/api/health`

---

### Step 4: Configure the Frontend (React + Vite)
Open a third terminal window:
```bash
cd frontend

# Install dependencies
npm install

# Create your .env file
copy .env.example .env   # On macOS/Linux: cp .env.example .env
```

Verify `frontend/.env`:
```env
VITE_API_URL=http://localhost:5001/api
VITE_BACKEND_URL=http://localhost:5001
VITE_AI_SERVICE_URL=http://localhost:8000/api
VITE_APP_NAME=FoodVerse
```

Start the Frontend:
```bash
npm run dev
```
> Open your browser at: **`http://localhost:5173`**

---

## 🌐 Production Deployment Guide (100% Free)

| Service | Recommended Host | Root Directory | Build Command | Start Command |
| :--- | :--- | :--- | :--- | :--- |
| **AI Service** | [Render](https://render.com) (Web Service) | `ai-service` | `pip install -r requirements.txt` | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| **Backend** | [Render](https://render.com) (Web Service) | `backend` | `npm install` | `node server.js` |
| **Frontend** | [Vercel](https://vercel.com) | `frontend` | `npm run build` | *Vite automatic* |
| **Database** | [MongoDB Atlas](https://www.mongodb.com/atlas) | Cloud | N/A | Dedicated `foodverse` DB |

### Environment Variables Checklist for Production

#### AI Service (Render):
- `GEMINI_API_KEY`: Your Gemini API Key
- `PORT`: `8000`

#### Backend (Render):
- `PORT`: `5001`
- `MONGO_URI`: `mongodb+srv://.../foodverse`
- `JWT_SECRET`: A secure random string
- `JWT_EXPIRE`: `7d`
- `CLIENT_URL`: `https://your-frontend.vercel.app`
- `AI_SERVICE_URL`: `https://your-ai-service.onrender.com`

#### Frontend (Vercel):
- `VITE_API_URL`: `https://your-backend.onrender.com/api`
- `VITE_BACKEND_URL`: `https://your-backend.onrender.com`
- `VITE_AI_SERVICE_URL`: `https://your-ai-service.onrender.com/api`
- `VITE_APP_NAME`: `FoodVerse`

---

## 🛡️ Security Best Practices
- **No Hardcoded Secrets:** All credentials, keys, and URIs are isolated in `.env` files and omitted from version control via `.gitignore`.
- **CORS Safeguards:** Preflight-enabled CORS with credential validation to prevent unauthorized origin requests.
- **Password Protection:** User passwords are encrypted using `bcryptjs` with salt rounds before insertion into MongoDB.
- **Input Validation:** Strict request sanitization with `express-validator` (backend) and `pydantic` schemas (AI service).

---

## 📄 License
This project is licensed under the **MIT License**. Feel free to use, modify, and distribute for personal or commercial projects.
