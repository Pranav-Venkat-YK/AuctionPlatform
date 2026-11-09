import React, { useEffect, useState, useCallback } from 'react';
import { auctionApi, bidApi, paymentApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatPrice, timeLeft, isUrgent } from '../components/AuctionCard';
import { useUsername, useUsernames, setCachedUser } from '../utils/userCache';

const ITEM_EMOJI = ['🏺', '🎨', '💎', '📿', '🏛️', '🎭', '🕰️', '📚', '🎸', '🌿', '🏆', '🔮'];

function formatDateTime(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'medium' });
}

export default function AuctionDetailPage({ auctionId, setPage }) {
  const { token, user } = useAuth();
  const { addToast } = useToast();

  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [highest, setHighest] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bidLoading, setBidLoading] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [error, setError] = useState('');
  const [bidError, setBidError] = useState('');
  const [tab, setTab] = useState('details');
  const [tl, setTl] = useState('');
  const [imgError, setImgError] = useState(false);

  const displayBidderId = highest?.currentBidderId ?? auction?.highestBidderId;
  const sellerName = useUsername(auction?.sellerId, token);
  const highestBidderName = useUsername(displayBidderId, token);
  const bidderIds = bids.map(b => b.bidderId);
  const bidderNames = useUsernames(bidderIds, token);
  const itemImg = auction?.img || auction?.itemAttributes?.img || auction?.imageUrl;

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

  // Prime cache with currently logged-in user
  useEffect(() => {
    if (user?.id && user?.username) {
      setCachedUser(user.id, user.username);
    }
  }, [user]);

  // Load payment status if auction is closed
  useEffect(() => {
    if (auction?.status === 'CLOSED' && auctionId) {
      paymentApi.getByAuction(auctionId, token)
        .then(setPayment)
        .catch(() => setPayment(null));
    }
  }, [auction?.status, auctionId, token]);

  const handlePayWithStripe = async () => {
    if (!token) {
      setPayError('Please log in to complete payment.');
      return;
    }
    setPayLoading(true);
    setPayError('');
    try {
      const res = await paymentApi.createCheckoutSessionForAuction(
        auctionId,
        { title: auction.title },
        token
      );
      if (res && res.checkoutUrl) {
        // Redirect to Stripe Hosted Checkout
        window.location.href = res.checkoutUrl;
      } else {
        throw new Error('No checkout URL received from payment service');
      }
    } catch (err) {
      setPayError(err.message);
      addToast(err.message, 'error');
    } finally {
      setPayLoading(false);
    }
  };

  // Live countdown
  useEffect(() => {
    if (!auction?.endTime) return;
    const interval = setInterval(() => {
      const nextTl = timeLeft(auction.endTime);
      setTl(nextTl);
      // If timer just ended and auction is still marked ACTIVE, trigger fetch to sync with backend
      if (nextTl === 'Ended' && auction?.status === 'ACTIVE') {
        auctionApi.get(auctionId, token).then(a => {
          if (a && a.status !== auction.status) setAuction(a);
        }).catch(() => {});
      }
    }, 1000);
    setTl(timeLeft(auction.endTime));
    return () => clearInterval(interval);
  }, [auction?.endTime, auction?.status, auctionId, token]);

  // Live poll auction details, highest bid, bid history & payment every 3s
  useEffect(() => {
    if (!auctionId) return;

    const poll = async () => {
      try {
        const [a, h, b] = await Promise.all([
          auctionApi.get(auctionId, token).catch(() => null),
          bidApi.highest(auctionId, token).catch(() => null),
          bidApi.history(auctionId, { size: 20 }, token).catch(() => null),
        ]);
        if (a) {
          setAuction(prev => {
            if (!prev) return a;
            if (
              prev.status !== a.status ||
              prev.currentPrice !== a.currentPrice ||
              prev.highestBidderId !== a.highestBidderId
            ) {
              return a;
            }
            return prev;
          });
          if (a.status === 'CLOSED') {
            paymentApi.getByAuction(auctionId, token)
              .then(p => setPayment(p))
              .catch(() => {});
          }
        }
        if (h) setHighest(h);
        if (b) setBids(Array.isArray(b) ? b : b.content || []);
      } catch {}
    };

    const pollId = setInterval(poll, 3000);
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
              {/* Image Frame */}
              <div style={{
                minHeight: 260, maxHeight: 420, background: 'var(--bg-elevated)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5.5rem',
                borderBottom: '1px solid var(--border)', position: 'relative', overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute', top: '12px', left: '16px', zIndex: 2,
                  background: 'var(--bg-surface)', border: '1px solid var(--border)',
                  padding: '2px 8px', fontSize: '0.7rem', fontFamily: 'var(--font-mono)',
                  color: 'var(--text-muted)'
                }}>
                  Lot #{auction.id}
                </div>
                {itemImg && !imgError ? (
                  <img
                    src={itemImg}
                    alt={auction.title}
                    style={{
                      width: '100%',
                      maxHeight: '420px',
                      objectFit: 'contain',
                      background: 'var(--bg-elevated)'
                    }}
                    onError={() => setImgError(true)}
                  />
                ) : (
                  emoji
                )}
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
                        ['Seller', sellerName ? `@${sellerName}` : (auction.sellerId ? `User #${auction.sellerId}` : '—')],
                        ['Highest Bidder', highestBidderName ? `@${highestBidderName}` : (displayBidderId ? `User #${displayBidderId}` : 'None yet')],
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
                    {/* SVG Live Bidding Trajectory Graph */}
                    <div style={{ marginBottom: '1.25rem', padding: '1rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xs)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                          Price Progression
                        </span>
                        <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>
                          ● {bids.length} Bids Logged
                        </span>
                      </div>

                      <svg viewBox="0 0 500 100" style={{ width: '100%', height: '80px', overflow: 'visible' }}>
                        <line x1="30" y1="20" x2="480" y2="20" stroke="var(--border)" strokeWidth="0.75" strokeDasharray="3 3" />
                        <line x1="30" y1="50" x2="480" y2="50" stroke="var(--border)" strokeWidth="0.75" strokeDasharray="3 3" />
                        <line x1="30" y1="80" x2="480" y2="80" stroke="var(--border)" strokeWidth="1" />
                        <polyline
                          fill="none"
                          stroke="var(--accent)"
                          strokeWidth="2"
                          points={
                            bids.length > 1
                              ? bids.slice(0, 10).reverse().map((b, idx, arr) => {
                                  const x = 30 + (idx / Math.max(1, arr.length - 1)) * 440;
                                  const minAmt = parseFloat(auction.startingPrice || 0);
                                  const maxAmt = Math.max(minAmt + 1, ...arr.map(item => parseFloat(item.amount || 0)));
                                  const norm = (parseFloat(b.amount || minAmt) - minAmt) / (maxAmt - minAmt || 1);
                                  const y = 80 - (norm * 60);
                                  return `${x},${y}`;
                                }).join(' ')
                              : "30,80 250,50 480,20"
                          }
                        />
                        <circle cx="480" cy={bids.length > 1 ? "20" : "20"} r="4" fill="var(--accent)" stroke="#FFFFFF" strokeWidth="1.5" />
                      </svg>
                    </div>

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
                              <div className="bid-history-bidder">
                                @{bidderNames[bid.bidderId] || (user && String(user.id) === String(bid.bidderId) ? user.username : `User #${bid.bidderId}`)}
                                {user && String(user.id) === String(bid.bidderId) && (
                                  <span style={{ marginLeft: '0.35rem', fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 600 }}>(You)</span>
                                )}
                              </div>
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
                    by @{highestBidderName || (user && String(user.id) === String(displayBidderId) ? user.username : displayBidderId)}
                    {user && String(user.id) === String(displayBidderId) && (
                      <span style={{ marginLeft: '0.3rem', color: 'var(--accent)', fontWeight: 700 }}>(You)</span>
                    )}
                  </div>
                )}
                <div className="increment">
                  Min increment: {formatPrice(auction.minBidIncrement)}
                </div>
              </div>

              {/* High-Visibility Real-Time Countdown Timer Badge */}
              {tl && (
                <div style={{
                  textAlign: 'center', padding: '0.85rem 1rem', marginBottom: '1.25rem',
                  background: urgent ? 'var(--danger-bg)' : 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-xs)', border: `1px solid ${urgent ? 'var(--danger)' : 'var(--border)'}`,
                  color: urgent ? 'var(--danger)' : 'var(--text-secondary)',
                  fontWeight: 700, fontSize: '1rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                }}>
                  <span>{urgent ? '🔥' : '⏰'}</span>
                  <span>{tl}</span>
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
                        style={{ fontFamily: 'var(--font-mono)', fontSize: '1.05rem', fontWeight: 600 }}
                      />
                      <span className="form-hint">
                        Minimum: {formatPrice(parseFloat(auction.currentPrice || 0) + parseFloat(auction.minBidIncrement || 1))}
                      </span>

                      {/* Quick Increment Pill Steppers */}
                      <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.4rem' }}>
                        {[500, 1000, 5000, 10000].map(inc => (
                          <button
                            key={inc}
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ flex: 1, padding: '0.3rem 0.2rem', fontSize: '0.7rem', fontFamily: 'var(--font-mono)' }}
                            onClick={() => {
                              const cur = parseFloat(bidAmount || 0);
                              const minReq = parseFloat(auction.currentPrice || 0) + parseFloat(auction.minBidIncrement || 1);
                              const base = cur >= minReq ? cur : minReq;
                              setBidAmount((base + inc).toFixed(2));
                            }}
                          >
                            +₹{inc >= 1000 ? `${inc/1000}k` : inc}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      className="btn btn-primary btn-full btn-lg"
                      type="submit"
                      disabled={bidLoading || !bidAmount || parseFloat(bidAmount) < (parseFloat(auction.currentPrice || 0) + parseFloat(auction.minBidIncrement || 1))}
                    >
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
              ) : status === 'CLOSED' && user && displayBidderId && String(user.id) === String(displayBidderId) ? (
                <div style={{
                  padding: '1.25rem',
                  background: payment?.status === 'SUCCEEDED' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(59, 130, 246, 0.08)',
                  border: `1px solid ${payment?.status === 'SUCCEEDED' ? 'var(--success, #10b981)' : 'var(--accent, #3b82f6)'}`,
                  borderRadius: 'var(--radius-sm)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.25rem' }}>
                    {payment?.status === 'SUCCEEDED' ? '🏆' : '🎉'}
                  </div>
                  <h3 style={{
                    color: payment?.status === 'SUCCEEDED' ? 'var(--success, #10b981)' : 'var(--accent, #2563eb)',
                    marginBottom: '0.25rem',
                    fontSize: '1.1rem'
                  }}>
                    {payment?.status === 'SUCCEEDED' ? 'Payment Completed!' : 'You Won This Auction!'}
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                    Winning Amount: <strong>{formatPrice(displayPrice)}</strong>
                  </p>

                  {payment?.status === 'SUCCEEDED' ? (
                    <div className="badge badge-active" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                      ✓ Paid via Stripe
                    </div>
                  ) : (
                    <div>
                      {payError && <div className="alert alert-error" style={{ marginBottom: '0.5rem', fontSize: '0.82rem' }}>{payError}</div>}
                      <button
                        className="btn btn-primary btn-full btn-lg"
                        onClick={handlePayWithStripe}
                        disabled={payLoading}
                      >
                        {payLoading ? 'Redirecting to Stripe…' : '💳 Pay with Stripe'}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{
                  textAlign: 'center', padding: '1rem',
                  background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-muted)', fontWeight: 600,
                }}>
                  {status === 'CLOSED' ? (
                    <div>
                      <div>🏁 Auction Ended</div>
                      {displayBidderId && (
                        <div style={{ fontSize: '0.82rem', marginTop: '0.25rem', color: 'var(--text-secondary)' }}>
                          Won by @{highestBidderName || (user && String(user.id) === String(displayBidderId) ? user.username : displayBidderId)} for {formatPrice(displayPrice)}
                        </div>
                      )}
                    </div>
                  ) :
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

