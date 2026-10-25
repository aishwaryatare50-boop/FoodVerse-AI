import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './Auth.css';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back! 🎉');
      navigate('/dashboard');
    } catch (err) {
      const errMsg = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || err.message || 'Login failed. Please check your credentials.';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Left decorative panel */}
      <div className="auth-panel">
        <div className="auth-panel-content">
          <div className="auth-panel-blob-1" />
          <div className="auth-panel-blob-2" />
          <Link to="/" className="auth-logo">
            <div className="logo-icon-auth">🌿</div>
            <span>Food<strong>Verse</strong></span>
          </Link>
          <div className="auth-panel-text">
            <h2>Your AI-Powered<br /><span>Food Intelligence</span><br />Companion</h2>
            <p>Analyze nutrition, detect freshness, plan meals, and monitor hygiene — all powered by Gemini AI.</p>
          </div>
          <div className="auth-panel-features">
            {[
              { icon: '🍽️', text: 'Food Recognition & Nutrition Analysis' },
              { icon: '🌿', text: 'Real-time Freshness Detection' },
              { icon: '🏪', text: 'Restaurant Hygiene Monitoring' },
              { icon: '🥗', text: 'Personalized Meal Planning' },
            ].map((f) => (
              <div key={f.text} className="apf-item">
                <span className="apf-icon">{f.icon}</span>
                <span>{f.text}</span>
              </div>
            ))}
          </div>
          <div className="auth-panel-quote">
            <p>"FoodVerse completely changed how I manage nutrition for my clients."</p>
            <div className="quote-author">— Priya Sharma, Nutritionist</div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-form-panel">
        <div className="auth-form-container">
          <Link to="/" className="auth-back">← Back to home</Link>

          <div className="auth-form-header">
            <h1 className="auth-title">Welcome back</h1>
            <p className="auth-subtitle">Sign in to your FoodVerse account</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Email Address</label>
              <div className="input-wrapper">
                <span className="input-icon">✉</span>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  className="form-input with-icon"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <div className="label-row">
                <label className="form-label" htmlFor="login-password">Password</label>
              </div>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  id="login-password"
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  className="form-input with-icon"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowPass(!showPass)}
                  aria-label="Toggle password visibility"
                >
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className={`btn btn-primary auth-submit ${loading ? 'loading' : ''}`}
              disabled={loading}
              id="login-submit-btn"
            >
              {loading ? <span className="spinner" /> : <>Sign In</>}
            </button>
          </form>

          <p className="auth-switch">
            Don't have an account?{' '}
            <Link to="/signup" className="auth-switch-link">Create one for free</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
