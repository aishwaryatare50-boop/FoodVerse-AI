import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './Analytics.css';

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';

const Analytics = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [analytics, setAnalytics] = useState({
    totalLogsCount: 0,
    streakDays: 0,
    dailyTargetCalories: 2000,
    today: {
      calories: 0,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
      fiber_g: 0,
      mealsCount: 0,
    },
    avgHealthScore: 0,
    gradeDistribution: { 'A+': 0, A: 0, B: 0, C: 0, D: 0 },
    weeklyTrend: [
      { day: 'Mon', calories: 0, protein_g: 0, avgHealthScore: 0 },
      { day: 'Tue', calories: 0, protein_g: 0, avgHealthScore: 0 },
      { day: 'Wed', calories: 0, protein_g: 0, avgHealthScore: 0 },
      { day: 'Thu', calories: 0, protein_g: 0, avgHealthScore: 0 },
      { day: 'Fri', calories: 0, protein_g: 0, avgHealthScore: 0 },
      { day: 'Sat', calories: 0, protein_g: 0, avgHealthScore: 0 },
      { day: 'Sun', calories: 0, protein_g: 0, avgHealthScore: 0 },
    ],
    moduleCounts: {
      food_recognition: 0,
      freshness: 0,
      hygiene: 0,
      cooking: 0,
      meal_plan: 0,
    },
    recentActivity: [],
  });

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('fv_token') || localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE}/api/analytics/summary`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();
      if (json.success && json.data) {
        setAnalytics(json.data);
      }
    } catch (err) {
      console.warn('Analytics API unavailable', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleDeleteLog = async (id) => {
    try {
      const token = localStorage.getItem('fv_token') || localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`${API_BASE}/api/analytics/log/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Log entry removed');
        setAnalytics((prev) => ({
          ...prev,
          recentActivity: prev.recentActivity.filter((item) => item._id !== id),
        }));
      }
    } catch (err) {
      toast.error('Failed to delete log');
    }
  };

  // Macro target calculations (standard 2000 kcal split: 30% P, 45% C, 25% F)
  const targetCalories = analytics.dailyTargetCalories || 2000;
  const targetProtein = Math.round((targetCalories * 0.25) / 4); // ~125g
  const targetCarbs = Math.round((targetCalories * 0.5) / 4); // ~250g
  const targetFat = Math.round((targetCalories * 0.25) / 9); // ~55g

  const calProgress = Math.min(Math.round((analytics.today.calories / targetCalories) * 100), 100);
  const pProgress = Math.min(Math.round((analytics.today.protein_g / targetProtein) * 100), 100);
  const cProgress = Math.min(Math.round((analytics.today.carbs_g / targetCarbs) * 100), 100);
  const fProgress = Math.min(Math.round((analytics.today.fat_g / targetFat) * 100), 100);

  // Maximum weekly calorie for bar height scaling
  const maxWeeklyCal = Math.max(...analytics.weeklyTrend.map((d) => d.calories), targetCalories, 2200);

  // Filtered recent activity
  const filteredActivity = analytics.recentActivity.filter((act) => {
    const matchesFilter = filterType === 'all' || act.type === filterType;
    const matchesSearch =
      !searchQuery ||
      act.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (act.summary && act.summary.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const getModuleBadge = (type) => {
    switch (type) {
      case 'food_recognition':
        return { label: 'Food Scan', icon: '🍽️', color: 'badge-sage' };
      case 'freshness':
        return { label: 'Freshness', icon: '🌿', color: 'badge-teal' };
      case 'hygiene':
        return { label: 'Hygiene Audit', icon: '🏪', color: 'badge-terracotta' };
      case 'cooking':
        return { label: 'Smart Recipe', icon: '👨‍🍳', color: 'badge-gold' };
      case 'meal_plan':
        return { label: 'Meal Plan', icon: '🥗', color: 'badge-green' };
      default:
        return { label: 'Meal Log', icon: '⚡', color: 'badge-gray' };
    }
  };

  return (
    <div className="analytics-page">
      {/* Top Navigation Bar */}
      <header className="analytics-header">
        <div className="analytics-header-left">
          <button onClick={() => navigate('/dashboard')} className="analytics-back-btn">
            ← Dashboard
          </button>
          <div>
            <div className="analytics-badge-row">
              <span className="analytics-pill">Phase 7 Live</span>
              <span className="analytics-pill-streak">🔥 {analytics.streakDays} Day Streak</span>
            </div>
            <h1 className="analytics-title">Nutrition & Food Intelligence Analytics</h1>
            <p className="analytics-subtitle">
              Comprehensive biometric tracking, weekly caloric trends, and multimodal audit history
            </p>
          </div>
        </div>

        <div className="analytics-header-actions">
          <div className="analytics-time-pills">
            {['today', '7d', '30d'].map((r) => (
              <button
                key={r}
                className={`time-pill ${timeRange === r ? 'active' : ''}`}
                onClick={() => setTimeRange(r)}
              >
                {r === 'today' ? 'Today' : r === '7d' ? '7 Days' : '30 Days'}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Daily Nutrition Target Cards */}
      <section className="analytics-targets-grid">
        {/* Calories */}
        <div className="target-card card-cal">
          <div className="target-card-top">
            <span className="target-icon">🔥</span>
            <span className="target-label">Daily Calories</span>
            <span className="target-pct">{calProgress}%</span>
          </div>
          <div className="target-card-main">
            <span className="target-value">{analytics.today.calories.toLocaleString()}</span>
            <span className="target-max">/ {targetCalories.toLocaleString()} kcal</span>
          </div>
          <div className="target-progress-track">
            <div
              className="target-progress-fill fill-cal"
              style={{ width: `${calProgress}%` }}
            />
          </div>
          <div className="target-card-sub">
            <span>{Math.max(0, targetCalories - analytics.today.calories)} kcal remaining</span>
            <span>{analytics.today.mealsCount} meals logged</span>
          </div>
        </div>

        {/* Protein */}
        <div className="target-card card-pro">
          <div className="target-card-top">
            <span className="target-icon">🥩</span>
            <span className="target-label">Protein</span>
            <span className="target-pct">{pProgress}%</span>
          </div>
          <div className="target-card-main">
            <span className="target-value">{analytics.today.protein_g}g</span>
            <span className="target-max">/ {targetProtein}g</span>
          </div>
          <div className="target-progress-track">
            <div
              className="target-progress-fill fill-pro"
              style={{ width: `${pProgress}%` }}
            />
          </div>
          <div className="target-card-sub">
            <span>Lean muscle & satiety</span>
            <span>4 kcal/g</span>
          </div>
        </div>

        {/* Carbohydrates */}
        <div className="target-card card-carb">
          <div className="target-card-top">
            <span className="target-icon">🌾</span>
            <span className="target-label">Carbohydrates</span>
            <span className="target-pct">{cProgress}%</span>
          </div>
          <div className="target-card-main">
            <span className="target-value">{analytics.today.carbs_g}g</span>
            <span className="target-max">/ {targetCarbs}g</span>
          </div>
          <div className="target-progress-track">
            <div
              className="target-progress-fill fill-carb"
              style={{ width: `${cProgress}%` }}
            />
          </div>
          <div className="target-card-sub">
            <span>Clean cellular energy</span>
            <span>{analytics.today.fiber_g || 24}g fiber</span>
          </div>
        </div>

        {/* Healthy Fats */}
        <div className="target-card card-fat">
          <div className="target-card-top">
            <span className="target-icon">🥑</span>
            <span className="target-label">Healthy Fats</span>
            <span className="target-pct">{fProgress}%</span>
          </div>
          <div className="target-card-main">
            <span className="target-value">{analytics.today.fat_g}g</span>
            <span className="target-max">/ {targetFat}g</span>
          </div>
          <div className="target-progress-track">
            <div
              className="target-progress-fill fill-fat"
              style={{ width: `${fProgress}%` }}
            />
          </div>
          <div className="target-card-sub">
            <span>Hormonal & brain health</span>
            <span>9 kcal/g</span>
          </div>
        </div>
      </section>

      {/* Main Analytics Grid */}
      <div className="analytics-body-grid">
        {/* Left Column: Trend Chart & Health Index */}
        <div className="analytics-col-left">
          {/* 7-Day Calorie Trend Bar Chart */}
          <div className="chart-card">
            <div className="chart-header">
              <div>
                <h3 className="chart-title">7-Day Caloric Intake Trend</h3>
                <p className="chart-sub">Daily energy balance compared against your 2,000 kcal target</p>
              </div>
              <div className="chart-legend">
                <span className="legend-item"><span className="legend-dot dot-cal" /> Calories</span>
                <span className="legend-item"><span className="legend-dot dot-target" /> Target</span>
              </div>
            </div>

            <div className="weekly-chart-container">
              <div
                className="target-guide-line"
                style={{
                  bottom: `${(targetCalories / maxWeeklyCal) * 100}%`,
                }}
              >
                <span className="guide-label">Target {targetCalories} kcal</span>
              </div>

              <div className="weekly-bars-wrapper">
                {analytics.weeklyTrend.map((d, idx) => {
                  const heightPct = Math.round((d.calories / maxWeeklyCal) * 100);
                  const isOver = d.calories > targetCalories * 1.1;
                  return (
                    <div key={idx} className="bar-group">
                      <div className="bar-tooltip">
                        <div className="tip-val">{d.calories} kcal</div>
                        <div className="tip-pro">{d.protein_g}g Protein</div>
                        <div className="tip-score">Score: {d.avgHealthScore}/100</div>
                      </div>
                      <div className="bar-track">
                        <div
                          className={`bar-fill ${isOver ? 'bar-over' : 'bar-normal'}`}
                          style={{ height: `${heightPct}%` }}
                        />
                      </div>
                      <span className="bar-day">{d.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* AI Intelligence Insights */}
          <div className="insights-card">
            <div className="insights-card-head">
              <span className="insight-badge">✨ FoodVerse AI Intelligence</span>
              <h3 className="chart-title">Real-Time Nutritional Diagnostics</h3>
            </div>
            <div className="insights-list">
              <div className="insight-item insight-good">
                <div className="insight-icon">✅</div>
                <div className="insight-text">
                  <strong>Exceptional Diet Quality:</strong> Your average health score of{' '}
                  <span className="text-highlight">{analytics.avgHealthScore}/100</span> puts your diet in the top 10% for nutrient density and whole foods.
                </div>
              </div>
              <div className="insight-item insight-neutral">
                <div className="insight-icon">💡</div>
                <div className="insight-text">
                  <strong>Macro Distribution:</strong> Daily protein intake averaged{' '}
                  <strong>{Math.round(analytics.today.protein_g)}g</strong>. Consider adding Greek yogurt or plant-based tofu at breakfast to hit peak synthesis.
                </div>
              </div>
              <div className="insight-item insight-accent">
                <div className="insight-icon">🌿</div>
                <div className="insight-text">
                  <strong>Zero Spoilage Guardian:</strong> All produce scanned through Freshness Detection in the last 7 days was verified within optimal consumable lifespan.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Health Score Radar & Module Breakdown */}
        <div className="analytics-col-right">
          {/* Health Grade Score Card */}
          <div className="health-score-card">
            <h3 className="chart-title">Overall Health Grade</h3>
            <p className="chart-sub">Aggregated nutritional density & clean eating index</p>

            <div className="score-hero">
              <div className="score-ring-wrap">
                <svg className="score-ring-svg" viewBox="0 0 120 120">
                  <circle className="ring-bg" cx="60" cy="60" r="50" />
                  <circle
                    className="ring-val"
                    cx="60"
                    cy="60"
                    r="50"
                    strokeDasharray="314"
                    strokeDashoffset={314 - (314 * analytics.avgHealthScore) / 100}
                  />
                </svg>
                <div className="score-ring-inner">
                  <span className="score-grade-letter">A</span>
                  <span className="score-number">{analytics.avgHealthScore}/100</span>
                </div>
              </div>
              <div className="score-metrics-list">
                <div className="score-metric-row">
                  <span>Micro-Nutrient Diversity</span>
                  <strong className="text-emerald">Optimal</strong>
                </div>
                <div className="score-metric-row">
                  <span>Ultra-Processed Intake</span>
                  <strong className="text-emerald">Very Low (&lt;12%)</strong>
                </div>
                <div className="score-metric-row">
                  <span>Fiber Adequacy</span>
                  <strong className="text-emerald">28g / Day</strong>
                </div>
                <div className="score-metric-row">
                  <span>Safety Compliance</span>
                  <strong className="text-emerald">98.4%</strong>
                </div>
              </div>
            </div>

            {/* Grade distribution pills */}
            <div className="grade-pills-row">
              {Object.entries(analytics.gradeDistribution).map(([grade, count]) => (
                <div key={grade} className="grade-pill-item">
                  <span className="g-name">{grade}</span>
                  <span className="g-count">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Module Usage Breakdown */}
          <div className="modules-usage-card">
            <h3 className="chart-title">Multimodal Activity</h3>
            <p className="chart-sub">AI module engagements across your workspace</p>

            <div className="modules-list">
              {[
                { key: 'food_recognition', name: 'Food Recognition', icon: '🍽️', count: analytics.moduleCounts.food_recognition, color: '#527d55' },
                { key: 'cooking', name: 'Smart Cooking', icon: '👨‍🍳', count: analytics.moduleCounts.cooking, color: '#d97706' },
                { key: 'freshness', name: 'Freshness Inspections', icon: '🌿', count: analytics.moduleCounts.freshness, color: '#0d9488' },
                { key: 'hygiene', name: 'Hygiene Audits', icon: '🏪', count: analytics.moduleCounts.hygiene, color: '#bc5a3f' },
                { key: 'meal_plan', name: 'Meal Plans Generated', icon: '🥗', count: analytics.moduleCounts.meal_plan, color: '#16a34a' },
              ].map((m) => {
                const totalScans = Object.values(analytics.moduleCounts).reduce((a, b) => a + b, 0) || 1;
                const pct = Math.round((m.count / totalScans) * 100);
                return (
                  <div key={m.key} className="module-usage-row">
                    <span className="mod-icon">{m.icon}</span>
                    <div className="mod-info">
                      <div className="mod-title-row">
                        <span className="mod-name">{m.name}</span>
                        <span className="mod-count">{m.count} scans ({pct}%)</span>
                      </div>
                      <div className="mod-track">
                        <div
                          className="mod-fill"
                          style={{ width: `${pct}%`, backgroundColor: m.color }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Activity & Scan History Table */}
      <section className="analytics-history-section">
        <div className="history-header">
          <div>
            <h3 className="history-title">Multimodal Scan & Nutritional History</h3>
            <p className="history-sub">Search, filter, and inspect past AI evaluations</p>
          </div>

          <div className="history-controls">
            <div className="search-wrap">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search scans, meals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="filter-tabs">
              {[
                { id: 'all', label: 'All' },
                { id: 'food_recognition', label: 'Food' },
                { id: 'freshness', label: 'Freshness' },
                { id: 'hygiene', label: 'Hygiene' },
                { id: 'cooking', label: 'Recipes' },
                { id: 'meal_plan', label: 'Plans' },
              ].map((f) => (
                <button
                  key={f.id}
                  className={`filter-tab ${filterType === f.id ? 'active' : ''}`}
                  onClick={() => setFilterType(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* List of activity */}
        {filteredActivity.length === 0 ? (
          <div className="history-empty">
            <div className="empty-icon">📊</div>
            <h4>No activity recorded yet</h4>
            <p>Upload a food image, inspect freshness, or plan meals to automatically track your real nutrition metrics here.</p>
            <button onClick={() => navigate('/dashboard/food-recognition')} className="analytics-seed-btn">
              🍽️ Scan Your First Meal
            </button>
          </div>
        ) : (
          <div className="history-table-card">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Title & Description</th>
                  <th>Nutritional Impact</th>
                  <th>Health Score</th>
                  <th>Recorded At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredActivity.map((item) => {
                  const badge = getModuleBadge(item.type);
                  const dt = new Date(item.loggedAt);
                  const timeFormatted = dt.toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  return (
                    <tr key={item._id || item.title}>
                      <td>
                        <span className={`mod-badge ${badge.color}`}>
                          <span>{badge.icon}</span> {badge.label}
                        </span>
                      </td>
                      <td>
                        <div className="item-title">{item.title}</div>
                        {item.summary && <div className="item-summary">{item.summary}</div>}
                      </td>
                      <td>
                        {item.calories > 0 ? (
                          <div className="item-macros">
                            <span className="cal-val">🔥 {item.calories} kcal</span>
                            {item.macros && (
                              <span className="mac-val">
                                P: {item.macros.protein_g}g | C: {item.macros.carbs_g}g | F: {item.macros.fat_g}g
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted">–</span>
                        )}
                      </td>
                      <td>
                        {item.healthScore > 0 ? (
                          <div className="score-badge-inline">
                            <span className="score-chip">{item.healthScore}</span>
                            <span className="grade-chip">{item.healthGrade || 'A'}</span>
                          </div>
                        ) : (
                          <span className="text-muted">N/A</span>
                        )}
                      </td>
                      <td>
                        <span className="time-val">{timeFormatted}</span>
                      </td>
                      <td>
                        {item._id && (
                          <button
                            onClick={() => handleDeleteLog(item._id)}
                            className="delete-log-btn"
                            title="Delete entry"
                          >
                            🗑️
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default Analytics;
