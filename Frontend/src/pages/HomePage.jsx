import React, { useEffect, useState, useCallback } from 'react';
import { auctionApi } from '../api';
import { useAuth } from '../context/AuthContext';
import AuctionCard from '../components/AuctionCard';

const STATUS_FILTERS = ['ALL', 'ACTIVE', 'PENDING', 'SCHEDULED', 'CLOSED'];

const EMOJI_MAP = {
  ALL: '🏷️', ACTIVE: '🟢', PENDING: '🟡', SCHEDULED: '🔵', CLOSED: '⚫'
};

export default function HomePage({ setPage, setSelectedAuction }) {
  const { token, user } = useAuth();
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [pageNum, setPageNum] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('default');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page: pageNum, size: 12 };
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const data = await auctionApi.list(params, token);
      setAuctions(Array.isArray(data) ? data : data.content || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError(err.message || 'Failed to fetch auctions');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, pageNum, token]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPageNum(0); }, [statusFilter]);

  // Derived metrics for Dashboard
  const activeCount = auctions.filter(a => a.status === 'ACTIVE' || a.status === 'OPEN').length;
  const upcomingCount = auctions.filter(a => a.status === 'SCHEDULED' || a.status === 'PENDING' || a.status === 'DRAFT').length;
  const totalCount = auctions.length;

  // Filter and sort
  let displayed = search.trim()
    ? auctions.filter(a =>
        a.title?.toLowerCase().includes(search.toLowerCase()) ||
        a.description?.toLowerCase().includes(search.toLowerCase())
      )
    : [...auctions];

  if (sortBy === 'price-low') {
    displayed.sort((a, b) => (a.currentPrice || a.startingPrice || 0) - (b.currentPrice || b.startingPrice || 0));
  } else if (sortBy === 'price-high') {
    displayed.sort((a, b) => (b.currentPrice || b.startingPrice || 0) - (a.currentPrice || a.startingPrice || 0));
  } else if (sortBy === 'title') {
    displayed.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  }

  return (
    <div className="page">
      {/* Dashboard Welcome Hero */}
      <div className="hero" style={{ padding: '2.5rem 0 2rem' }}>
        <div className="container">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--accent-light)', color: 'var(--accent)', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            <span>⚡ Live Auction Dashboard</span>
          </div>
          <h1>
            Welcome back, <span style={{ color: 'var(--accent)' }}>{user?.fullName || user?.username || 'Bidder'}</span>!
          </h1>
          <p>
            Track real-time auctions, place instant bids, or create new listings on the distributed exchange.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={() => setStatusFilter('ACTIVE')}>
              🔴 Live Auctions ({activeCount})
            </button>
            <button className="btn btn-secondary" onClick={() => setPage('create')}>
              + Create Auction
            </button>
            <button className="btn btn-secondary" onClick={() => setPage('mybids')}>
              📋 My Bids
            </button>
          </div>
        </div>
      </div>

      <div className="container" style={{ marginTop: '2rem' }}>
        {/* Quick Stats Grid */}
        <div className="dashboard-stats-grid">
          <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setStatusFilter('ACTIVE')}>
            <div className="stat-card-icon" style={{ color: 'var(--success)' }}>🔴</div>
            <div className="stat-card-info">
              <div className="stat-card-val">{activeCount}</div>
              <div className="stat-card-label">Live Active Bids</div>
            </div>
          </div>

          <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setStatusFilter('ALL')}>
            <div className="stat-card-icon" style={{ color: 'var(--accent)' }}>🏷️</div>
            <div className="stat-card-info">
              <div className="stat-card-val">{totalCount}</div>
              <div className="stat-card-label">Auctions On Page</div>
            </div>
          </div>

          <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setStatusFilter('SCHEDULED')}>
            <div className="stat-card-icon" style={{ color: 'var(--info)' }}>⏳</div>
            <div className="stat-card-info">
              <div className="stat-card-val">{upcomingCount}</div>
              <div className="stat-card-label">Upcoming / Scheduled</div>
            </div>
          </div>

          <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setPage('create')}>
            <div className="stat-card-icon" style={{ color: 'var(--accent)' }}>➕</div>
            <div className="stat-card-info">
              <div className="stat-card-val" style={{ fontSize: '1.05rem', color: 'var(--accent)' }}>New Item</div>
              <div className="stat-card-label">Create Auction</div>
            </div>
          </div>
        </div>

        {/* Dashboard Filter & Search Bar */}
        <div className="filter-bar" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', flex: 1, alignItems: 'center' }}>
            <div style={{ position: 'relative', minWidth: 260 }}>
              <input
                className="form-control"
                placeholder="🔍  Search auctions…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', paddingRight: search ? '2rem' : '0.8rem' }}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  style={{
                    position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.85rem'
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {STATUS_FILTERS.map(s => (
                <button
                  key={s}
                  type="button"
                  className={`filter-chip${statusFilter === s ? ' active' : ''}`}
                  onClick={() => setStatusFilter(s)}
                >
                  {EMOJI_MAP[s]} {s}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <select
              className="form-control"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              style={{ minWidth: 150 }}
            >
              <option value="default">Default Sort</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="title">Title (A-Z)</option>
            </select>

            <button className="btn btn-secondary btn-sm" onClick={load} title="Reload auctions" type="button">
              ⟳ Refresh
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
            <span>⚠️</span>
            <div style={{ flex: 1 }}>{error}</div>
            <button
              style={{ background: 'none', border: 'none', color: 'inherit', textDecoration: 'underline', cursor: 'pointer' }}
              onClick={load}
            >
              Retry
            </button>
          </div>
        )}

        {/* Auction Cards Grid */}
        {loading ? (
          <div className="spinner-wrap"><div className="spinner" /></div>
        ) : displayed.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3>No auctions found</h3>
            <p>{search ? 'Try clearing or changing your search query.' : 'No auctions match the selected filter category.'}</p>
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
              {search && (
                <button className="btn btn-secondary btn-sm" onClick={() => setSearch('')}>
                  Clear Search
                </button>
              )}
              {statusFilter !== 'ALL' && (
                <button className="btn btn-secondary btn-sm" onClick={() => setStatusFilter('ALL')}>
                  Show All Statuses
                </button>
              )}
              <button className="btn btn-primary btn-sm" onClick={() => setPage('create')}>
                + List an Auction Item
              </button>
            </div>
          </div>
        ) : (
          <div className="auction-grid">
            {displayed.map(auction => (
              <AuctionCard
                key={auction.id}
                auction={auction}
                onClick={() => { setSelectedAuction(auction.id); setPage('auction'); }}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination" style={{ marginTop: '2.5rem' }}>
            <button className="page-btn" disabled={pageNum === 0} onClick={() => setPageNum(p => p - 1)}>‹</button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const start = Math.max(0, pageNum - 3);
              const p = start + i;
              if (p >= totalPages) return null;
              return (
                <button key={p} className={`page-btn${pageNum === p ? ' active' : ''}`} onClick={() => setPageNum(p)}>
                  {p + 1}
                </button>
              );
            })}
            <button className="page-btn" disabled={pageNum >= totalPages - 1} onClick={() => setPageNum(p => p + 1)}>›</button>
          </div>
        )}
      </div>
    </div>
  );
}
