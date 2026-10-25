import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';

const MODULES = [
  { icon: '🍽️', title: 'Food Recognition', desc: 'Upload food images to identify dishes and analyze nutrition.', href: '/dashboard/food-recognition', color: 'sage', status: 'available' },
  { icon: '🌿', title: 'Freshness Detection', desc: 'Check if your food is fresh, moderate, or spoiled.', href: '/dashboard/freshness', color: 'brown', status: 'available' },
  { icon: '🏪', title: 'Hygiene Monitor', desc: 'Inspect food preparation areas and verify sanitation standards.', href: '/dashboard/hygiene', color: 'terracotta', status: 'available' },
  { icon: '👨‍🍳', title: 'Smart Cooking', desc: 'Get personalized recipes and step-by-step guidance.', href: '/dashboard/cooking', color: 'gold', status: 'available' },
  { icon: '🥗', title: 'Meal Planner', desc: 'AI-generated weekly meal plans tailored to your goals.', href: '/dashboard/meal-plan', color: 'sage', status: 'available' },
  { icon: '📊', title: 'Analytics', desc: 'Track your nutrition trends and food habits over time.', href: '/dashboard/analytics', color: 'brown', status: 'available' },
];

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    analysesToday: 0,
    mealsLogged: 0,
    healthScore: 0,
    streakDays: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('fv_token') || localStorage.getItem('token');
        if (!token) return;
        const res = await fetch(`${API_BASE}/api/analytics/summary`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && data.data) {
          setStats({
            analysesToday: data.data.today.mealsCount || Object.values(data.data.moduleCounts || {}).reduce((a, b) => a + b, 0),
            mealsLogged: data.data.today.mealsCount || 0,
            healthScore: data.data.avgHealthScore || 0,
            streakDays: data.data.streakDays || 0,
          });
        }
      } catch (err) {
        // Quiet fallback
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className="dash-sidebar">
        <div className="dash-logo">
          <span className="dash-logo-icon">🌿</span>
          <span>Food<strong>Verse</strong></span>
        </div>
        <nav className="dash-nav">
          <Link to="/dashboard" className="dash-nav-item active">🏠 Dashboard</Link>
          <Link to="/dashboard/food-recognition" className="dash-nav-item">🍽️ Food Recognition</Link>
          <Link to="/dashboard/freshness" className="dash-nav-item">🌿 Freshness</Link>
          <Link to="/dashboard/hygiene" className="dash-nav-item">🏪 Hygiene Monitor</Link>
          <Link to="/dashboard/cooking" className="dash-nav-item">👨‍🍳 Smart Cooking</Link>
          <Link to="/dashboard/meal-plan" className="dash-nav-item">🥗 Meal Planner</Link>
          <Link to="/dashboard/analytics" className="dash-nav-item">📊 Analytics</Link>
        </nav>
        <div className="dash-sidebar-footer">
          <div className="dash-user-info">
            <div className="dash-avatar">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} />
              ) : (
                <span>{user?.name?.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div>
              <div className="dash-user-name">{user?.name}</div>
              <div className="dash-user-email">{user?.email}</div>
            </div>
          </div>
          <button onClick={logout} className="dash-logout">Sign Out</button>
        </div>
      </aside>

      {/* Main content */}
      <main className="dash-main">
        {/* Header */}
        <div className="dash-header">
          <div>
            <h1 className="dash-greeting">
              Good day, {user?.name?.split(' ')[0]}! 👋
            </h1>
            <p className="dash-subtitle">What would you like to analyze today?</p>
          </div>
        </div>

        {/* Quick stats */}
        <div className="dash-stats">
          {[
            { label: 'Analyses Today', value: stats.analysesToday, icon: '📊' },
            { label: 'Meals Logged', value: stats.mealsLogged, icon: '🍽️' },
            { label: 'Health Score', value: `${stats.healthScore}/100`, icon: '❤️' },
            { label: 'Streak Days', value: `${stats.streakDays}d`, icon: '🔥' },
          ].map((s) => (
            <div key={s.label} className="dash-stat-card card">
              <div className="dash-stat-icon">{s.icon}</div>
              <div className="dash-stat-value">{s.value}</div>
              <div className="dash-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Modules */}
        <div className="dash-modules-header">
          <h2 className="dash-section-title">AI Modules</h2>
          <p className="dash-section-sub">Select a module to get started</p>
        </div>
        <div className="dash-modules-grid">
          {MODULES.map((mod) => (
            <Link
              key={mod.title}
              to={mod.href}
              className={`dash-module-card dash-mod-${mod.color} ${mod.status === 'coming-soon' ? 'coming-soon' : ''}`}
            >
              <div className="dmc-icon">{mod.icon}</div>
              <div className="dmc-content">
                <h3 className="dmc-title">{mod.title}</h3>
                <p className="dmc-desc">{mod.desc}</p>
              </div>
              {mod.status === 'coming-soon' ? (
                <span className="dmc-badge dmc-soon">Soon</span>
              ) : (
                <span className="dmc-badge dmc-go">→</span>
              )}
            </Link>
          ))}
        </div>

        {/* Welcome card */}
        <div className="dash-welcome-card">
          <div className="dwc-left">
            <h3>🚀 Get Started with FoodVerse AI</h3>
            <p>Upload your first food image to experience AI-powered nutrition analysis, freshness detection, and personalized recommendations.</p>
            <Link to="/dashboard/food-recognition" className="btn btn-primary">
              🍽️ Analyze My First Meal
            </Link>
          </div>
          <div className="dwc-emoji">🥗🤖✨</div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
