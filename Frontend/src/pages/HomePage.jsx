import React, { useEffect, useState, useCallback } from 'react';
import { auctionApi } from '../api';
import { useAuth } from '../context/AuthContext';
import AuctionCard from '../components/AuctionCard';

const STATUS_FILTERS = ['ALL', 'ACTIVE', 'PENDING', 'SCHEDULED', 'CLOSED'];

const EMOJI_MAP = {
  ACTIVE: '🟢', PENDING: '🟡', SCHEDULED: '🔵', CLOSED: '⚫', ALL: '🏷️'
};

export default function HomePage({ setPage, setSelectedAuction }) {
  const { token } = useAuth();
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [pageNum, setPageNum] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');

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
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, pageNum, token]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPageNum(0); }, [statusFilter]);

  const filtered = search
    ? auctions.filter(a =>
        a.title?.toLowerCase().includes(search.toLowerCase()) ||
        a.description?.toLowerCase().includes(search.toLowerCase())
      )
    : auctions;

  return (
    <div className="page">
      {/* Hero */}
      <div className="hero">
        <div className="container">
          <h1>Discover & Win Unique Items</h1>
          <p>Join thousands of bidders on live, real-time auctions. Find rare items, antiques, art, and more.</p>
          <div className="hero-actions">
            <button className="btn btn-primary btn-lg" onClick={() => setStatusFilter('ACTIVE')}>
              🔴 Live Auctions
            </button>
            <button className="btn btn-secondary btn-lg" onClick={() => setPage('create')}>
              + Create Auction
            </button>
          </div>
        </div>
      </div>

      <div className="container">
        <div style={{ marginTop: '2rem' }}>
          {/* Filter Bar */}
          <div className="filter-bar">
            <input
              className="form-control"
              placeholder="🔍  Search auctions…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ flex: 1, maxWidth: 320 }}
            />
            {STATUS_FILTERS.map(s => (
              <button
                key={s}
                className={`filter-chip${statusFilter === s ? ' active' : ''}`}
                onClick={() => setStatusFilter(s)}
              >
                {EMOJI_MAP[s]} {s}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
              ⚠️ {error} — <button style={{ background: 'none', border: 'none', color: 'inherit', textDecoration: 'underline', cursor: 'pointer' }} onClick={load}>retry</button>
            </div>
          )}

          {/* Grid */}
          {loading ? (
            <div className="spinner-wrap"><div className="spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <h3>No auctions found</h3>
              <p>{search ? 'Try a different search term.' : 'No auctions match the selected filter.'}</p>
            </div>
          ) : (
            <div className="auction-grid">
              {filtered.map(auction => (
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
            <div className="pagination">
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
    </div>
  );
}

