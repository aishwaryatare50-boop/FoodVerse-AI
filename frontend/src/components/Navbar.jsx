import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Features', href: '/#features' },
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'Pricing', href: '/#pricing' },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <div className="logo-icon">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="12" fill="url(#logoGrad)" />
              <path d="M9 14c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <path d="M11 18c0 0 1-2 3-2s3 2 3 2" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="14" cy="11" r="1.5" fill="white"/>
              <defs>
                <linearGradient id="logoGrad" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#527d55"/>
                  <stop offset="1" stopColor="#3f6342"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="logo-text">Food<span className="logo-accent">Verse</span></span>
        </Link>

        {/* Desktop Nav */}
        <ul className="navbar-links">
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              <a href={link.href} className="nav-link">{link.label}</a>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <div className="navbar-cta">
          {user ? (
            <>
              <Link to="/dashboard" className="btn btn-secondary btn-sm">
                Dashboard
              </Link>
              <div className="user-avatar" onClick={handleLogout} title="Logout">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} />
                ) : (
                  <span>{user.name?.charAt(0).toUpperCase()}</span>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary btn-sm">Sign In</Link>
              <Link to="/signup" className="btn btn-primary btn-sm">Get Started</Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className={`hamburger ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span /><span /><span />
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        {NAV_LINKS.map((link) => (
          <a key={link.label} href={link.href} className="mobile-link">{link.label}</a>
        ))}
        <div className="mobile-cta">
          {user ? (
            <>
              <Link to="/dashboard" className="btn btn-primary">Dashboard</Link>
              <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary">Sign In</Link>
              <Link to="/signup" className="btn btn-primary">Get Started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
