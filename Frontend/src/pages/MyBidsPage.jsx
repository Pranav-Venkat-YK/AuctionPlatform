import React, { useEffect, useState, useCallback } from 'react';
import { bidApi, auctionApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../components/AuctionCard';

function formatDateTime(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
}

export default function MyBidsPage({ setPage, setSelectedAuction }) {
  const { token, user } = useAuth();
  const [bids, setBids] = useState([]);
  const [auctionMap, setAuctionMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // We don't have a /bids?bidderId= endpoint, so we load bid history
  // across all auctions the user knows about. Instead, we load recent auctions
  // and check if the user placed bids. For a real solution, we'd need a
  // bidding service endpoint. We load all auctions and fetch bid history from each.
  // As a pragmatic approach: fetch all auctions, then find bids by this user.

  const load = useCallback(async (showSpinner = true) => {
    if (!user || !token) return;
    if (showSpinner) {
      setLoading(true);
      setError('');
    }
    try {
      // Load recent auctions (up to 50)
      const data = await auctionApi.list({ size: 50, page: 0 }, token);
      const auctionList = Array.isArray(data) ? data : data.content || [];

      // Build auction map
      const aMap = {};
      auctionList.forEach(a => { aMap[a.id] = a; });
      setAuctionMap(aMap);

      // For each auction, fetch bids and filter by this user
      const userBids = [];
      await Promise.all(auctionList.map(async (auction) => {
        try {
          const bidData = await bidApi.history(auction.id, { size: 100 }, token);
          const auctionBids = (Array.isArray(bidData) ? bidData : bidData.content || [])
            .filter(b => String(b.bidderId) === String(user.id))
            .map(b => ({ ...b, auctionId: auction.id, auctionTitle: auction.title }));
          userBids.push(...auctionBids);
        } catch {}
      }));

      // Sort by timestamp descending
      userBids.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setBids(userBids);
    } catch (err) {
      if (showSpinner) setError(err.message);
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, [user, token]);

  useEffect(() => { load(true); }, [load]);

  // Real-time background sync every 4s
  useEffect(() => {
    const id = setInterval(() => load(false), 4000);
    return () => clearInterval(id);
  }, [load]);

  if (!user) {
    return (
      <div className="page">
        <div className="container">
          <div className="alert alert-warning">🔒 Please log in to view your bids.</div>
          <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setPage('login')}>Log In</button>
        </div>
      </div>
    );
  }

  const wonBids = bids.filter(b => {
    const a = auctionMap[b.auctionId];
    return a && (a.status === 'CLOSED' || a.status === 'ENDED') && String(a.highestBidderId) === String(user.id);
  });

  const activeBids = bids.filter(b => {
    const a = auctionMap[b.auctionId];
    return a && (a.status === 'ACTIVE' || a.status === 'OPEN');
  });

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <div>
            <h1 className="page-title">My Bids</h1>
            <p className="page-subtitle">Track all your bidding activity</p>
          </div>
          <button className="btn btn-primary" onClick={() => setPage('home')}>Browse Auctions</button>
        </div>

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: 'Total Bids', value: bids.length, icon: '📊' },
            { label: 'Active Bids', value: activeBids.length, icon: '🔥' },
            { label: 'Auctions Won', value: wonBids.length, icon: '🏆' },
          ].map(({ label, value, icon }) => (
            <div key={label} className="card card-body" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.75rem' }}>{icon}</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent)' }}>{value}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{label}</div>
            </div>
          ))}
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>⚠️ {error}</div>}

        {loading ? (
          <div className="spinner-wrap"><div className="spinner" /></div>
        ) : bids.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎯</div>
            <h3>No bids yet</h3>
            <p>Start bidding on live auctions to see your history here.</p>
            <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setPage('home')}>
              Browse Auctions
            </button>
          </div>
        ) : (
          <>
            {/* Won auctions section */}
            {wonBids.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success, #10b981)' }}>
                  🏆 Won Auctions
                  <span className="badge badge-active">{wonBids.length}</span>
                </h2>
                <div className="bids-list">
                  {wonBids.map((bid, i) => {
                    const auction = auctionMap[bid.auctionId];
                    return (
                      <div
                        key={`won-${bid.auctionId}-${i}`}
                        className="bid-row"
                        style={{
                          cursor: 'pointer',
                          borderColor: 'var(--success, #10b981)',
                          background: 'rgba(16, 185, 129, 0.04)'
                        }}
                        onClick={() => { setSelectedAuction(bid.auctionId); setPage('auction'); }}
                      >
                        <div>
                          <div className="bid-row-title" style={{ fontWeight: 700 }}>
                            {bid.auctionTitle || `Auction #${bid.auctionId}`}
                          </div>
                          <div className="bid-row-auction">Closed • Winning bid placed {formatDateTime(bid.timestamp)}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                          <span className="badge badge-active" style={{ fontSize: '0.75rem' }}>
                            🏆 Winner
                          </span>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAuction(bid.auctionId);
                              setPage('auction');
                            }}
                          >
                            💳 Pay with Stripe
                          </button>
                        </div>
                        <div className="bid-row-amount" style={{ color: 'var(--success, #10b981)' }}>
                          {formatPrice(bid.amount)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Active bids section */}
            {activeBids.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  🔥 Active Bids
                  <span className="badge badge-active">{activeBids.length}</span>
                </h2>
                <div className="bids-list">
                  {activeBids.map((bid, i) => {
                    const auction = auctionMap[bid.auctionId];
                    const isLeading = auction && String(auction.highestBidderId) === String(user.id);
                    return (
                      <div
                        key={`${bid.auctionId}-${i}`}
                        className="bid-row"
                        style={{ cursor: 'pointer' }}
                        onClick={() => { setSelectedAuction(bid.auctionId); setPage('auction'); }}
                      >
                        <div>
                          <div className="bid-row-title">{bid.auctionTitle || `Auction #${bid.auctionId}`}</div>
                          <div className="bid-row-auction">{formatDateTime(bid.timestamp)}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <span className={`badge ${isLeading ? 'badge-active' : 'badge-pending'}`}>
                            {isLeading ? '🥇 Leading' : 'Outbid'}
                          </span>
                        </div>
                        <div className="bid-row-amount">{formatPrice(bid.amount)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* All bids */}
            <h2 style={{ marginBottom: '1rem' }}>📋 All Bid History</h2>
            <div className="bids-list">
              {bids.map((bid, i) => {
                const auction = auctionMap[bid.auctionId];
                const statusLabel = auction?.status || '';
                const isWon = wonBids.some(w => w === bid);
                const badgeClass = isWon ? 'badge-won' : {
                  ACTIVE: 'badge-active', OPEN: 'badge-open',
                  CLOSED: 'badge-closed', PENDING: 'badge-pending',
                }[statusLabel] || 'badge-pending';

                return (
                  <div
                    key={`all-${bid.auctionId}-${i}`}
                    className="bid-row"
                    style={{ cursor: 'pointer' }}
                    onClick={() => { setSelectedAuction(bid.auctionId); setPage('auction'); }}
                  >
                    <div>
                      <div className="bid-row-title">{bid.auctionTitle || `Auction #${bid.auctionId}`}</div>
                      <div className="bid-row-auction">Bid placed {formatDateTime(bid.timestamp)}</div>
                    </div>
                    <span className={`badge ${badgeClass}`}>
                      {isWon ? '🏆 Won' : statusLabel}
                    </span>
                    <div className="bid-row-amount">{formatPrice(bid.amount)}</div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

