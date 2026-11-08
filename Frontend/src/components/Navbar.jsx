import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar({ page, setPage }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : '?';

  const navItems = [
    { label: 'Browse Auctions', key: 'home' },
    { label: 'Live Auctions',   key: 'live' },
    ...(user ? [
      { label: 'Create Auction', key: 'create' },
      { label: 'My Bids',        key: 'mybids' },
    ] : []),
  ];

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <button
          className="navbar-brand"
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          onClick={() => setPage('home')}
        >
          <span className="brand-icon">🔨</span>
          <span>Bid<span className="brand-accent">Vault</span></span>
        </button>

        <div className="navbar-nav">
          {navItems.map(item => (
            <button
              key={item.key}
              className={`nav-link${page === item.key ? ' active' : ''}`}
              onClick={() => setPage(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="navbar-actions">
          <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {user ? (
            <div style={{ position: 'relative' }}>
              <div
                className="user-pill"
                onClick={() => setMenuOpen(o => !o)}
                role="button"
                tabIndex={0}
              >
                <div className="user-avatar">{initials}</div>
                <span>{user.username}</span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>▾</span>
              </div>
              {menuOpen && (
                <div style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                  background: 'var(--bg-surface)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)',
                  minWidth: 170, zIndex: 200, overflow: 'hidden',
                }}>
                  <button className="profile-nav-item" onClick={() => { setPage('profile'); setMenuOpen(false); }}>
                    👤 My Profile
                  </button>
                  <button className="profile-nav-item" onClick={() => { setPage('mybids'); setMenuOpen(false); }}>
                    📋 My Bids
                  </button>
                  <button className="profile-nav-item" onClick={() => { setPage('myauctions'); setMenuOpen(false); }}>
                    🏷️ My Auctions
                  </button>
                  <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 0 }} />
                  <button className="profile-nav-item" style={{ color: 'var(--danger)' }} onClick={() => { logout(); setMenuOpen(false); }}>
                    🚪 Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setPage('login')}>Log In</button>
              <button className="btn btn-primary btn-sm" onClick={() => setPage('register')}>Register</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

