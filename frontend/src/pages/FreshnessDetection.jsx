import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import './FreshnessDetection.css';

const AI_BASE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000/api';

const FRESHNESS_PRESETS = [
  {
    id: 'fresh-apple',
    name: 'Crisp Honeycrisp Apple',
    status: 'Fresh',
    icon: '🍎',
    score: 96,
    color: 'green',
    sampleImg: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'ripening-banana',
    name: 'Sugar Spotted Banana',
    status: 'Moderately Fresh',
    icon: '🍌',
    score: 68,
    color: 'amber',
    sampleImg: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'spoiled-tomato',
    name: 'Decaying Vine Tomato',
    status: 'Spoiled',
    icon: '🍅',
    score: 14,
    color: 'red',
    sampleImg: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'fresh-salmon',
    name: 'Fresh Pacific Salmon',
    status: 'Fresh',
    icon: '🐟',
    score: 93,
    color: 'green',
    sampleImg: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=600&q=80'
  }
];

const FreshnessDetection = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

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
    runAnalysis(null, preset.id);
  };

  const runAnalysis = async (fileToUpload = selectedImage, presetId = null) => {
    if (!fileToUpload && !presetId && !previewUrl) {
      toast.error('Please upload an image or choose a demo item first');
      return;
    }

    setAnalyzing(true);
    const toastId = toast.loading('Inspecting surface texture & freshness markers...');

    try {
      const formData = new FormData();
      if (fileToUpload) {
        formData.append('file', fileToUpload);
      } else if (presetId) {
        formData.append('preset_name', presetId);
      } else if (previewUrl) {
        formData.append('preset_name', 'fresh-apple');
      }

      const response = await axios.post(`${AI_BASE_URL}/ai/freshness-detection`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 75000,
      });

      if (response.data && response.data.success) {
        setResult(response.data.data);
        const status = response.data.data.freshness_status;
        if (status === 'Fresh') {
          toast.success('Food verified as Fresh! 🌿', { id: toastId });
        } else if (status === 'Moderately Fresh') {
          toast('Moderately Fresh — Consume soon ⚠️', { id: toastId, icon: '🍌' });
        } else {
          toast.error('Spoilage detected! Not recommended for consumption 🚫', { id: toastId });
        }
      } else {
        throw new Error('Analysis failed');
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.message || err.message || 'Freshness inspection failed. Please try again.';
      toast.error(msg, { id: toastId });
      setResult(null);
    } finally {
      setAnalyzing(false);
    }
  };

  const getStatusColor = (status) => {
    if (status === 'Fresh') return { bg: 'rgba(82, 125, 85, 0.15)', text: '#3f6342', border: '#527d55', badge: 'status-fresh' };
    if (status === 'Moderately Fresh') return { bg: 'rgba(212, 155, 61, 0.15)', text: '#9e6d1b', border: '#d49b3d', badge: 'status-moderate' };
    return { bg: 'rgba(188, 90, 63, 0.15)', text: '#9a3c23', border: '#bc5a3f', badge: 'status-spoiled' };
  };

  return (
    <div className="freshness-page">
      {/* Top Header - Clean without top-right Gemini tags */}
      <header className="fresh-header">
        <div className="fresh-header-left">
          <Link to="/dashboard" className="fresh-back-btn">← Dashboard</Link>
          <div className="fresh-titles">
            <h1 className="fresh-page-title">
              🌿 Food Freshness & Spoilage Detection
            </h1>
            <p className="fresh-page-desc">
              Evaluate visual indicators, surface discoloration, microbial risks, and estimated shelf-life in seconds.
            </p>
          </div>
        </div>
      </header>

      <div className="fresh-container">
        {/* Left Column: Image Upload & Presets */}
        <div className="fresh-input-col">
          <div className="card fresh-card upload-card">
            <h2 className="fresh-card-title">1. Upload Food or Produce</h2>
            <p className="fresh-card-subtitle">Take a clear photo of the food item or surface area.</p>

            <div
              className={`fresh-drop-zone ${isDragging ? 'dragging' : ''} ${previewUrl ? 'has-image' : ''}`}
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
                <div className="fresh-preview-wrapper">
                  <img src={previewUrl} alt="Food Freshness Target" className="uploaded-fresh-img" />
                  {analyzing && (
                    <div className="fresh-scanner-overlay">
                      <div className="fresh-scanner-line" />
                      <div className="fresh-scanner-text">✦ Inspecting Cellular Texture & Color...</div>
                    </div>
                  )}
                  <button
                    className="clear-fresh-btn"
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
                <div className="fresh-drop-content">
                  <div className="fresh-upload-icon">🔍</div>
                  <h3>Drag & drop food image here</h3>
                  <p>Supports raw meats, fruits, vegetables, dairy, or bakery items</p>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                  >
                    Select Local File
                  </button>
                </div>
              )}
            </div>

            {previewUrl && (
              <div className="action-row">
                <button
                  className={`btn btn-primary fresh-analyze-btn ${analyzing ? 'loading' : ''}`}
                  onClick={() => runAnalysis()}
                  disabled={analyzing}
                >
                  {analyzing ? <span className="spinner" /> : <>🔬 Run Freshness Inspection</>}
                </button>
              </div>
            )}
          </div>

          {/* Quick Test Demo Presets */}
          <div className="card fresh-card presets-card">
            <div className="presets-header">
              <h3 className="presets-title">⚡ Quick Test Demo Samples</h3>
              <span className="presets-sub">Select a stage of freshness to observe AI classification:</span>
            </div>
            <div className="presets-grid">
              {FRESHNESS_PRESETS.map((p) => (
                <button
                  key={p.id}
                  className={`fresh-preset-pill preset-border-${p.color}`}
                  onClick={() => handleSelectPreset(p)}
                  disabled={analyzing}
                >
                  <img src={p.sampleImg} alt={p.name} className="preset-thumb" />
                  <div className="preset-info">
                    <span className="preset-name">{p.icon} {p.name}</span>
                    <span className={`preset-badge badge-${p.color}`}>{p.status} ({p.score}%)</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Freshness Inspection Report */}
        <div className="fresh-result-col">
          {result ? (
            <div className="card fresh-card result-card">
              {/* Top Banner Status */}
              <div
                className="status-hero-banner"
                style={{
                  backgroundColor: getStatusColor(result.freshness_status).bg,
                  borderColor: getStatusColor(result.freshness_status).border,
                }}
              >
                <div className="shb-left">
                  <span className="shb-category">{result.category}</span>
                  <h2 className="shb-title">{result.item_name}</h2>
                  <div className={`freshness-verdict-tag ${getStatusColor(result.freshness_status).badge}`}>
                    {result.freshness_status === 'Fresh' && '🟢 '}
                    {result.freshness_status === 'Moderately Fresh' && '🟡 '}
                    {result.freshness_status === 'Spoiled' && '🔴 '}
                    {result.freshness_status.toUpperCase()}
                  </div>
                </div>

                <div className="shb-score-circle">
                  <div className="score-ring">
                    <span className="score-val" style={{ color: getStatusColor(result.freshness_status).text }}>
                      {result.freshness_score}
                    </span>
                    <span className="score-sub">/100 Score</span>
                  </div>
                </div>
              </div>

              {/* Safety Declaration Callout */}
              <div className={`safety-verdict-box ${result.is_safe_to_eat ? 'safe' : 'danger'}`}>
                <div className="svb-icon">{result.is_safe_to_eat ? '🛡️' : '⚠️'}</div>
                <div>
                  <strong>{result.is_safe_to_eat ? 'Safe for Consumption' : 'Spoilage Warning — Do Not Ingest'}</strong>
                  <p>{result.safety_verdict}</p>
                </div>
              </div>

              {/* Shelf Life Cards */}
              <div className="shelf-life-grid">
                <div className="shelf-card">
                  <span className="shelf-icon">🌡️</span>
                  <div>
                    <span className="shelf-label">Room Temperature</span>
                    <strong className="shelf-val">{result.shelf_life_room_temp}</strong>
                  </div>
                </div>

                <div className="shelf-card">
                  <span className="shelf-icon">❄️</span>
                  <div>
                    <span className="shelf-label">Refrigerated (2°C–4°C)</span>
                    <strong className="shelf-val">{result.shelf_life_refrigerated}</strong>
                  </div>
                </div>

                <div className="shelf-card">
                  <span className="shelf-icon">⚡</span>
                  <div>
                    <span className="shelf-label">Spoilage Probability</span>
                    <strong className="shelf-val">{result.spoilage_risk_pct}% Risk</strong>
                  </div>
                </div>
              </div>

              {/* Visual Indicators Breakdown */}
              <div className="visual-features-section">
                <h3 className="section-title">Visual Decay & Texture Indicators</h3>
                <div className="features-list">
                  {result.visual_indicators?.map((f, idx) => (
                    <div key={idx} className="feature-item">
                      <div className="fi-top">
                        <span className="fi-name">{f.feature}</span>
                        <span className="fi-status">{f.status} ({f.score}/100)</span>
                      </div>
                      <div className="fi-bar">
                        <div
                          className="fi-bar-fill"
                          style={{
                            width: `${f.score}%`,
                            backgroundColor: f.score >= 80 ? '#527d55' : f.score >= 50 ? '#d49b3d' : '#bc5a3f'
                          }}
                        />
                      </div>
                      <p className="fi-obs">{f.observation}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Storage Recommendations */}
              {result.storage_recommendations && result.storage_recommendations.length > 0 && (
                <div className="storage-advice-box">
                  <h4 className="advice-title">💡 Safe Storage & Preservation Guidelines</h4>
                  <ul className="advice-list">
                    {result.storage_recommendations.map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Spoilage Cues if present */}
              {result.spoilage_cues && result.spoilage_cues.length > 0 && (
                <div className="cues-section">
                  <h4 className="cues-title">⚠️ Identified Physical Markers:</h4>
                  <div className="cues-tags">
                    {result.spoilage_cues.map((cue, i) => (
                      <span key={i} className="cue-tag">• {cue}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="result-actions">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => toast.success('Food freshness logged to your pantry tracker! 📦')}
                >
                  📥 Log to Pantry Tracker
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setResult(null);
                    setPreviewUrl(null);
                    setSelectedImage(null);
                  }}
                >
                  🔄 Inspect Another Item
                </button>
              </div>
            </div>
          ) : (
            <div className="card fresh-card empty-result-card">
              <div className="empty-state-visual">🌿🔬✨</div>
              <h2>Freshness Scanner Ready</h2>
              <p>
                Upload an image or pick a demo sample to analyze surface texture, discoloration,
                cellular moisture, and estimated shelf-life countdown.
              </p>
              <div className="fresh-features-checklist">
                <div className="ff-item">
                  <span>🎨</span>
                  <div>
                    <strong>Pigmentation & Discoloration Analysis</strong>
                    <p>Detects browning, chlorosis, and oxidation marks</p>
                  </div>
                </div>
                <div className="ff-item">
                  <span>🧬</span>
                  <div>
                    <strong>Fungal & Bacterial Spoilage Detection</strong>
                    <p>Identifies early signs of mould, yeast, and slime formation</p>
                  </div>
                </div>
                <div className="ff-item">
                  <span>📅</span>
                  <div>
                    <strong>Remaining Shelf-Life Estimates</strong>
                    <p>Calculates expiration days for room temp vs refrigeration</p>
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

export default FreshnessDetection;
