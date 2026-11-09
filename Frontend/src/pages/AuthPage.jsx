import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { userApi } from '../api';

export default function AuthPage({ mode = 'login', setPage }) {
  const { login } = useAuth();
  const { addToast } = useToast();
  const { theme, toggleTheme } = useTheme();

  const [tab, setTab] = useState(mode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Keep internal tab in sync if mode prop changes
  useEffect(() => {
    setTab(mode);
    setError('');
  }, [mode]);

  // Form states
  const [loginForm, setLoginForm] = useState({ usernameOrEmail: '', password: '' });
  const [regForm, setRegForm] = useState({ username: '', email: '', fullName: '', password: '' });

  const handleLoginChange = e => {
    const { name, value } = e.target;
    setLoginForm(f => ({ ...f, [name]: value }));
  };

  const handleRegChange = e => {
    const { name, value } = e.target;
    setRegForm(f => ({ ...f, [name]: value }));
  };

  const handleTabSwitch = (newTab) => {
    setTab(newTab);
    setError('');
    if (setPage) setPage(newTab);
  };

  const handleLoginSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await userApi.login({
        username: loginForm.usernameOrEmail.trim(),
        usernameOrEmail: loginForm.usernameOrEmail.trim(),
        password: loginForm.password,
      });
      const userId = data.id || data.userId;
      login(data.token, { id: userId, username: data.username, email: data.email });
      addToast(`Welcome back, ${data.username}! 🎉`, 'success');
      setPage('home');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegSubmit = async e => {
    e.preventDefault();
    setError('');
    if (regForm.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await userApi.register({
        username: regForm.username.trim(),
        email: regForm.email.trim(),
        fullName: regForm.fullName.trim(),
        password: regForm.password,
      });

      // Auto login immediately after registration
      const data = await userApi.login({
        username: regForm.username.trim(),
        password: regForm.password,
      });
      const userId = data.id || data.userId;
      login(data.token, { id: userId, username: data.username, email: data.email });
      addToast(`Account created! Welcome to BidVault, ${data.username}! 🎉`, 'success');
      setPage('home');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try a different username/email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      {/* Top utility bar */}
      <div className="auth-top-nav">
        <button
          type="button"
          className="auth-brand-badge"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          onClick={() => setPage && setPage('landing')}
          title="Return to BidVault Home"
        >
          <span className="brand-icon">🔨</span>
          <span className="brand-name">Bid<span className="brand-accent">Vault</span></span>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setPage && setPage('landing')}
          >
            ← Back to Home
          </button>
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            title="Toggle theme"
            type="button"
          >
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>
      </div>

      <div className="auth-wrapper">
        <div className="auth-card" style={{ maxWidth: tab === 'register' ? 480 : 440 }}>
          {/* Logo & Headline */}
          <div className="auth-card-logo">
            <div className="logo-mark">🔨</div>
            <h1>Bid<span style={{ color: 'var(--accent)' }}>Vault</span></h1>
            <p>Distributed Real-Time Auction Platform</p>
          </div>

          {/* Segmented Auth Tabs */}
          <div className="auth-tabs" role="tablist">
            <button
              type="button"
              className={`auth-tab-btn ${tab === 'login' ? 'active' : ''}`}
              onClick={() => handleTabSwitch('login')}
              role="tab"
              aria-selected={tab === 'login'}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth-tab-btn ${tab === 'register' ? 'active' : ''}`}
              onClick={() => handleTabSwitch('register')}
              role="tab"
              aria-selected={tab === 'register'}
            >
              Create Account
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
              <span>⚠️</span>
              <div style={{ flex: 1 }}>{error}</div>
            </div>
          )}

          {/* Sign In Form */}
          {tab === 'login' && (
            <form onSubmit={handleLoginSubmit}>
              <div className="form-group">
                <label className="form-label">Username or Email</label>
                <input
                  className="form-control"
                  type="text"
                  name="usernameOrEmail"
                  value={loginForm.usernameOrEmail}
                  onChange={handleLoginChange}
                  placeholder="Enter your username or email"
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  className="form-control"
                  type="password"
                  name="password"
                  value={loginForm.password}
                  onChange={handleLoginChange}
                  placeholder="Enter your password"
                  required
                />
              </div>
              <button
                className="btn btn-primary btn-full btn-lg"
                type="submit"
                disabled={loading}
                style={{ marginTop: '0.5rem' }}
              >
                {loading ? 'Signing in…' : 'Sign In to Dashboard →'}
              </button>

              <div className="auth-divider">
                Don't have an account yet?{' '}
                <button type="button" onClick={() => handleTabSwitch('register')}>
                  Create an account
                </button>
              </div>
            </form>
          )}

          {/* Register Form */}
          {tab === 'register' && (
            <form onSubmit={handleRegSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Username *</label>
                  <input
                    className="form-control"
                    name="username"
                    value={regForm.username}
                    onChange={handleRegChange}
                    placeholder="e.g. johndoe"
                    required
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    className="form-control"
                    name="fullName"
                    value={regForm.fullName}
                    onChange={handleRegChange}
                    placeholder="e.g. John Doe"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input
                  className="form-control"
                  type="email"
                  name="email"
                  value={regForm.email}
                  onChange={handleRegChange}
                  placeholder="john@example.com"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password *</label>
                <input
                  className="form-control"
                  type="password"
                  name="password"
                  value={regForm.password}
                  onChange={handleRegChange}
                  placeholder="Minimum 6 characters"
                  required
                />
                <span className="form-hint">Must be at least 6 characters long</span>
              </div>

              <button
                className="btn btn-primary btn-full btn-lg"
                type="submit"
                disabled={loading}
                style={{ marginTop: '0.5rem' }}
              >
                {loading ? 'Creating account…' : 'Create Account & Enter Dashboard →'}
              </button>

              <div className="auth-divider">
                Already have an account?{' '}
                <button type="button" onClick={() => handleTabSwitch('login')}>
                  Sign in
                </button>
              </div>
            </form>
          )}

          {/* Value Highlights */}
          <div className="auth-features">
            <div className="auth-feature-item">
              <span className="feature-icon">⚡</span>
              <span>Live Real-Time Bids</span>
            </div>
            <div className="auth-feature-item">
              <span className="feature-icon">🔒</span>
              <span>Distributed Consistency</span>
            </div>
            <div className="auth-feature-item">
              <span className="feature-icon">🛡️</span>
              <span>Secure Transactions</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

