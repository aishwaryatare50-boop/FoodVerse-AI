import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import "./SmartCooking.css";

const API_BASE = (import.meta.env.VITE_AI_SERVICE_URL || "http://localhost:8000/api").replace(/\/api$/, "");

const SAMPLE_PROMPTS = [
  {
    title: "Avocado & Egg Power Brunch",
    icon: "🥑",
    query: "Fresh avocado, pasture eggs, sourdough bread, cherry tomatoes, olive oil",
  },
  {
    title: "15-Min High-Protein Chicken Bowl",
    icon: "🍗",
    query: "Grilled chicken breast, quinoa, broccoli florets, lemon, garlic, tahini",
  },
  {
    title: "Mediterranean Tuscan White Bean Stew",
    icon: "🍲",
    query: "Cannellini beans, baby spinach, crushed tomatoes, rosemary, garlic, parmesan",
  },
];

const DIFFICULTY_STYLE = {
  Easy: { bg: "#dcfce7", text: "#15803d" },
  Medium: { bg: "#fef3c7", text: "#b45309" },
  Advanced: { bg: "#fee2e2", text: "#b91c1c" },
};

const SmartCooking = () => {
  const fileInputRef = useRef(null);
  const [inputMode, setInputMode] = useState("text"); // "text" | "image"
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [query, setQuery] = useState("");
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [activeRecipe, setActiveRecipe] = useState(0);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Please upload an image file (JPG, PNG, WebP)");
      return;
    }
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setError(null);
  };

  const clearImage = () => {
    setImage(null);
    setPreview(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSampleClick = (sample) => {
    setInputMode("text");
    setQuery(sample.query);
    triggerAnalysis(sample.query, null);
  };

  const triggerAnalysis = async (textQuery, imageFile) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setActiveRecipe(0);
    const toastId = toast.loading("Chef AI crafting personalized recipes...");

    try {
      const fd = new FormData();
      if (imageFile) {
        fd.append("file", imageFile);
      }
      if (textQuery && textQuery.trim()) {
        fd.append("query", textQuery.trim());
      }

      const res = await fetch(`${API_BASE}/api/ai/cooking-assistant`, {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Recipe generation failed");
      }

      const data = await res.json();
      setResult(data);
      toast.success("3 AI Recipes Generated! 👨‍🍳", { id: toastId });
    } catch (e) {
      setError(e.message);
      toast.error(e.message || "Could not generate recipes", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (inputMode === "image" && !image) {
      toast.error("Please upload a photo of your ingredients");
      return;
    }
    if (inputMode === "text" && !query.trim()) {
      toast.error("Please type your ingredients or dish query");
      return;
    }
    triggerAnalysis(query, image);
  };

  const currentRecipe = result?.recipes?.[activeRecipe];
  const diffStyle = currentRecipe
    ? DIFFICULTY_STYLE[currentRecipe.difficulty] || DIFFICULTY_STYLE.Medium
    : DIFFICULTY_STYLE.Medium;

  return (
    <div className="cooking-page">
      {/* Top Bar Header */}
      <header className="sc-header">
        <div className="sc-header-left">
          <Link to="/dashboard" className="sc-back-btn">
            ← Dashboard
          </Link>
          <div className="sc-titles">
            <div className="sc-badge-row">
              <span className="sc-pill">Phase 5 Active</span>
              <span className="sc-pill-sub">👨‍🍳 Culinary AI Assistant</span>
            </div>
            <h1 className="sc-page-title">Smart Cooking & AI Recipe Assistant</h1>
            <p className="sc-page-desc">
              Transform your available pantry ingredients or cravings into chef-crafted gourmet recipes with step-by-step guidance.
            </p>
          </div>
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="sc-container">
        {/* Left Column: Input Form & Sample Prompts */}
        <div className="sc-input-col">
          <div className="sc-card">
            <h2 className="sc-card-title">1. What would you like to cook?</h2>
            <p className="sc-card-subtitle">
              Describe ingredients you have on hand or upload a photo of your countertop.
            </p>

            {/* Input Mode Selector */}
            <div className="sc-mode-tabs">
              <button
                type="button"
                className={`sc-mode-btn ${inputMode === "text" ? "active" : ""}`}
                onClick={() => setInputMode("text")}
              >
                ✏️ Describe Ingredients
              </button>
              <button
                type="button"
                className={`sc-mode-btn ${inputMode === "image" ? "active" : ""}`}
                onClick={() => setInputMode("image")}
              >
                📷 Photo of Ingredients
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              {inputMode === "text" ? (
                <div className="sc-text-input-wrap">
                  <textarea
                    rows={4}
                    className="sc-textarea"
                    placeholder="e.g. 2 ripe avocados, sourdough bread, pasture eggs, goat cheese, red pepper flakes..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <div className="sc-hint-text">
                    💡 Tip: List anything in your fridge, dietary goals, or a specific cuisine craving.
                  </div>
                </div>
              ) : (
                <div
                  className={`sc-dropzone ${dragging ? "drag-over" : ""} ${preview ? "has-preview" : ""}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
                  }}
                  onClick={() => !preview && fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  />

                  {preview ? (
                    <div className="sc-preview-wrap">
                      <img src={preview} alt="Ingredient preview" className="sc-preview-img" />
                      <button
                        type="button"
                        className="sc-clear-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearImage();
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="sc-drop-content">
                      <span className="sc-drop-icon">📸</span>
                      <div className="sc-drop-title">Snap or drop your ingredient photo</div>
                      <div className="sc-drop-sub">Our AI vision detects all pantry items</div>
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                className="sc-submit-btn"
                disabled={loading || (inputMode === "text" && !query.trim()) || (inputMode === "image" && !image)}
              >
                {loading ? "Chef AI Is Cooking Up Recipes..." : "👨‍🍳 Generate Chef Recipes"}
              </button>
            </form>

            {/* Quick Sample Prompts */}
            <div className="sc-samples-section">
              <div className="sc-samples-label">Quick 1-Click Inspiration:</div>
              <div className="sc-samples-list">
                {SAMPLE_PROMPTS.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="sc-sample-btn"
                    onClick={() => handleSampleClick(sample)}
                    disabled={loading}
                  >
                    <span className="sc-sample-icon">{sample.icon}</span>
                    <div className="sc-sample-info">
                      <div className="sc-sample-title">{sample.title}</div>
                      <div className="sc-sample-query">{sample.query}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Recipe Output */}
        <div className="sc-result-col">
          {/* Non-food guardrail error */}
          {result?.is_non_food && (
            <div className="sc-card sc-alert-card">
              <span className="sc-alert-icon">🚫</span>
              <div className="sc-alert-content">
                <h3 className="sc-alert-title">No Edible Ingredients Detected</h3>
                <p className="sc-alert-desc">{result.non_food_message}</p>
              </div>
            </div>
          )}

          {/* Request error */}
          {error && (
            <div className="sc-card sc-alert-card sc-alert-error">
              <span className="sc-alert-icon">⚠️</span>
              <div className="sc-alert-content">
                <h3 className="sc-alert-title">Culinary AI Assistant Notice</h3>
                <p className="sc-alert-desc">{error}</p>
              </div>
            </div>
          )}

          {/* Recipe Results View */}
          {result && !result.is_non_food && result.recipes?.length > 0 ? (
            <div className="sc-recipe-results">
              {/* Detected Ingredients Bar */}
              {result.detected_ingredients?.length > 0 && (
                <div className="sc-card sc-ingredients-bar">
                  <span className="sc-ing-label">Detected Ingredients:</span>
                  <div className="sc-ing-tags">
                    {result.detected_ingredients.map((ing, i) => (
                      <span key={i} className="sc-ing-tag">
                        ✓ {ing}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Recipe Tabs */}
              <div className="sc-recipe-nav-tabs">
                {result.recipes.map((rec, idx) => (
                  <button
                    key={idx}
                    className={`sc-recipe-tab ${activeRecipe === idx ? "active" : ""}`}
                    onClick={() => setActiveRecipe(idx)}
                  >
                    <span className="sc-tab-num">0{idx + 1}</span>
                    <span className="sc-tab-name">{rec.recipe_name}</span>
                    <span className="sc-tab-cal">{rec.calories_per_serving} kcal</span>
                  </button>
                ))}
              </div>

              {/* Active Recipe Card */}
              {currentRecipe && (
                <div className="sc-card sc-recipe-hero">
                  {/* Hero Header */}
                  <div className="sc-recipe-top">
                    <div>
                      <div className="sc-recipe-badges">
                        <span className="sc-badge-cuisine">🌍 {currentRecipe.cuisine}</span>
                        <span
                          className="sc-badge-diff"
                          style={{
                            background: diffStyle.bg,
                            color: diffStyle.text,
                          }}
                        >
                          ● {currentRecipe.difficulty}
                        </span>
                        {currentRecipe.dietary_tags?.map((t, idx) => (
                          <span key={idx} className="sc-badge-tag">
                            {t}
                          </span>
                        ))}
                      </div>
                      <h2 className="sc-hero-title">{currentRecipe.recipe_name}</h2>
                      <p className="sc-hero-desc">{currentRecipe.description}</p>
                    </div>

                    {/* Health score pill */}
                    <div className="sc-hero-score-badge">
                      <span className="sc-hscore-val">{currentRecipe.health_score}</span>
                      <span className="sc-hscore-lbl">Health Score</span>
                    </div>
                  </div>

                  {/* Macro & Time Quick Row */}
                  <div className="sc-recipe-metrics-row">
                    <div className="sc-metric-box">
                      <span className="sc-m-icon">⏱️</span>
                      <div>
                        <div className="sc-m-label">Prep Time</div>
                        <div className="sc-m-val">{currentRecipe.prep_time}</div>
                      </div>
                    </div>
                    <div className="sc-metric-box">
                      <span className="sc-m-icon">🍳</span>
                      <div>
                        <div className="sc-m-label">Cook Time</div>
                        <div className="sc-m-val">{currentRecipe.cook_time}</div>
                      </div>
                    </div>
                    <div className="sc-metric-box">
                      <span className="sc-m-icon">👥</span>
                      <div>
                        <div className="sc-m-label">Servings</div>
                        <div className="sc-m-val">{currentRecipe.servings} portions</div>
                      </div>
                    </div>
                    <div className="sc-metric-box">
                      <span className="sc-m-icon">🔥</span>
                      <div>
                        <div className="sc-m-label">Energy</div>
                        <div className="sc-m-val">{currentRecipe.calories_per_serving} kcal</div>
                      </div>
                    </div>
                  </div>

                  {/* Ingredients Checklist */}
                  <div className="sc-ing-section">
                    <h4 className="sc-section-title">🛒 Ingredients Breakdown</h4>
                    <div className="sc-ing-columns">
                      <div className="sc-ing-col">
                        <div className="sc-col-head text-green">✓ In Your Pantry</div>
                        <div className="sc-col-list">
                          {currentRecipe.ingredients_used?.map((item, i) => (
                            <div key={i} className="sc-ing-check-item">
                              <span className="bullet-green">●</span> {item}
                            </div>
                          ))}
                        </div>
                      </div>
                      {currentRecipe.missing_ingredients?.length > 0 && (
                        <div className="sc-ing-col">
                          <div className="sc-col-head text-amber">+ Additional Items Needed</div>
                          <div className="sc-col-list">
                            {currentRecipe.missing_ingredients.map((item, i) => (
                              <div key={i} className="sc-ing-check-item">
                                <span className="bullet-amber">+</span> {item}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Step-by-Step Cooking Guide */}
                  <div className="sc-steps-section">
                    <h4 className="sc-section-title">👨‍🍳 Step-by-Step Culinary Instructions</h4>
                    <div className="sc-steps-list">
                      {currentRecipe.steps?.map((step) => (
                        <div key={step.step_number} className="sc-step-item">
                          <div className="sc-step-number">{step.step_number}</div>
                          <div className="sc-step-body">
                            <div className="sc-step-head">
                              <span className="sc-step-title">{step.title}</span>
                              <span className="sc-step-duration">⏱️ {step.duration}</span>
                            </div>
                            <p className="sc-step-inst">{step.instruction}</p>
                            {step.tip && (
                              <div className="sc-step-tip">
                                💡 <strong>Chef Tip:</strong> {step.tip}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Plating and Chef Secret */}
                  <div className="sc-chef-insights-grid">
                    {currentRecipe.chef_tip && (
                      <div className="sc-chef-card chef-pro-tip">
                        <div className="sc-cc-head">
                          <span>✨</span> <strong>Executive Chef Secret</strong>
                        </div>
                        <p>{currentRecipe.chef_tip}</p>
                      </div>
                    )}
                    {currentRecipe.plating_suggestion && (
                      <div className="sc-chef-card chef-plating">
                        <div className="sc-cc-head">
                          <span>🍽️</span> <strong>Plating & Presentation</strong>
                        </div>
                        <p>{currentRecipe.plating_suggestion}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            !result && (
              <div className="sc-card sc-placeholder-card">
                <span className="sc-placeholder-icon">👨‍🍳</span>
                <h3 className="sc-placeholder-title">Your AI Executive Chef is Ready</h3>
                <p className="sc-placeholder-desc">
                  Select a recipe idea on the left or type your available ingredients to generate 3 customized recipes with cook times, macros, and culinary steps.
                </p>
                <div className="sc-perks-list">
                  <div className="sc-perk-item">
                    <span>⚡</span> 3 Diverse recipes per prompt
                  </div>
                  <div className="sc-perk-item">
                    <span>🥗</span> Calorie & health score breakdown
                  </div>
                  <div className="sc-perk-item">
                    <span>🍳</span> Clear step-by-step instructions with chef secrets
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

export default SmartCooking;
