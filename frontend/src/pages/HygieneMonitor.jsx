import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import "./HygieneMonitor.css";

const API_BASE = (import.meta.env.VITE_AI_SERVICE_URL || "http://localhost:8000/api").replace(/\/api$/, "");

const SAMPLE_KITCHENS = [
  {
    id: "prep-station",
    title: "Prep Station & Cutting Area",
    icon: "🔪",
    desc: "Stainless prep table & sanitization check",
    sampleImg: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "bakery",
    title: "Commercial Bakery Area",
    icon: "🥐",
    desc: "Baking zone & flour dust cleanliness audit",
    sampleImg: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "restaurant-line",
    title: "Hot Cook Line & Ranges",
    icon: "🍳",
    desc: "Ventilation hoods, grease traps & surfaces",
    sampleImg: "https://images.unsplash.com/photo-1578474846511-04ba529f0b88?auto=format&fit=crop&w=800&q=80",
  },
];

const GRADE_BADGE_STYLE = {
  A: { bg: "#dcfce7", text: "#15803d", border: "#bbf7d0" },
  B: { bg: "#fef3c7", text: "#b45309", border: "#fde68a" },
  C: { bg: "#ffedd5", text: "#c2410c", border: "#fed7aa" },
  D: { bg: "#fee2e2", text: "#b91c1c", border: "#fecaca" },
  F: { bg: "#fef2f2", text: "#991b1b", border: "#f87171" },
};

const HygieneMonitor = () => {
  const fileInputRef = useRef(null);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file (JPG, PNG, WebP)");
      return;
    }
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setError(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const clearImage = () => {
    setImage(null);
    setPreview(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const selectSample = async (sample) => {
    setPreview(sample.sampleImg);
    setImage(null);
    setResult(null);
    setError(null);
    setLoading(true);
    const toastId = toast.loading("Analyzing sample kitchen environment...");

    try {
      // Fetch the sample image blob to send to FastAPI
      const imgRes = await fetch(sample.sampleImg);
      const blob = await imgRes.blob();
      const file = new File([blob], `${sample.id}.jpg`, { type: "image/jpeg" });

      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${API_BASE}/api/ai/hygiene-analysis`, {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        throw new Error("Analysis failed");
      }
      const data = await res.json();
      setResult(data);
      toast.success("Hygiene audit complete! 🏪", { id: toastId });
    } catch (e) {
      setError(e.message);
      toast.error(e.message || "Could not analyze sample kitchen", { id: toastId });
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const analyze = async () => {
    if (!image) {
      toast.error("Please upload an image first");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    const toastId = toast.loading("AI Inspector evaluating kitchen environment...");

    try {
      const fd = new FormData();
      fd.append("file", image);
      const res = await fetch(`${API_BASE}/api/ai/hygiene-analysis`, {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Analysis request failed");
      }
      const data = await res.json();
      setResult(data);
      toast.success("Hygiene audit report generated!", { id: toastId });
    } catch (e) {
      setError(e.message);
      toast.error(e.message || "Failed to analyze image", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const gradeStyle = result?.compliance_grade
    ? GRADE_BADGE_STYLE[result.compliance_grade] || GRADE_BADGE_STYLE.B
    : GRADE_BADGE_STYLE.A;

  return (
    <div className="hygiene-page">
      {/* Top Navigation Bar */}
      <header className="hm-header">
        <div className="hm-header-left">
          <Link to="/dashboard" className="hm-back-btn">
            ← Dashboard
          </Link>
          <div className="hm-titles">
            <div className="hm-badge-row">
              <span className="hm-pill">Phase 4 Active</span>
              <span className="hm-pill-sub">🏪 Multimodal Hygiene & Safety</span>
            </div>
            <h1 className="hm-page-title">Kitchen Hygiene & Food Safety Monitor</h1>
            <p className="hm-page-desc">
              Inspect food preparation areas, verify sanitization standards, and calculate automated compliance grades with Gemini Vision.
            </p>
          </div>
        </div>
      </header>

      {/* Main Grid Container */}
      <div className="hm-container">
        {/* Left Column: Upload & Presets */}
        <div className="hm-input-col">
          <div className="hm-card">
            <h2 className="hm-card-title">1. Upload Kitchen Environment Photo</h2>
            <p className="hm-card-subtitle">
              Upload a clear photo of cooking surfaces, food prep stations, cold storage, or dishwashing zones.
            </p>

            <div
              className={`hm-dropzone ${dragging ? "drag-over" : ""} ${preview ? "has-preview" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => !preview && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => e.target.files && handleFile(e.target.files[0])}
              />

              {preview ? (
                <div className="hm-preview-wrapper">
                  <img src={preview} alt="Kitchen preview" className="hm-preview-img" />
                  {loading && (
                    <div className="hm-scanner-overlay">
                      <div className="hm-scanner-line" />
                      <div className="hm-scanner-text">✦ Inspecting Sanitation & Surfaces...</div>
                    </div>
                  )}
                  <button
                    className="hm-clear-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearImage();
                    }}
                    title="Remove image"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="hm-drop-content">
                  <span className="hm-drop-icon">🏪</span>
                  <div className="hm-drop-title">Drop your kitchen photo here</div>
                  <div className="hm-drop-sub">or click to browse your files</div>
                  <div className="hm-drop-formats">Supports JPG, PNG, WEBP (up to 15MB)</div>
                </div>
              )}
            </div>

            {preview && (
              <button
                className="hm-analyze-btn"
                onClick={analyze}
                disabled={loading}
              >
                {loading ? "Inspecting Surfaces..." : "🔍 Run Hygiene Inspection"}
              </button>
            )}

            {/* Presets */}
            <div className="hm-presets-section">
              <div className="hm-presets-title">Or test with a sample facility:</div>
              <div className="hm-presets-grid">
                {SAMPLE_KITCHENS.map((sample) => (
                  <button
                    key={sample.id}
                    className="hm-preset-card"
                    onClick={() => selectSample(sample)}
                    disabled={loading}
                  >
                    <span className="hm-preset-icon">{sample.icon}</span>
                    <div className="hm-preset-info">
                      <div className="hm-preset-name">{sample.title}</div>
                      <div className="hm-preset-desc">{sample.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Results */}
        <div className="hm-result-col">
          {/* Non-kitchen guardrail alert */}
          {result?.is_non_kitchen && (
            <div className="hm-card hm-alert-card">
              <span className="hm-alert-icon">🚫</span>
              <div className="hm-alert-content">
                <h3 className="hm-alert-title">Non-Kitchen Environment Detected</h3>
                <p className="hm-alert-desc">{result.non_kitchen_message}</p>
                <p className="hm-alert-hint">
                  Please upload a photo of a commercial, restaurant, or domestic food handling area.
                </p>
              </div>
            </div>
          )}

          {/* Error alert */}
          {error && (
            <div className="hm-card hm-alert-card alert-error">
              <span className="hm-alert-icon">⚠️</span>
              <div className="hm-alert-content">
                <h3 className="hm-alert-title">Inspection Request Error</h3>
                <p className="hm-alert-desc">{error}</p>
              </div>
            </div>
          )}

          {/* Valid Inspection Report */}
          {result && !result.is_non_kitchen ? (
            <div className="hm-results-container">
              {/* Score & Verdict Banner */}
              <div className="hm-card hm-verdict-card">
                <div className="hm-score-header">
                  <div
                    className="hm-grade-box"
                    style={{
                      background: gradeStyle.bg,
                      color: gradeStyle.text,
                      borderColor: gradeStyle.border,
                    }}
                  >
                    <span className="hm-grade-letter">Grade {result.compliance_grade}</span>
                    <span className="hm-grade-score">{result.overall_score}/100</span>
                  </div>

                  <div className="hm-verdict-text">
                    <div className="hm-status-row">
                      <span className={`hm-status-chip ${result.compliance_status === 'Compliant' ? 'chip-green' : 'chip-amber'}`}>
                        ● {result.compliance_status}
                      </span>
                      <span className="hm-audit-chip">
                        Inspection: {result.estimated_inspection_result}
                      </span>
                      <span className={`hm-safe-chip ${result.is_safe_for_food_prep ? 'chip-green' : 'chip-red'}`}>
                        {result.is_safe_for_food_prep ? '✓ Safe For Food Prep' : '✕ Requires Action'}
                      </span>
                    </div>
                    <h3 className="hm-location-title">{result.location_type}</h3>
                    <p className="hm-inspector-notes">{result.inspector_notes}</p>
                  </div>
                </div>
              </div>

              {/* Zone Scores Grid */}
              {result.zone_scores?.length > 0 && (
                <div className="hm-card">
                  <h3 className="hm-section-heading">📊 Zone-by-Zone Compliance Scores</h3>
                  <div className="hm-zones-grid">
                    {result.zone_scores.map((zone, idx) => (
                      <div key={idx} className="hm-zone-card">
                        <div className="hm-zone-top">
                          <span className="hm-zone-name">{zone.zone}</span>
                          <span className={`hm-zone-score-pill ${zone.status === 'Good' ? 'score-good' : zone.status === 'Fair' ? 'score-fair' : 'score-poor'}`}>
                            {zone.score}%
                          </span>
                        </div>
                        <div className="hm-zone-bar">
                          <div
                            className={`hm-zone-fill ${zone.status === 'Good' ? 'fill-good' : zone.status === 'Fair' ? 'fill-fair' : 'fill-poor'}`}
                            style={{ width: `${zone.score}%` }}
                          />
                        </div>
                        {zone.observations?.length > 0 && (
                          <div className="hm-zone-obs">{zone.observations[0]}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Violations List (if any) */}
              {result.violations?.length > 0 && (
                <div className="hm-card">
                  <h3 className="hm-section-heading">⚠️ Identified Hygiene Violations</h3>
                  <div className="hm-violations-list">
                    {result.violations.map((violation, idx) => (
                      <div key={idx} className={`hm-violation-item sev-${(violation.severity || 'minor').toLowerCase()}`}>
                        <div className="hm-v-icon">{violation.icon || '⚠️'}</div>
                        <div className="hm-v-content">
                          <div className="hm-v-header">
                            <span className="hm-v-category">{violation.category}</span>
                            <span className={`hm-v-sev sev-${(violation.severity || 'minor').toLowerCase()}`}>
                              {violation.severity} Severity
                            </span>
                          </div>
                          <div className="hm-v-desc">{violation.description}</div>
                          <div className="hm-v-rec">
                            <strong>Recommended Action:</strong> {violation.recommendation}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Findings & Actions (2 Columns) */}
              <div className="hm-two-col-grid">
                {/* Positive Findings */}
                <div className="hm-card hm-positive-card">
                  <h4 className="hm-subheading">✅ Positive Sanitation Findings</h4>
                  <ul className="hm-findings-list">
                    {result.positive_findings?.map((finding, idx) => (
                      <li key={idx}>
                        <span className="check-bullet">✓</span>
                        <span>{finding}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Priority Actions */}
                <div className="hm-card hm-actions-card">
                  <h4 className="hm-subheading">🎯 Corrective Priority Actions</h4>
                  <ul className="hm-findings-list">
                    {result.priority_actions?.map((action, idx) => (
                      <li key={idx}>
                        <span className="action-bullet">→</span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            !result && (
              <div className="hm-card hm-placeholder-card">
                <span className="hm-empty-icon">🏪</span>
                <h3 className="hm-empty-title">Awaiting Facility Image</h3>
                <p className="hm-empty-desc">
                  Select a sample facility on the left or upload your kitchen photo to run the AI food safety and hygiene audit.
                </p>
                <div className="hm-audit-points">
                  <div className="hm-point-item">
                    <span>✨</span> Food contact surface sanitization analysis
                  </div>
                  <div className="hm-point-item">
                    <span>🛡️</span> Cross-contamination and allergen safeguards
                  </div>
                  <div className="hm-point-item">
                    <span>📋</span> Regulatory inspection pass/conditional prediction
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

export default HygieneMonitor;
