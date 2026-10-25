import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './Landing.css';

// Feature data
const FEATURES = [
  {
    icon: '🍽️',
    title: 'Food Recognition',
    desc: 'Upload any food photo — our AI instantly identifies dishes, ingredients, and cuisine types with high accuracy.',
    color: 'sage',
  },
  {
    icon: '📊',
    title: 'Nutrition Analysis',
    desc: 'Get estimated calories, macros (protein, carbs, fats), vitamins, and an overall health score for every meal.',
    color: 'brown',
  },
  {
    icon: '🌿',
    title: 'Freshness Detection',
    desc: 'AI-powered visual inspection classifies food as Fresh, Moderately Fresh, or Spoiled using color & texture analysis.',
    color: 'cream',
  },
  {
    icon: '🏪',
    title: 'Hygiene Monitoring',
    desc: 'Analyze kitchen videos for glove use, hair-cap compliance, cleanliness, and food handling safety.',
    color: 'terracotta',
  },
  {
    icon: '👨‍🍳',
    title: 'Smart Cooking',
    desc: 'Get personalized recipes, step-by-step guidance, and ingredient substitution suggestions in real time.',
    color: 'gold',
  },
  {
    icon: '🥗',
    title: 'Meal Planning',
    desc: 'AI-powered meal plans tailored to your dietary goals, allergies, and preferences — updated weekly.',
    color: 'sage',
  },
];

const STATS = [
  { value: '10K+', label: 'Food Items Recognized' },
  { value: '98%', label: 'Freshness Accuracy' },
  { value: '150+', label: 'Cuisine Types' },
  { value: '24/7', label: 'AI Availability' },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Upload or Describe',
    desc: 'Share a food image, video, or simply describe what you want to analyze.',
    icon: '📤',
  },
  {
    step: '02',
    title: 'AI Analysis',
    desc: 'Our Gemini-powered AI processes your input across vision, text, and video modalities.',
    icon: '🤖',
  },
  {
    step: '03',
    title: 'Get Insights',
    desc: 'Receive detailed nutrition data, freshness scores, hygiene reports, or personalized meal plans.',
    icon: '✨',
  },
];

const TESTIMONIALS = [
  {
    name: 'Priya Sharma',
    role: 'Nutritionist',
    avatar: 'PS',
    text: 'FoodVerse transformed how I track client meals. The nutrition accuracy is remarkable and saves me hours each week.',
    color: 'sage',
  },
  {
    name: 'Rahul Mehta',
    role: 'Restaurant Owner',
    avatar: 'RM',
    text: 'The hygiene monitoring feature gave us confidence in our kitchen operations. Worth every penny.',
    color: 'brown',
  },
  {
    name: 'Anika Verma',
    role: 'Home Cook',
    avatar: 'AV',
    text: 'I love the freshness detection! No more guessing if produce is still good. The meal plans are spot on too.',
    color: 'terracotta',
  },
];

// Floating food emoji particles
const FOOD_PARTICLES = ['🍎', '🥑', '🌿', '🍋', '🫐', '🥕', '🍃', '🌾'];

const Landing = () => {
  const observerRef = useRef(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    document.querySelectorAll('.animate-on-scroll').forEach((el) => {
      observerRef.current.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <div className="landing">
      <Navbar />

      {/* ======= HERO ======= */}
      <section className="hero">
        {/* Decorative blobs */}
        <div className="hero-blob hero-blob-1" />
        <div className="hero-blob hero-blob-2" />
        <div className="hero-blob hero-blob-3" />

        {/* Floating particles */}
        <div className="particles">
          {FOOD_PARTICLES.map((emoji, i) => (
            <span
              key={i}
              className="particle"
              style={{
                '--delay': `${i * 0.8}s`,
                '--x': `${10 + i * 10}%`,
                '--duration': `${4 + i * 0.5}s`,
              }}
            >
              {emoji}
            </span>
          ))}
        </div>

        <div className="container hero-content">
          <div className="hero-text">
            <div className="badge badge-sage animate-fadeInUp" style={{ marginBottom: '1.5rem' }}>
              <span>✦</span> AI-Powered Food Intelligence
            </div>

            <h1 className="hero-heading animate-fadeInUp delay-100">
              Understand Your Food
              <br />
              <span className="gradient-text-warm font-display">Like Never Before</span>
            </h1>

            <p className="hero-subtext animate-fadeInUp delay-200">
              FoodVerse AI combines computer vision, multimodal AI, and personalized nutrition
              science to analyze food freshness, nutrition, hygiene, and recipes — all in one platform.
            </p>

            <div className="hero-actions animate-fadeInUp delay-300">
              <Link to="/signup" className="btn btn-primary btn-lg">
                <span>🚀</span> Start for Free
              </Link>
              <a href="#how-it-works" className="btn btn-secondary btn-lg">
                <span>▶</span> See How It Works
              </a>
            </div>

            {/* Trust badges */}
            <div className="trust-badges animate-fadeInUp delay-400">
              <span className="trust-item">✓ No credit card required</span>
              <span className="trust-divider">·</span>
              <span className="trust-item">✓ Powered by Gemini AI</span>
              <span className="trust-divider">·</span>
              <span className="trust-item">✓ Free forever plan</span>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="hero-visual animate-float">
            <div className="hero-card-main card-glass">
              <div className="hc-header">
                <div className="hc-dot red" /><div className="hc-dot yellow" /><div className="hc-dot green" />
                <span className="hc-title">FoodVerse Analysis</span>
              </div>
              <div className="hc-food-image">
                <div className="food-emoji-display">🥗</div>
                <div className="hc-scan-ring" />
              </div>
              <div className="hc-results">
                <div className="hc-tag hc-tag-sage">✓ Avocado Bowl</div>
                <div className="hc-tag hc-tag-brown">🌿 Very Fresh</div>
              </div>
              <div className="hc-nutrition">
                <div className="hc-nut-bar">
                  <span>Calories</span>
                  <div className="bar-track"><div className="bar-fill" style={{ width: '65%', background: 'var(--sage-400)' }} /></div>
                  <span>342 kcal</span>
                </div>
                <div className="hc-nut-bar">
                  <span>Protein</span>
                  <div className="bar-track"><div className="bar-fill" style={{ width: '45%', background: 'var(--brown-400)' }} /></div>
                  <span>18g</span>
                </div>
                <div className="hc-nut-bar">
                  <span>Carbs</span>
                  <div className="bar-track"><div className="bar-fill" style={{ width: '55%', background: 'var(--gold-400)' }} /></div>
                  <span>28g</span>
                </div>
              </div>
              <div className="hc-score">
                <span className="score-label">Health Score</span>
                <div className="score-ring">
                  <svg width="60" height="60" viewBox="0 0 60 60">
                    <circle cx="30" cy="30" r="24" fill="none" stroke="var(--cream-200)" strokeWidth="5"/>
                    <circle cx="30" cy="30" r="24" fill="none" stroke="var(--sage-400)" strokeWidth="5"
                      strokeDasharray="150.8" strokeDashoffset="30" strokeLinecap="round"
                      transform="rotate(-90 30 30)"/>
                  </svg>
                  <span className="score-num">8.4</span>
                </div>
              </div>
            </div>

            {/* Side cards */}
            <div className="hero-side-card hsc-fresh card-glass">
              <span>🌿</span>
              <div>
                <div className="hsc-label">Freshness</div>
                <div className="hsc-value" style={{ color: 'var(--sage-500)' }}>Very Fresh</div>
              </div>
            </div>
            <div className="hero-side-card hsc-hygiene card-glass">
              <span>🏪</span>
              <div>
                <div className="hsc-label">Hygiene Score</div>
                <div className="hsc-value" style={{ color: 'var(--brown-500)' }}>94/100</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======= STATS ======= */}
      <section className="stats-strip">
        <div className="container">
          <div className="stats-grid">
            {STATS.map((s) => (
              <div key={s.label} className="stat-item">
                <div className="stat-value gradient-text-warm">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======= FEATURES ======= */}
      <section className="section features-section" id="features">
        <div className="container">
          <div className="section-header animate-on-scroll">
            <div className="badge badge-cream">✦ Features</div>
            <h2 className="section-title">
              Smart Features <span className="gradient-text-sage font-display">at a Glance</span>
            </h2>
            <p className="section-subtitle">
              Discover the intelligent tools that transform how you interact with food —
              from kitchen to table, we've got every angle covered.
            </p>
          </div>

          <div className="features-grid">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className={`feature-card feature-${f.color} animate-on-scroll`}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="feature-icon">{f.icon}</div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
                <div className="feature-arrow">→</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======= HOW IT WORKS ======= */}
      <section className="section how-section" id="how-it-works">
        <div className="container">
          <div className="section-header animate-on-scroll">
            <div className="badge badge-sage">✦ How It Works</div>
            <h2 className="section-title">
              Three Steps to <span className="gradient-text-brown font-display">Food Intelligence</span>
            </h2>
          </div>

          <div className="how-grid">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.step} className="how-card animate-on-scroll" style={{ animationDelay: `${i * 0.15}s` }}>
                <div className="how-step-num">{step.step}</div>
                <div className="how-icon">{step.icon}</div>
                <h3 className="how-title">{step.title}</h3>
                <p className="how-desc">{step.desc}</p>
                {i < HOW_IT_WORKS.length - 1 && <div className="how-connector">→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======= TESTIMONIALS ======= */}
      <section className="section testimonials-section">
        <div className="container">
          <div className="section-header animate-on-scroll">
            <div className="badge badge-brown">✦ Testimonials</div>
            <h2 className="section-title">
              Loved by Food <span className="gradient-text-sage font-display">Enthusiasts</span>
            </h2>
          </div>

          <div className="testimonials-grid">
            {TESTIMONIALS.map((t, i) => (
              <div key={t.name} className="testimonial-card animate-on-scroll card" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="testimonial-stars">★★★★★</div>
                <p className="testimonial-text">"{t.text}"</p>
                <div className="testimonial-author">
                  <div className={`testimonial-avatar avatar-${t.color}`}>{t.avatar}</div>
                  <div>
                    <div className="testimonial-name">{t.name}</div>
                    <div className="testimonial-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======= CTA BANNER ======= */}
      <section className="cta-banner section">
        <div className="container">
          <div className="cta-inner animate-on-scroll">
            <div className="cta-blob" />
            <div className="cta-content">
              <h2 className="cta-heading font-display">
                Ready to Discover Your <span className="gradient-text-warm">Food's Story?</span>
              </h2>
              <p className="cta-sub">
                Join thousands of users making smarter, healthier food decisions with FoodVerse AI.
              </p>
              <div className="cta-actions">
                <Link to="/signup" className="btn btn-primary btn-lg">
                  🚀 Get Started Free
                </Link>
                <Link to="/login" className="btn btn-secondary btn-lg">
                  Already have an account? Sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======= FOOTER ======= */}
      <footer className="footer">
        <div className="container">
          <div className="footer-top">
            <div className="footer-brand">
              <div className="logo-text" style={{ fontSize: '1.5rem' }}>
                Food<span className="logo-accent">Verse</span>
              </div>
              <p className="footer-tagline">Multimodal Food Intelligence, Powered by AI</p>
              <div className="footer-socials">
                {['Twitter', 'LinkedIn', 'GitHub'].map((s) => (
                  <a key={s} href="#" className="social-link">{s[0]}</a>
                ))}
              </div>
            </div>
            <div className="footer-links-group">
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#how-it-works">How It Works</a>
              <a href="#pricing">Pricing</a>
            </div>
            <div className="footer-links-group">
              <h4>Company</h4>
              <a href="#">About</a>
              <a href="#">Blog</a>
              <a href="#">Careers</a>
            </div>
            <div className="footer-links-group">
              <h4>Legal</h4>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">Contact Us</a>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2024 FoodVerse AI. All rights reserved.</p>
            <p>Built with ❤️ and Gemini AI</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
