import React from 'react';

export default function PaymentCancelPage({ setPage, setSelectedAuction }) {
  const urlParams = new URLSearchParams(window.location.search);
  const auctionId = urlParams.get('auction_id');

  const handleRetry = () => {
    if (auctionId) {
      setSelectedAuction(Number(auctionId));
      setPage('auction');
    } else {
      setPage('mybids');
    }
  };

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 550, margin: '2rem auto', textAlign: 'center' }}>
        <div className="card card-body" style={{ padding: '2.5rem 2rem' }}>
          <div style={{ fontSize: '4.5rem', marginBottom: '1rem' }}>⚠️</div>
          <h1 style={{ color: 'var(--danger, #ef4444)', marginBottom: '0.5rem', fontSize: '1.8rem' }}>
            Payment Cancelled
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.75rem', fontSize: '1rem' }}>
            The checkout session was cancelled or could not be completed. Your card was not charged.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={handleRetry}>
              Try Again
            </button>
            <button className="btn btn-secondary" onClick={() => setPage('mybids')}>
              My Won Auctions
            </button>
            <button className="btn btn-ghost" onClick={() => setPage('home')}>
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

