import React, { useState, useEffect, useRef } from 'react';
import { useUsername } from '../utils/userCache';

export function formatPrice(price) {
  if (price == null) return '—';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(price);
}

export function timeLeft(endTime) {
  if (!endTime) return null;
  const end = new Date(endTime);
  const now = new Date();
  const diff = end - now;
  if (diff <= 0) return 'Ended';

  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);

  if (d > 0) return `${d}d ${h}h ${m}m ${s}s left`;
  if (h > 0) return `${h}h ${m}m ${s}s left`;
  if (m > 0) return `${m}m ${s}s left`;
  return `${s}s left`;
}

export function isUrgent(endTime) {
  if (!endTime) return false;
  const diff = new Date(endTime) - new Date();
  return diff > 0 && diff < 3600000; // less than 1 hour
}

const EMOJI_FOR_STATUS = {
  ACTIVE: '🟢', PENDING: '🟡', SCHEDULED: '🔵', CLOSED: '⚫',
  OPEN: '🟢', CANCELLED: '🔴',
};

const ITEM_EMOJI = ['🏺', '🎨', '💎', '📿', '🏛️', '🎭', '🕰️', '📚', '🎸', '🌿', '🏆', '🔮'];

export default function AuctionCard({ auction, onClick, onExpire }) {
  const emoji = ITEM_EMOJI[auction.id % ITEM_EMOJI.length];
  const [tl, setTl] = useState(() => timeLeft(auction.endTime));
  const [urgent, setUrgent] = useState(() => isUrgent(auction.endTime));
  const [imgError, setImgError] = useState(false);
  const sellerName = useUsername(auction.sellerId);
  const expiredNotifiedRef = useRef(false);

  // Live 1-second decrement timer
  useEffect(() => {
    setTl(timeLeft(auction.endTime));
    setUrgent(isUrgent(auction.endTime));
    expiredNotifiedRef.current = false;

    if (!auction.endTime) return;

    const interval = setInterval(() => {
      const nextTl = timeLeft(auction.endTime);
      setTl(nextTl);
      setUrgent(isUrgent(auction.endTime));

      if (nextTl === 'Ended' && !expiredNotifiedRef.current) {
        expiredNotifiedRef.current = true;
        if (onExpire) {
          onExpire(auction.id);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [auction.endTime, auction.id, onExpire]);

  const status = (auction.status || '').toUpperCase();
  const badgeClass = {
    ACTIVE: 'badge-active', OPEN: 'badge-open', PENDING: 'badge-pending',
    SCHEDULED: 'badge-scheduled', CLOSED: 'badge-closed', CANCELLED: 'badge-cancelled',
  }[status] || 'badge-pending';

  const lotNumber = String(auction.id || 1).padStart(3, '0');
  const itemImg = auction?.img || auction?.itemAttributes?.img || auction?.imageUrl;

  return (
    <div className="card card-hover auction-card" style={{ cursor: 'pointer' }} onClick={onClick}>
      <div className="auction-card-img" style={{ position: 'relative' }}>
        <div style={{
          position: 'absolute', top: '10px', left: '12px', zIndex: 2,
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          padding: '2px 8px', fontSize: '0.68rem', fontFamily: 'var(--font-mono)',
          color: 'var(--text-muted)'
        }}>
          #{auction.id}
        </div>

        {itemImg && !imgError ? (
          <img
            src={itemImg}
            alt={auction.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={() => setImgError(true)}
          />
        ) : (
          <span style={{ fontSize: '3.5rem' }}>{emoji}</span>
        )}

        {/* Real-time countdown timer badge */}
        {tl && (
          <div style={{
            position: 'absolute', bottom: '8px', left: '12px', right: '12px',
            background: 'var(--bg-surface)', border: `1px solid ${urgent ? 'var(--danger)' : 'var(--border)'}`,
            padding: '4px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            fontSize: '0.74rem', fontFamily: 'var(--font-mono)'
          }}>
            <span style={{ color: 'var(--text-muted)' }}>Time Remaining:</span>
            <span style={{ color: urgent ? 'var(--danger)' : 'var(--text-primary)', fontWeight: 600 }}>
              {tl === 'Ended' ? '🏁 Ended' : (urgent ? '🔥 ' : '⏰ ') + tl}
            </span>
          </div>
        )}
      </div>

      <div className="auction-card-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
          <div className="auction-card-title">{auction.title}</div>
          <span className={`badge ${badgeClass}`}>{status}</span>
        </div>

        {auction.description && (
          <div className="auction-card-desc">{auction.description}</div>
        )}

        <div className="auction-card-meta">
          <div>
            <div className="auction-price-label">Current Bid</div>
            <div className="auction-price">{formatPrice(auction.currentPrice)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              Seller: {sellerName ? `@${sellerName}` : (auction.sellerId ? `User #${auction.sellerId}` : '—')}
            </div>
          </div>
        </div>
      </div>
      <div className="auction-card-footer" style={{ padding: '0.75rem 1.25rem 1.25rem', background: 'transparent' }}>
        <button className="btn btn-primary btn-sm btn-full" onClick={e => { e.stopPropagation(); onClick(); }}>
          View & Bid →
        </button>
      </div>
    </div>
  );
}

