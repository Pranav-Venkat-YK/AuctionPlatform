import React, { useEffect, useState, useCallback } from 'react';
import { auctionApi } from '../api';
import { useAuth } from '../context/AuthContext';
import AuctionCard from '../components/AuctionCard';

export default function LiveAuctionsPage({ setPage, setSelectedAuction }) {
  const { token } = useAuth();
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const load = useCallback(async () => {
    try {
      const data = await auctionApi.list({ status: 'ACTIVE', size: 50, sort: 'endTime,asc' }, token);
      setAuctions(Array.isArray(data) ? data : data.content || []);
      setLastRefresh(new Date());
    } catch {}
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh every 15s
  useEffect(() => {
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, [load]);

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <div>
            <h1 className="page-title">🔴 Live Auctions</h1>
            <p className="page-subtitle">
              Active right now · Auto-refreshes every 15s ·{' '}
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                Last: {lastRefresh.toLocaleTimeString()}
              </span>
            </p>
          </div>
          <button className="btn btn-secondary" onClick={load}>⟳ Refresh</button>
        </div>

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
          padding: '0.3rem 0.8rem', borderRadius: 'var(--radius-full)',
          background: 'var(--success-bg)', color: 'var(--success)',
          fontSize: '0.82rem', fontWeight: 700, marginBottom: '1.5rem',
          border: '1px solid #b7e4ca',
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%', background: 'var(--success)',
            display: 'inline-block', animation: 'pulse 1.5s infinite',
          }} />
          {auctions.length} Active Auction{auctions.length !== 1 ? 's' : ''}
          <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
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
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

