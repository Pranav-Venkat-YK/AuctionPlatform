import React from 'react';

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

  if (d > 1) return `${d}d ${h}h left`;
  if (d === 1) return `${d}d ${h}h ${m}m left`;
  if (h > 0) return `${h}h ${m}m left`;
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

export default function AuctionCard({ auction, onClick }) {
  const emoji = ITEM_EMOJI[auction.id % ITEM_EMOJI.length];
  const tl = timeLeft(auction.endTime);
  const urgent = isUrgent(auction.endTime);
  const status = (auction.status || '').toUpperCase();
  const badgeClass = {
    ACTIVE: 'badge-active', OPEN: 'badge-open', PENDING: 'badge-pending',
    SCHEDULED: 'badge-scheduled', CLOSED: 'badge-closed', CANCELLED: 'badge-cancelled',
  }[status] || 'badge-pending';

  return (
    <div className="card card-hover auction-card" style={{ cursor: 'pointer' }} onClick={onClick}>
      <div className="auction-card-img">
        <span style={{ fontSize: '3.5rem' }}>{emoji}</span>
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
            {tl && (
              <div className={`auction-timer${urgent ? ' urgent' : ''}`}>
                {urgent ? '🔥' : '⏰'} {tl}
              </div>
            )}
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
              Seller #{auction.sellerId}
            </div>
          </div>
        </div>
      </div>
      <div className="auction-card-footer">
        <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={e => { e.stopPropagation(); onClick(); }}>
          View & Bid →
        </button>
      </div>
    </div>
  );
}

