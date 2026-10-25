import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import "./MealPlanner.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const DIETARY_GOALS = [
  "Balanced",
  "Weight Loss",
  "Muscle Gain",
  "Keto",
  "Vegan",
  "Vegetarian",
  "Diabetic-Friendly",
  "Heart-Healthy",
];

const CUISINES = [
  "Any",
  "Mediterranean",
  "Indian",
  "Asian",
  "American",
  "Italian",
  "Mexican",
  "Middle Eastern",
];

const RESTRICTIONS = [
  "Vegetarian",
  "Vegan",
  "Gluten-Free",
  "Dairy-Free",
  "Nut-Free",
  "Low-Carb",
  "Low-Sodium",
  "Halal",
  "Kosher",
];

const ALLERGIES_LIST = [
  "Nuts",
  "Dairy",
  "Eggs",
  "Gluten",
  "Shellfish",
  "Soy",
  "Fish",
  "Sesame",
];

const SAMPLE_PLANS = [
  {
    goal: "Balanced",
    calories: 2000,
    cuisine: "Mediterranean",
    restrictions: ["Vegetarian"],
    allergies: ["Peanuts"],
    label: "🥗 2,000 kcal Mediterranean Vegetarian",
  },
  {
    goal: "Weight Loss",
    calories: 1600,
    cuisine: "Any",
    restrictions: ["Low-Carb"],
    allergies: ["Gluten"],
    label: "🔥 1,600 kcal Low-Carb Fat Loss",
  },
  {
    goal: "Muscle Gain",
    calories: 2500,
    cuisine: "Any",
    restrictions: ["High-Protein"],
    allergies: [],
    label: "💪 2,500 kcal High-Protein Builder",
  },
];

const MealPlanner = () => {
  const [form, setForm] = useState({
    dietary_goal: "Balanced",
    calorie_target: 2000,
    cuisine_preference: "Mediterranean",
    num_days: 7,
  });
  const [restrictions, setRestrictions] = useState(["Vegetarian"]);
  const [allergies, setAllergies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState(null);
  const [activeDay, setActiveDay] = useState(0);

  const toggle = (arr, setArr, val) =>
    setArr(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);

  const generate = async (overrideForm = null) => {
    setLoading(true);
    setError(null);
    setPlan(null);
    const toastId = toast.loading("Nutritionist AI synthesizing your personalized meal plan...");

    const targetForm = overrideForm || form;
    try {
      const res = await fetch(`${API_BASE}/api/ai/meal-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...targetForm,
          dietary_restrictions: restrictions,
          allergies,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Meal plan generation failed");
      }

      const data = await res.json();
      setPlan(data);
      setActiveDay(0);
      toast.success("7-Day Personalized Meal Plan Ready! 🥗", { id: toastId });
    } catch (e) {
      setError(e.message);
      toast.error(e.message || "Failed to generate meal plan", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleSampleClick = (sample) => {
    const updated = {
      dietary_goal: sample.goal,
      calorie_target: sample.calories,
      cuisine_preference: sample.cuisine,
      num_days: 7,
    };
    setForm(updated);
    setRestrictions(sample.restrictions);
    setAllergies(sample.allergies);
    generate(updated);
  };

  const currentDay = plan?.days?.[activeDay];

  const MealCard = ({ meal, type, icon, label, accentColor }) => {
    if (!meal) return null;
    return (
      <div className={`mp-meal-card border-${accentColor}`}>
        <div className="mp-meal-card-top">
          <div className="mp-type-wrap">
            <span className="mp-type-icon">{icon}</span>
            <span className="mp-type-label">{label}</span>
          </div>
          <span className="mp-meal-cal">{meal.calories} kcal</span>
        </div>

        <div className="mp-meal-name">{meal.name}</div>
        <p className="mp-meal-desc">{meal.description}</p>

        {/* Macros */}
        <div className="mp-macros-row">
          <div className="mp-macro-chip">
            <span className="mp-m-val">{meal.protein_g}g</span>
            <span className="mp-m-lbl">Protein</span>
          </div>
          <div className="mp-macro-chip">
            <span className="mp-m-val">{meal.carbs_g}g</span>
            <span className="mp-m-lbl">Carbs</span>
          </div>
          <div className="mp-macro-chip">
            <span className="mp-m-val">{meal.fat_g}g</span>
            <span className="mp-m-lbl">Fat</span>
          </div>
          {meal.prep_time && (
            <div className="mp-macro-chip time-chip">
              <span className="mp-m-val">⏱️ {meal.prep_time}</span>
            </div>
          )}
        </div>

        {meal.health_benefit && (
          <div className="mp-benefit-box">
            <span>✨</span> <strong>Benefit:</strong> {meal.health_benefit}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="meal-page">
      {/* Top Header */}
      <header className="mp-header">
        <div className="mp-header-left">
          <Link to="/dashboard" className="mp-back-btn">
            ← Dashboard
          </Link>
          <div className="mp-titles">
            <div className="mp-badge-row">
              <span className="mp-pill">Phase 6 Active</span>
              <span className="mp-pill-sub">🥗 AI Nutrition & Meal Planning</span>
            </div>
            <h1 className="mp-page-title">Personalized Weekly Meal Planner</h1>
            <p className="mp-page-desc">
              Generate scientifically balanced weekly meal plans tailored to your biometric calorie targets, dietary goals, and allergen profiles.
            </p>
          </div>
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="mp-container">
        {/* Left Column: Plan Configuration */}
        <div className="mp-config-col">
          <div className="mp-card">
            <h2 className="mp-card-title">1. Plan Configuration</h2>
            <p className="mp-card-subtitle">
              Customize your wellness targets, macro splits, and ingredient exclusions.
            </p>

            {/* Dietary Goal */}
            <div className="mp-form-group">
              <label className="mp-form-label">Dietary Goal</label>
              <select
                className="mp-select"
                value={form.dietary_goal}
                onChange={(e) => setForm({ ...form, dietary_goal: e.target.value })}
              >
                {DIETARY_GOALS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            {/* Calorie Target Slider */}
            <div className="mp-form-group">
              <div className="mp-label-row">
                <label className="mp-form-label">Daily Calorie Target</label>
                <span className="mp-cal-counter">{form.calorie_target} kcal</span>
              </div>
              <input
                type="range"
                min="1200"
                max="3500"
                step="50"
                className="mp-range-slider"
                value={form.calorie_target}
                onChange={(e) => setForm({ ...form, calorie_target: Number(e.target.value) })}
              />
              <div className="mp-range-bounds">
                <span>1,200 kcal</span>
                <span>2,200 kcal (Average)</span>
                <span>3,500 kcal</span>
              </div>
            </div>

            {/* Cuisine Preference */}
            <div className="mp-form-group">
              <label className="mp-form-label">Cuisine Preference</label>
              <select
                className="mp-select"
                value={form.cuisine_preference}
                onChange={(e) => setForm({ ...form, cuisine_preference: e.target.value })}
              >
                {CUISINES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Dietary Restrictions Pills */}
            <div className="mp-form-group">
              <label className="mp-form-label">Dietary Restrictions</label>
              <div className="mp-pills-wrap">
                {RESTRICTIONS.map((r) => {
                  const active = restrictions.includes(r);
                  return (
                    <button
                      key={r}
                      type="button"
                      className={`mp-tag-pill ${active ? "active" : ""}`}
                      onClick={() => toggle(restrictions, setRestrictions, r)}
                    >
                      {active ? "✓ " : "+ "}
                      {r}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Allergies Exclusions */}
            <div className="mp-form-group">
              <label className="mp-form-label">Allergy Avoidance</label>
              <div className="mp-pills-wrap">
                {ALLERGIES_LIST.map((a) => {
                  const active = allergies.includes(a);
                  return (
                    <button
                      key={a}
                      type="button"
                      className={`mp-tag-pill pill-allergy ${active ? "active" : ""}`}
                      onClick={() => toggle(allergies, setAllergies, a)}
                    >
                      {active ? "🚫 " : " "}
                      {a}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              className="mp-generate-btn"
              onClick={() => generate()}
              disabled={loading}
            >
              {loading ? "Generating 7-Day Plan..." : "✨ Generate 7-Day Meal Plan"}
            </button>

            {/* 1-Click Samples */}
            <div className="mp-samples-section">
              <div className="mp-samples-title">1-Click Starter Plans:</div>
              <div className="mp-samples-list">
                {SAMPLE_PLANS.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="mp-sample-card"
                    onClick={() => handleSampleClick(s)}
                    disabled={loading}
                  >
                    <span className="mp-sample-name">{s.label}</span>
                    <span className="mp-sample-arrow">→</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Generated Plan View */}
        <div className="mp-plan-col">
          {error && (
            <div className="mp-card mp-alert-error">
              <span className="mp-alert-icon">⚠️</span>
              <div className="mp-alert-content">
                <h3 className="mp-alert-title">Meal Plan Synthesis Error</h3>
                <p className="mp-alert-desc">{error}</p>
              </div>
            </div>
          )}

          {plan ? (
            <div className="mp-plan-view-container">
              {/* Plan Header Card */}
              <div className="mp-card mp-summary-card">
                <div className="mp-summary-top">
                  <div>
                    <span className="mp-summary-pill">Target: {plan.dietary_goal}</span>
                    <h2 className="mp-summary-title">{plan.plan_title}</h2>
                    <p className="mp-summary-desc">{plan.weekly_summary}</p>
                  </div>
                  <div className="mp-summary-cal-box">
                    <span className="mp-sc-val">{plan.avg_daily_calories}</span>
                    <span className="mp-sc-lbl">Avg kcal / Day</span>
                  </div>
                </div>

                {/* Day selector tabs */}
                <div className="mp-day-tabs">
                  {plan.days?.map((d, idx) => (
                    <button
                      key={idx}
                      className={`mp-day-tab ${activeDay === idx ? "active" : ""}`}
                      onClick={() => setActiveDay(idx)}
                    >
                      <span className="mp-day-label">{d.day.substring(0, 3)}</span>
                      <span className="mp-day-cal">{d.total_calories} kcal</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Day Meals */}
              {currentDay && (
                <div className="mp-card">
                  <div className="mp-day-overview-row">
                    <div>
                      <h3 className="mp-day-heading">{currentDay.day} Schedule</h3>
                      <div className="mp-wellness-tip">
                        💡 <strong>Daily Wellness Tip:</strong> {currentDay.daily_tip}
                      </div>
                    </div>
                    <div className="mp-water-box">
                      <span>💧 Target Hydration:</span> <strong>{currentDay.water_intake}</strong>
                    </div>
                  </div>

                  <div className="mp-meals-grid">
                    <MealCard
                      meal={currentDay.breakfast}
                      type="breakfast"
                      icon="☀️"
                      label="Morning Breakfast"
                      accentColor="amber"
                    />
                    <MealCard
                      meal={currentDay.lunch}
                      type="lunch"
                      icon="🌤️"
                      label="Midday Lunch"
                      accentColor="green"
                    />
                    <MealCard
                      meal={currentDay.dinner}
                      type="dinner"
                      icon="🌙"
                      label="Evening Dinner"
                      accentColor="blue"
                    />
                    <MealCard
                      meal={currentDay.snack}
                      type="snack"
                      icon="🍎"
                      label="Nutritive Snack"
                      accentColor="sage"
                    />
                  </div>
                </div>
              )}

              {/* Grocery List & Meal Prep Tips (2 Columns) */}
              <div className="mp-two-col-grid">
                {/* Grocery List */}
                <div className="mp-card mp-grocery-card">
                  <div className="mp-card-header-row">
                    <h3 className="mp-section-title">🛒 Weekly Grocery Checklist</h3>
                    <span className="mp-items-count">{plan.grocery_list?.length} items</span>
                  </div>
                  <div className="mp-grocery-checklist">
                    {plan.grocery_list?.map((item, idx) => (
                      <label key={idx} className="mp-grocery-item">
                        <input type="checkbox" className="mp-checkbox" />
                        <span className="mp-grocery-text">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Meal Prep Tips & Notes */}
                <div className="mp-card mp-prep-card">
                  <h3 className="mp-section-title">👨‍🍳 Batch Prep & Nutritionist Notes</h3>
                  <div className="mp-prep-list">
                    {plan.meal_prep_tips?.map((tip, idx) => (
                      <div key={idx} className="mp-prep-tip-item">
                        <span className="prep-tip-num">0{idx + 1}</span>
                        <span className="prep-tip-text">{tip}</span>
                      </div>
                    ))}
                  </div>

                  {plan.nutritionist_notes && (
                    <div className="mp-nutritionist-box">
                      <div className="mp-nb-title">
                        <span>📋</span> <strong>Registered Dietitian Note</strong>
                      </div>
                      <p>{plan.nutritionist_notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            !plan && (
              <div className="mp-card mp-placeholder-card">
                <span className="mp-placeholder-icon">🥗</span>
                <h3 className="mp-placeholder-title">Your 7-Day Plan Will Appear Here</h3>
                <p className="mp-placeholder-desc">
                  Select your dietary goal, set your daily calorie target on the left, and let Gemini Nutrition AI structure your week of wholesome meals and groceries.
                </p>
                <div className="mp-perks-list">
                  <div className="mp-perk-item">
                    <span>🔥</span> Exact calorie and macronutrient breakdown per meal
                  </div>
                  <div className="mp-perk-item">
                    <span>🛒</span> Auto-consolidated 7-day grocery shopping list
                  </div>
                  <div className="mp-perk-item">
                    <span>⏱️</span> Meal prep advice for streamlined weekday cooking
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default MealPlanner;
