import React, { useEffect, useState, useCallback } from 'react';
import { auctionApi, bidApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatPrice, timeLeft, isUrgent } from '../components/AuctionCard';

const ITEM_EMOJI = ['🏺', '🎨', '💎', '📿', '🏛️', '🎭', '🕰️', '📚', '🎸', '🌿', '🏆', '🔮'];

function formatDateTime(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function AuctionDetailPage({ auctionId, setPage }) {
  const { token, user } = useAuth();
  const { addToast } = useToast();

  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [highest, setHighest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bidLoading, setBidLoading] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [error, setError] = useState('');
  const [bidError, setBidError] = useState('');
  const [tab, setTab] = useState('details');
  const [tl, setTl] = useState('');

  const loadAuction = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [a, h] = await Promise.all([
        auctionApi.get(auctionId, token),
        bidApi.highest(auctionId, token).catch(() => null),
      ]);
      setAuction(a);
      setHighest(h);
      const effectivePrice = h?.currentAmount ?? a.currentPrice ?? a.startingPrice ?? 0;
      const minNext = parseFloat(effectivePrice) + parseFloat(a.minBidIncrement || 1);
      setBidAmount(minNext.toFixed(2));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [auctionId, token]);

  const loadBids = useCallback(async () => {
    try {
      const data = await bidApi.history(auctionId, { size: 20 }, token);
      setBids(Array.isArray(data) ? data : data.content || []);
    } catch {}
  }, [auctionId, token]);

  useEffect(() => { loadAuction(); loadBids(); }, [loadAuction, loadBids]);

  // Live countdown
  useEffect(() => {
    if (!auction?.endTime) return;
    const interval = setInterval(() => setTl(timeLeft(auction.endTime)), 1000);
    setTl(timeLeft(auction.endTime));
    return () => clearInterval(interval);
  }, [auction?.endTime]);

  // Live poll highest bid & bid history every 3s
  useEffect(() => {
    const pollId = setInterval(async () => {
      try {
        const [h, b] = await Promise.all([
          bidApi.highest(auctionId, token).catch(() => null),
          bidApi.history(auctionId, { size: 20 }, token).catch(() => null),
        ]);
        if (h) setHighest(h);
        if (b) setBids(Array.isArray(b) ? b : b.content || []);
      } catch {}
    }, 3000);
    return () => clearInterval(pollId);
  }, [auctionId, token]);

  const placeBid = async e => {
    e.preventDefault();
    if (!token) { setBidError('Please log in to place a bid.'); return; }
    if (!bidAmount || parseFloat(bidAmount) <= 0) { setBidError('Enter a valid bid amount.'); return; }

    const effectivePrice = highest?.currentAmount ?? auction.currentPrice ?? auction.startingPrice ?? 0;
    const minRequired = parseFloat(effectivePrice) + parseFloat(auction.minBidIncrement || 1);
    if (parseFloat(bidAmount) < minRequired) {
      setBidError(`Minimum bid is ${formatPrice(minRequired)}`);
      return;
    }

    setBidLoading(true);
    setBidError('');
    try {
      await bidApi.place(auctionId, { bidderId: user.id, amount: parseFloat(bidAmount) }, token);
      addToast(`Bid of ${formatPrice(bidAmount)} placed! 🎉`, 'success');
      await Promise.all([loadAuction(), loadBids()]);
    } catch (err) {
      setBidError(err.message);
    } finally {
      setBidLoading(false);
    }
  };

  if (loading) return <div className="page"><div className="spinner-wrap"><div className="spinner" /></div></div>;
  if (error) return (
    <div className="page">
      <div className="container">
        <div className="alert alert-error">⚠️ {error}</div>
        <button className="btn btn-secondary" style={{ marginTop: '1rem' }} onClick={() => setPage('home')}>← Back</button>
      </div>
    </div>
  );

  const status = (auction.status || '').toUpperCase();
  const isActive = status === 'ACTIVE' || status === 'OPEN';
  const urgent = isUrgent(auction.endTime);
  const emoji = ITEM_EMOJI[auction.id % ITEM_EMOJI.length];

  const displayPrice = highest?.currentAmount ?? auction.currentPrice ?? auction.startingPrice;
  const displayBidderId = highest?.currentBidderId ?? auction.highestBidderId;

  const badgeClass = {
    ACTIVE: 'badge-active', OPEN: 'badge-open', PENDING: 'badge-pending',
    SCHEDULED: 'badge-scheduled', CLOSED: 'badge-closed', CANCELLED: 'badge-cancelled',
  }[status] || 'badge-pending';

  return (
    <div className="page">
      <div className="container">
        {/* Back */}
        <button className="btn btn-ghost btn-sm" style={{ marginBottom: '1rem' }} onClick={() => setPage('home')}>
          ← Back to Auctions
        </button>

        <div className="auction-detail-layout">
          {/* Main */}
          <div className="auction-detail-main">
            <div className="card">
              {/* Image */}
              <div style={{
                height: 240, background: 'linear-gradient(135deg, var(--bg-elevated) 0%, var(--accent-light) 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '6rem',
                borderBottom: '1px solid var(--border)'
              }}>
                {emoji}
              </div>

              <div className="card-body">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <h1 style={{ flex: 1, fontSize: '1.6rem' }}>{auction.title}</h1>
                  <span className={`badge ${badgeClass}`} style={{ fontSize: '0.78rem', padding: '0.3rem 0.8rem' }}>
                    {status}
                  </span>
                </div>

                {/* Tabs */}
                <div className="tabs" style={{ marginTop: '1.25rem' }}>
                  {['details', 'bids', 'attributes'].map(t => (
                    <button key={t} className={`tab-btn${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
                      {{ details: '📋 Details', bids: `💰 Bid History (${bids.length})`, attributes: '🏷️ Attributes' }[t]}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                {tab === 'details' && (
                  <div>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                      {auction.description || 'No description provided.'}
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      {[
                        ['Starting Price', formatPrice(auction.startingPrice)],
                        ['Current Price', formatPrice(displayPrice)],
                        ['Reserve Price', auction.reservePrice ? formatPrice(auction.reservePrice) : 'None'],
                        ['Min Increment', formatPrice(auction.minBidIncrement)],
                        ['Starts', formatDateTime(auction.startTime)],
                        ['Ends', formatDateTime(auction.endTime)],
                        ['Seller ID', `#${auction.sellerId}`],
                        ['Highest Bidder', displayBidderId ? `#${displayBidderId}` : 'None yet'],
                      ].map(([label, val]) => (
                        <div key={label} style={{
                          padding: '0.75rem 1rem', background: 'var(--bg-elevated)',
                          borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)'
                        }}>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            {label}
                          </div>
                          <div style={{ fontWeight: 700, marginTop: '0.2rem' }}>{val}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {tab === 'bids' && (
                  <div>
                    {bids.length === 0 ? (
                      <div className="empty-state" style={{ padding: '2rem' }}>
                        <div className="empty-icon">🎯</div>
                        <h3>No bids yet</h3>
                        <p>Be the first to place a bid!</p>
                      </div>
                    ) : (
                      <div>
                        {bids.map((bid, i) => (
                          <div key={bid.id || i} className="bid-history-item">
                            <div>
                              <div className="bid-history-bidder">Bidder #{bid.bidderId}</div>
                              <div className="bid-history-time">{formatDateTime(bid.timestamp)}</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              {i === 0 && <span className="badge badge-active">Leading</span>}
                              <div className="bid-history-amount">{formatPrice(bid.amount)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {tab === 'attributes' && (
                  <div>
                    {auction.itemAttributes && Object.keys(auction.itemAttributes).length > 0 ? (
                      <div className="attr-grid">
                        {Object.entries(auction.itemAttributes).map(([k, v]) => (
                          <div key={k} className="attr-pill">
                            {k}: <strong>{String(v)}</strong>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: 'var(--text-muted)' }}>No item attributes specified.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="auction-detail-sidebar">
            {/* Bid Panel */}
            <div className="bid-panel">
              <div className="bid-panel-price">
                <div className="label">Current Highest Bid</div>
                <div className="amount">{formatPrice(displayPrice)}</div>
                {displayBidderId && (
                  <div className="increment" style={{ marginTop: '0.25rem' }}>
                    by Bidder #{displayBidderId}
                  </div>
                )}
                <div className="increment">
                  Min increment: {formatPrice(auction.minBidIncrement)}
                </div>
              </div>

              {/* Timer */}
              {tl && (
                <div style={{
                  textAlign: 'center', padding: '0.75rem', marginBottom: '1rem',
                  background: urgent ? 'var(--danger-bg)' : 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-sm)', border: `1px solid ${urgent ? '#f5c6c3' : 'var(--border)'}`,
                  color: urgent ? 'var(--danger)' : 'var(--text-secondary)',
                  fontWeight: 700, fontSize: '1rem',
                }}>
                  {urgent ? '🔥' : '⏰'} {tl}
                </div>
              )}

              {isActive ? (
                token ? (
                  <form onSubmit={placeBid} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {bidError && <div className="alert alert-error">{bidError}</div>}
                    <div className="form-group">
                      <label className="form-label">Your Bid (₹)</label>
                      <input
                        className="form-control"
                        type="number"
                        step="0.01"
                        min={(parseFloat(auction.currentPrice || 0) + parseFloat(auction.minBidIncrement || 1)).toFixed(2)}
                        value={bidAmount}
                        onChange={e => setBidAmount(e.target.value)}
                        required
                      />
                      <span className="form-hint">
                        Minimum: {formatPrice(parseFloat(auction.currentPrice || 0) + parseFloat(auction.minBidIncrement || 1))}
                      </span>
                    </div>
                    <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={bidLoading}>
                      {bidLoading ? 'Placing Bid…' : '🔨 Place Bid'}
                    </button>
                  </form>
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                      Sign in to place a bid on this auction.
                    </p>
                    <button className="btn btn-primary btn-full" onClick={() => setPage('login')}>
                      Log In to Bid
                    </button>
                  </div>
                )
              ) : (
                <div style={{
                  textAlign: 'center', padding: '1rem',
                  background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-muted)', fontWeight: 600,
                }}>
                  {status === 'CLOSED' ? '🏁 Auction Ended' :
                   status === 'PENDING' ? '⏳ Auction Pending' :
                   status === 'SCHEDULED' ? '🗓️ Not Started Yet' : '⚫ Bidding Closed'}
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="card card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="section-title">📊 Quick Stats</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total Bids</span>
                <strong>{bids.length}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Starting Price</span>
                <strong>{formatPrice(auction.startingPrice)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Price Increase</span>
                <strong style={{ color: 'var(--success)' }}>
                  +{formatPrice(parseFloat(auction.currentPrice || 0) - parseFloat(auction.startingPrice || 0))}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

