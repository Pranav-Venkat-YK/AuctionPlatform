import React, { useEffect, useState } from 'react';
import { auctionApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../api';
import { useToast } from '../context/ToastContext';
import AuctionCard from '../components/AuctionCard';
import { formatPrice } from '../components/AuctionCard';

function formatDateTime(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function ProfilePage({ setPage, setSelectedAuction }) {
  const { token, user, logout, updateUser } = useAuth();
  const { addToast } = useToast();

  const [profile, setProfile] = useState(null);
  const [auctions, setAuctions] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingAuctions, setLoadingAuctions] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({ username: '', email: '', fullName: '' });
  const [error, setError] = useState('');
  const [tab, setTab] = useState('info');

  useEffect(() => {
    if (!user) return;
    userApi.getUser(user.id, token)
      .then(data => {
        setProfile(data);
        setEditForm({ username: data.username || '', email: data.email || '', fullName: data.fullName || '' });
      })
      .catch(e => setError(e.message))
      .finally(() => setLoadingProfile(false));

    auctionApi.bySeller(user.id, { size: 50 }, token)
      .then(data => setAuctions(Array.isArray(data) ? data : data.content || []))
      .catch(() => {})
      .finally(() => setLoadingAuctions(false));
  }, [user, token]);

  if (!user) {
    return (
      <div className="page">
        <div className="container">
          <div className="alert alert-warning">🔒 Please log in to view your profile.</div>
          <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setPage('login')}>Log In</button>
        </div>
      </div>
    );
  }

  const initials = (profile?.username || user.username || '?').slice(0, 2).toUpperCase();

  const saveProfile = async e => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const data = await userApi.updateUser(user.id, editForm, token);
      setProfile(data);
      updateUser({ username: data.username, email: data.email });
      setEditing(false);
      addToast('Profile updated!', 'success');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const auctionsByStatus = {
    active: auctions.filter(a => a.status === 'ACTIVE' || a.status === 'OPEN'),
    pending: auctions.filter(a => a.status === 'PENDING'),
    closed: auctions.filter(a => a.status === 'CLOSED'),
  };

  return (
    <div className="page">
      <div className="container">
        <div className="profile-layout">
          {/* Sidebar */}
          <div className="card profile-sidebar">
            <div className="profile-avatar-block">
              <div className="profile-avatar">{initials}</div>
              <div className="profile-username">{profile?.username || user.username}</div>
              <div className="profile-email">{profile?.email || user.email}</div>
              {profile?.fullName && (
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{profile.fullName}</div>
              )}
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Member since {formatDateTime(profile?.createdAt)}
              </div>
            </div>

            <div className="profile-nav">
              {[
                { key: 'info',     icon: '👤', label: 'Profile Info' },
                { key: 'auctions', icon: '🏷️', label: `My Auctions (${auctions.length})` },
                { key: 'mybids',   icon: '📋', label: 'My Bids', action: () => setPage('mybids') },
              ].map(item => (
                <button
                  key={item.key}
                  className={`profile-nav-item${tab === item.key ? ' active' : ''}`}
                  onClick={item.action || (() => setTab(item.key))}
                >
                  {item.icon} {item.label}
                </button>
              ))}
              <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0.5rem 0' }} />
              <button
                className="profile-nav-item"
                style={{ color: 'var(--danger)' }}
                onClick={logout}
              >
                🚪 Sign Out
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div>
            {tab === 'info' && (
              <div className="card card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h2>Profile Information</h2>
                  {!editing && (
                    <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>✏️ Edit</button>
                  )}
                </div>

                {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>⚠️ {error}</div>}

                {loadingProfile ? (
                  <div className="spinner-wrap"><div className="spinner" /></div>
                ) : !editing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {[
                      ['User ID', `#${profile?.id}`],
                      ['Username', profile?.username],
                      ['Email Address', profile?.email],
                      ['Full Name', profile?.fullName || 'Not provided'],
                      ['Account Created', formatDateTime(profile?.createdAt)],
                    ].map(([label, val]) => (
                      <div key={label} style={{
                        display: 'flex', gap: '1rem', padding: '0.75rem 0',
                        borderBottom: '1px solid var(--border)', alignItems: 'flex-start'
                      }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', width: 140, flexShrink: 0 }}>{label}</div>
                        <div style={{ fontWeight: 600 }}>{val}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Username</label>
                      <input className="form-control" value={editForm.username}
                        onChange={e => setEditForm(f => ({ ...f, username: e.target.value }))} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input className="form-control" type="email" value={editForm.email}
                        onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <input className="form-control" value={editForm.fullName}
                        onChange={e => setEditForm(f => ({ ...f, fullName: e.target.value }))} />
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button className="btn btn-primary" type="submit" disabled={saving}>
                        {saving ? 'Saving…' : 'Save Changes'}
                      </button>
                      <button className="btn btn-secondary" type="button" onClick={() => { setEditing(false); setError(''); }}>
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {tab === 'auctions' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h2>My Auctions</h2>
                  <button className="btn btn-primary btn-sm" onClick={() => setPage('create')}>
                    + Create Auction
                  </button>
                </div>

                {/* Stats row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                  {[
                    { label: 'Active', count: auctionsByStatus.active.length, badge: 'badge-active', icon: '🟢' },
                    { label: 'Pending', count: auctionsByStatus.pending.length, badge: 'badge-pending', icon: '🟡' },
                    { label: 'Closed', count: auctionsByStatus.closed.length, badge: 'badge-closed', icon: '⚫' },
                  ].map(({ label, count, badge, icon }) => (
                    <div key={label} className="card card-body" style={{ textAlign: 'center', padding: '1rem' }}>
                      <div style={{ fontSize: '1.5rem' }}>{icon}</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{count}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</div>
                    </div>
                  ))}
                </div>

                {loadingAuctions ? (
                  <div className="spinner-wrap"><div className="spinner" /></div>
                ) : auctions.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">🏷️</div>
                    <h3>No auctions yet</h3>
                    <p>Create your first auction and start selling!</p>
                    <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setPage('create')}>
                      Create Auction
                    </button>
                  </div>
                ) : (
                  <div className="auction-grid">
                    {auctions.map(a => (
                      <AuctionCard
                        key={a.id}
                        auction={a}
                        onClick={() => { setSelectedAuction(a.id); setPage('auction'); }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

