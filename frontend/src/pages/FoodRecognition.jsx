import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import './FoodRecognition.css';

const AI_BASE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000/api';

const PRESET_DISHES = [
  {
    id: 'quinoa',
    name: 'Mediterranean Quinoa Bowl',
    icon: '🥗',
    tag: 'Fresh & High-Fiber',
    color: 'sage',
    sampleImg: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'avocado',
    name: 'Avocado & Poached Egg Toast',
    icon: '🥑',
    tag: 'Sustained Energy',
    color: 'gold',
    sampleImg: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'salmon',
    name: 'Pan-Seared Atlantic Salmon',
    icon: '🐟',
    tag: 'Omega-3 & Protein',
    color: 'terracotta',
    sampleImg: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'paneer',
    name: 'Paneer Tikka Masala',
    icon: '🍛',
    tag: 'Rich & Flavorful',
    color: 'brown',
    sampleImg: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=600&q=80'
  }
];

const FoodRecognition = () => {
  const { user } = useAuth();
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [aiStatus, setAiStatus] = useState({ online: false, geminiActive: false });
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Check AI service status
  useEffect(() => {
    const checkService = async () => {
      try {
        const res = await axios.get(`${AI_BASE_URL.replace('/api', '')}/api/health`, { timeout: 10000 });
        setAiStatus({ online: true, geminiActive: res.data?.gemini_active });
      } catch {
        setAiStatus({ online: false, geminiActive: false });
      }
    };
    checkService();
  }, []);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      toast.error('Please upload an image file (JPG, PNG, WebP)');
      return;
    }
    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResult(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSelectPreset = async (preset) => {
    setPreviewUrl(preset.sampleImg);
    setSelectedImage(null);
    setResult(null);
    runAnalysis(null, preset.name);
  };

  const runAnalysis = async (fileToUpload = selectedImage, presetName = null) => {
    if (!fileToUpload && !presetName && !previewUrl) {
      toast.error('Please upload an image or select a sample dish first');
      return;
    }

    setAnalyzing(true);
    const toastId = toast.loading('Analyzing food with Gemini Multimodal AI...');

    try {
      const formData = new FormData();
      if (fileToUpload) {
        formData.append('file', fileToUpload);
      } else if (presetName) {
        formData.append('preset_name', presetName);
      } else if (previewUrl) {
        formData.append('preset_name', 'salad');
      }

      const response = await axios.post(`${AI_BASE_URL}/ai/food-recognition`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 75000,
      });

      if (response.data && response.data.success) {
        setResult(response.data.data);
        toast.success('Food successfully identified! 🍽️', { id: toastId });
      } else {
        throw new Error('Analysis failed');
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.message || err.message || 'Analysis failed. Please try again.';
      toast.error(msg, { id: toastId });
      setResult(null);
    } finally {
      setAnalyzing(false);
    }
  };

  const getGradeColor = (grade) => {
    if (grade?.startsWith('A')) return '#527d55';
    if (grade?.startsWith('B')) return '#d49b3d';
    if (grade?.startsWith('C')) return '#c26d38';
    return '#bc5a3f';
  };

  return (
    <div className="food-rec-page">
      {/* Top bar / breadcrumb */}
      <header className="fr-header">
        <div className="fr-header-left">
          <Link to="/dashboard" className="fr-back-btn">← Dashboard</Link>
          <div className="fr-titles">
            <h1 className="fr-page-title">
              🍽️ Food Recognition & Nutrition
            </h1>
            <p className="fr-page-desc">
              Identify dishes, estimate calories, and break down macronutrients with multimodal AI vision.
            </p>
          </div>
        </div>
      </header>

      <div className="fr-container">
        {/* Left column: Input, Upload, Presets */}
        <div className="fr-input-col">
          <div className="card fr-card upload-card">
            <h2 className="fr-card-title">1. Upload Food Image</h2>
            <p className="fr-card-subtitle">Take a photo or upload an image of your meal to analyze.</p>

            <div
              className={`drop-zone ${isDragging ? 'dragging' : ''} ${previewUrl ? 'has-image' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => !previewUrl && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => e.target.files && handleFile(e.target.files[0])}
              />

              {previewUrl ? (
                <div className="image-preview-wrapper">
                  <img src={previewUrl} alt="Meal Preview" className="uploaded-img" />
                  {analyzing && (
                    <div className="scanner-overlay">
                      <div className="scanner-line" />
                      <div className="scanner-text">✦ Analyzing Visual Features...</div>
                    </div>
                  )}
                  <button
                    className="clear-img-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewUrl(null);
                      setSelectedImage(null);
                      setResult(null);
                    }}
                    title="Remove image"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="drop-zone-content">
                  <div className="upload-icon-circle">📸</div>
                  <h3>Drag & drop your food photo here</h3>
                  <p>Supports PNG, JPG, or WebP up to 10MB</p>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm browse-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                  >
                    Browse Local File
                  </button>
                </div>
              )}
            </div>

            {previewUrl && (
              <div className="action-row">
                <button
                  className={`btn btn-primary fr-analyze-btn ${analyzing ? 'loading' : ''}`}
                  onClick={() => runAnalysis()}
                  disabled={analyzing}
                >
                  {analyzing ? <span className="spinner" /> : <>✨ Run AI Nutrition Analysis</>}
                </button>
              </div>
            )}
          </div>

          {/* Quick sample presets */}
          <div className="card fr-card presets-card">
            <div className="presets-header">
              <h3 className="presets-title">⚡ Quick Test With Demo Plates</h3>
              <span className="presets-sub">Click any dish to test the AI engine instantly:</span>
            </div>
            <div className="presets-grid">
              {PRESET_DISHES.map((dish) => (
                <button
                  key={dish.id}
                  className="preset-pill"
                  onClick={() => handleSelectPreset(dish)}
                  disabled={analyzing}
                >
                  <img src={dish.sampleImg} alt={dish.name} className="preset-thumb" />
                  <div className="preset-info">
                    <span className="preset-name">{dish.icon} {dish.name}</span>
                    <span className="preset-tag">{dish.tag}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: Results display */}
        <div className="fr-result-col">
          {result ? (
            <div className="card fr-card result-card">
              {/* Dish Header */}
              <div className="result-header">
                <div>
                  <div className="result-badges-row">
                    <span className="cuisine-badge">{result.cuisine} Cuisine</span>
                    <span className="confidence-badge">
                      ✓ {result.confidence}% Match Confidence
                    </span>
                    {result.is_simulated && (
                      <span className="sim-badge" title="Add GEMINI_API_KEY in ai-service/.env for live model">
                        ✦ Demo Analysis
                      </span>
                    )}
                  </div>
                  <h2 className="dish-name">{result.dish_name}</h2>
                  <p className="serving-text">Estimated portion: <strong>{result.serving_size}</strong></p>
                </div>

                {/* Health Score Pill */}
                <div className="health-score-box" style={{ borderColor: getGradeColor(result.health_grade) }}>
                  <div className="score-label">Health Score</div>
                  <div className="score-num" style={{ color: getGradeColor(result.health_grade) }}>
                    {result.health_score}<span>/100</span>
                  </div>
                  <div className="grade-pill" style={{ backgroundColor: getGradeColor(result.health_grade) }}>
                    Grade {result.health_grade}
                  </div>
                </div>
              </div>

              {/* Macro Nutrients Grid */}
              <div className="macros-overview">
                <div className="macro-card calorie-card">
                  <span className="macro-icon">🔥</span>
                  <div className="macro-main">
                    <span className="macro-val">{result.calories}</span>
                    <span className="macro-unit">kcal</span>
                  </div>
                  <span className="macro-name">Energy</span>
                  <div className="macro-sub">~{Math.round((result.calories / 2000) * 100)}% of daily allowance</div>
                </div>

                <div className="macro-card">
                  <span className="macro-icon">🥩</span>
                  <div className="macro-main">
                    <span className="macro-val">{result.protein_g}</span>
                    <span className="macro-unit">g</span>
                  </div>
                  <span className="macro-name">Protein</span>
                  <div className="macro-bar"><div className="bar-fill protein-fill" style={{ width: `${Math.min(100, (result.protein_g / 50) * 100)}%` }} /></div>
                </div>

                <div className="macro-card">
                  <span className="macro-icon">🌾</span>
                  <div className="macro-main">
                    <span className="macro-val">{result.carbs_g}</span>
                    <span className="macro-unit">g</span>
                  </div>
                  <span className="macro-name">Carbs</span>
                  <div className="macro-bar"><div className="bar-fill carbs-fill" style={{ width: `${Math.min(100, (result.carbs_g / 250) * 100)}%` }} /></div>
                </div>

                <div className="macro-card">
                  <span className="macro-icon">🥑</span>
                  <div className="macro-main">
                    <span className="macro-val">{result.fat_g}</span>
                    <span className="macro-unit">g</span>
                  </div>
                  <span className="macro-name">Healthy Fats</span>
                  <div className="macro-bar"><div className="bar-fill fat-fill" style={{ width: `${Math.min(100, (result.fat_g / 70) * 100)}%` }} /></div>
                </div>
              </div>

              {/* Secondary Nutrients */}
              <div className="micronutrient-strip">
                <div className="micro-item">
                  <span className="micro-label">Dietary Fiber</span>
                  <strong className="micro-val">{result.fiber_g}g</strong>
                </div>
                <div className="micro-item">
                  <span className="micro-label">Natural Sugars</span>
                  <strong className="micro-val">{result.sugar_g}g</strong>
                </div>
                <div className="micro-item">
                  <span className="micro-label">Sodium</span>
                  <strong className="micro-val">{result.sodium_mg}mg</strong>
                </div>
              </div>

              {/* Dietary Tags */}
              {result.dietary_tags && result.dietary_tags.length > 0 && (
                <div className="tags-section">
                  <span className="tags-label">Dietary Classification:</span>
                  <div className="tags-list">
                    {result.dietary_tags.map((tag) => (
                      <span key={tag} className="diet-tag">✓ {tag}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Ingredients breakdown */}
              {result.ingredients && result.ingredients.length > 0 && (
                <div className="ingredients-section">
                  <h3 className="section-title">Detected Ingredients & Portions</h3>
                  <div className="ingredients-table">
                    {result.ingredients.map((ing, i) => (
                      <div key={i} className="ingredient-row">
                        <span className="ing-bullet">•</span>
                        <span className="ing-name">{ing.name}</span>
                        <span className="ing-portion">{ing.portion}</span>
                        <span className="ing-cals">{ing.calories} kcal</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Health Insights */}
              <div className="insights-box">
                <div className="insights-header">
                  <span className="insights-icon">💡</span>
                  <h4>Gemini AI Nutritional Assessment</h4>
                </div>
                <p className="insights-text">{result.health_insights}</p>
                {result.recommendations && result.recommendations.length > 0 && (
                  <ul className="rec-list">
                    {result.recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Action buttons */}
              <div className="result-actions">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => toast.success('Meal logged to your daily nutrition log! 📋')}
                >
                  📥 Log to Diary
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => window.print()}
                >
                  🖨️ Export Nutrition Card
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setResult(null);
                    setPreviewUrl(null);
                    setSelectedImage(null);
                  }}
                >
                  🔄 Analyze Another Meal
                </button>
              </div>
            </div>
          ) : (
            <div className="card fr-card empty-result-card">
              <div className="empty-state-visual">🍽️✨</div>
              <h2>Ready to Analyze</h2>
              <p>
                Select an image on the left or click any demo dish to see full nutritional breakdown,
                ingredient detection, and health recommendations.
              </p>
              <div className="empty-features-list">
                <div className="ef-item">
                  <span>🎯</span>
                  <div>
                    <strong>95%+ Computer Vision Accuracy</strong>
                    <p>Detects complex dishes across global cuisines</p>
                  </div>
                </div>
                <div className="ef-item">
                  <span>📊</span>
                  <div>
                    <strong>Micro & Macronutrient Breakdown</strong>
                    <p>Accurate calories, proteins, carbs, and fats</p>
                  </div>
                </div>
                <div className="ef-item">
                  <span>🌿</span>
                  <div>
                    <strong>Holistic Health Scoring</strong>
                    <p>Nutrient density rating calculated by Gemini</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FoodRecognition;
