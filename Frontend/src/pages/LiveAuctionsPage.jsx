import React, { useEffect, useState, useCallback } from 'react';
import { auctionApi } from '../api';
import { useAuth } from '../context/AuthContext';
import AuctionCard from '../components/AuctionCard';

export default function LiveAuctionsPage({ setPage, setSelectedAuction }) {
  const { token } = useAuth();
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const load = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const data = await auctionApi.list({ status: 'ACTIVE', size: 50, sort: 'endTime,asc' }, token);
      setAuctions(Array.isArray(data) ? data : data.content || []);
      setLastRefresh(new Date());
    } catch {}
    finally {
      if (showLoading) setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(true); }, [load]);

  // Real-time auto-refresh every 3s
  useEffect(() => {
    const id = setInterval(() => load(false), 3000);
    return () => clearInterval(id);
  }, [load]);

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <div>
            <h1 className="page-title">🔴 Live Auctions</h1>
            <p className="page-subtitle">
              Active right now · Real-time sync ·{' '}
              <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                Last: {lastRefresh.toLocaleTimeString()}
              </span>
            </p>
          </div>
          <button className="btn btn-secondary" onClick={() => load(true)}>⟳ Refresh</button>
        </div>

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
          padding: '0.35rem 0.85rem', borderRadius: 'var(--radius-xs)',
          background: 'var(--accent-light)', color: 'var(--accent)',
          fontSize: '0.82rem', fontWeight: 700, marginBottom: '1.75rem',
          border: '1px solid var(--accent-border)',
        }}>
          <span style={{
            width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)',
            display: 'inline-block', boxShadow: '0 0 6px var(--accent)'
          }} />
          {auctions.length} Active Auction{auctions.length !== 1 ? 's' : ''}
        </div>

        {loading ? (
          <div className="spinner-wrap"><div className="spinner" /></div>
        ) : auctions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No live auctions right now</h3>
            <p>Check back later or browse all auctions.</p>
            <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setPage('home')}>
              Browse All
            </button>
          </div>
        ) : (
          <div className="auction-grid">
            {auctions.map(a => (
              <AuctionCard
                key={a.id}
                auction={a}
                onClick={() => { setSelectedAuction(a.id); setPage('auction'); }}
                onExpire={() => load(false)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

