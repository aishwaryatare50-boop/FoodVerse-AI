import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './Auth.css';

const Signup = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const getPasswordStrength = (pass) => {
    if (!pass) return { level: 0, label: '', color: '' };
    let score = 0;
    if (pass.length >= 6) score++;
    if (pass.length >= 10) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    if (score <= 2) return { level: score, label: 'Weak', color: 'var(--terracotta-400)' };
    if (score <= 3) return { level: score, label: 'Fair', color: 'var(--gold-400)' };
    return { level: score, label: 'Strong', color: 'var(--sage-500)' };
  };

  const passwordStrength = getPasswordStrength(form.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error('Please fill in all fields');
      return;
    }
    if (form.password !== form.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success('Account created! Welcome to FoodVerse 🎉');
      navigate('/dashboard');
    } catch (err) {
      const errMsg = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || err.message || 'Registration failed. Please try again.';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page auth-page-signup">
      {/* Left panel */}
      <div className="auth-panel">
        <div className="auth-panel-content">
          <div className="auth-panel-blob-1" />
          <div className="auth-panel-blob-2" />
          <Link to="/" className="auth-logo">
            <div className="logo-icon-auth">🌿</div>
            <span>Food<strong>Verse</strong></span>
          </Link>
          <div className="auth-panel-text">
            <h2>Join the Future<br />of <span>Food Intelligence</span></h2>
            <p>Get started free. No credit card required. Analyze your first meal in seconds.</p>
          </div>
          <div className="auth-panel-features">
            {[
              { text: 'AI-powered food recognition' },
              { text: 'Real-time freshness & hygiene checks' },
              { text: 'Personalized nutrition & meal plans' },
              { text: 'Smart cooking assistance' },
            ].map((f) => (
              <div key={f.text} className="apf-item">
                <span className="apf-icon apf-check">✓</span>
                <span>{f.text}</span>
              </div>
            ))}
          </div>
          <div className="auth-panel-stats">
            <div className="ap-stat"><strong>10K+</strong><span>Users</span></div>
            <div className="ap-stat"><strong>98%</strong><span>Accuracy</span></div>
            <div className="ap-stat"><strong>150+</strong><span>Cuisines</span></div>
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="auth-form-panel">
        <div className="auth-form-container">
          <Link to="/" className="auth-back">← Back to home</Link>

          <div className="auth-form-header">
            <h1 className="auth-title">Create your account</h1>
            <p className="auth-subtitle">Start your food intelligence journey today</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label" htmlFor="signup-name">Full Name</label>
              <div className="input-wrapper">
                <span className="input-icon">👤</span>
                <input
                  id="signup-name"
                  name="name"
                  type="text"
                  className="form-input with-icon"
                  placeholder="Your full name"
                  value={form.name}
                  onChange={handleChange}
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="signup-email">Email Address</label>
              <div className="input-wrapper">
                <span className="input-icon">✉</span>
                <input
                  id="signup-email"
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
              <label className="form-label" htmlFor="signup-password">Password</label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  id="signup-password"
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  className="form-input with-icon"
                  placeholder="Create a strong password (min. 6 characters)"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
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
              {/* Password strength meter */}
              {form.password && (
                <div className="password-strength">
                  <div className="strength-bars">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="strength-bar"
                        style={{
                          background: i <= passwordStrength.level ? passwordStrength.color : 'var(--neutral-200)',
                        }}
                      />
                    ))}
                  </div>
                  <span className="strength-label" style={{ color: passwordStrength.color }}>
                    {passwordStrength.label}
                  </span>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="signup-confirm">Confirm Password</label>
              <div className="input-wrapper">
                <span className="input-icon">🔐</span>
                <input
                  id="signup-confirm"
                  name="confirm"
                  type={showPass ? 'text' : 'password'}
                  className={`form-input with-icon ${form.confirm && form.confirm !== form.password ? 'error' : ''}`}
                  placeholder="Repeat your password"
                  value={form.confirm}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
                {form.confirm && form.confirm === form.password && (
                  <span className="match-icon">✓</span>
                )}
              </div>
            </div>

            <p className="terms-text">
              By creating an account, you agree to our{' '}
              <a href="#" className="auth-switch-link">Terms of Service</a> and{' '}
              <a href="#" className="auth-switch-link">Privacy Policy</a>.
            </p>

            <button
              type="submit"
              className={`btn btn-primary auth-submit ${loading ? 'loading' : ''}`}
              disabled={loading}
              id="signup-submit-btn"
            >
              {loading ? <span className="spinner" /> : <>Create Account</>}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account?{' '}
            <Link to="/login" className="auth-switch-link">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
