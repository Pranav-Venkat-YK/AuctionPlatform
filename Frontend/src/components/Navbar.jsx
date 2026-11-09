import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar({ page, setPage }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : '?';

  const navItems = user ? [
    { label: 'Auctions Dashboard', key: 'home' },
    { label: 'Live Auctions',       key: 'live', isLive: true },
    { label: 'Create Auction',    key: 'create' },
    { label: 'My Bids',           key: 'mybids' },
  ] : [
    { label: 'Home',              key: 'landing' },
    { label: 'Explore Auctions',  key: 'home' },
    { label: 'Live Auctions',     key: 'live', isLive: true },
  ];

  const handleSignOut = () => {
    logout();
    setPage('landing');
    setMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <button
          className="navbar-brand"
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.6rem' }}
          onClick={() => setPage(user ? 'home' : 'landing')}
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
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
            >
              {item.isLive && (
                <span style={{
                  display: 'inline-block',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  boxShadow: '0 0 6px var(--accent)'
                }} />
              )}
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
                  position: 'absolute', right: 0, top: 'calc(100% + 6px)',
                  background: 'var(--bg-surface)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-xs)', minWidth: 185, zIndex: 200,
                  boxShadow: 'none', overflow: 'hidden'
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
                  <button className="profile-nav-item" onClick={() => { setPage('create'); setMenuOpen(false); }}>
                    ➕ Create Auction
                  </button>
                  <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 0 }} />
                  <button className="profile-nav-item" style={{ color: 'var(--danger)' }} onClick={handleSignOut}>
                    🚪 Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setPage('login')}>Sign In</button>
              <button className="btn btn-primary btn-sm" onClick={() => setPage('register')}>Register</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
