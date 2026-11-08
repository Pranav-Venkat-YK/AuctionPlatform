import React, { useEffect, useState, useCallback } from 'react';
import { auctionApi } from '../api';
import { useAuth } from '../context/AuthContext';
import AuctionCard from '../components/AuctionCard';

export default function MyAuctionsPage({ setPage, setSelectedAuction }) {
  const { token, user } = useAuth();
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await auctionApi.bySeller(user.id, { size: 50 }, token);
      setAuctions(Array.isArray(data) ? data : data.content || []);
    } catch {}
    finally { setLoading(false); }
  }, [user, token]);

  useEffect(() => { load(); }, [load]);

  if (!user) {
    return (
      <div className="page"><div className="container">
        <div className="alert alert-warning">Please log in to view your auctions.</div>
      </div></div>
    );
  }

  const filtered = statusFilter === 'ALL'
    ? auctions
    : auctions.filter(a => (a.status || '').toUpperCase() === statusFilter);

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <div>
            <h1 className="page-title">My Auctions</h1>
            <p className="page-subtitle">All auctions you've created</p>
          </div>
          <button className="btn btn-primary" onClick={() => setPage('create')}>+ Create Auction</button>
        </div>

        <div className="filter-bar">
          {['ALL', 'ACTIVE', 'PENDING', 'SCHEDULED', 'CLOSED'].map(s => (
            <button key={s} className={`filter-chip${statusFilter === s ? ' active' : ''}`}
              onClick={() => setStatusFilter(s)}>{s}</button>
          ))}
        </div>

        {loading ? (
          <div className="spinner-wrap"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏷️</div>
            <h3>No auctions found</h3>
            <p>{statusFilter !== 'ALL' ? `No ${statusFilter} auctions.` : 'Create your first auction!'}</p>
            <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setPage('create')}>Create Auction</button>
          </div>
        ) : (
          <div className="auction-grid">
            {filtered.map(a => (
              <AuctionCard key={a.id} auction={a}
                onClick={() => { setSelectedAuction(a.id); setPage('auction'); }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

