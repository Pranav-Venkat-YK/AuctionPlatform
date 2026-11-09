import React, { useEffect, useState } from 'react';
import { paymentApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../components/AuctionCard';

export default function PaymentSuccessPage({ setPage, setSelectedAuction }) {
  const { token } = useAuth();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);

  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('session_id');
  const auctionId = urlParams.get('auction_id');

  useEffect(() => {
    async function fetchStatus() {
      try {
        let data = null;
        if (sessionId) {
          data = await paymentApi.confirmSession(sessionId, token).catch(() => null);
        }
        if (!data && auctionId) {
          data = await paymentApi.getByAuction(auctionId, token).catch(() => null);
        }
        if (data) {
          setPayment(data);
        }
      } catch (err) {
        console.error('Error confirming payment status:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStatus();
  }, [sessionId, auctionId, token]);

  const handleGoToAuction = () => {
    if (auctionId) {
      setSelectedAuction(Number(auctionId));
      setPage('auction');
    } else {
      setPage('home');
    }
  };

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 600, margin: '2rem auto', textAlign: 'center' }}>
        <div className="card card-body" style={{ padding: '2.5rem 2rem' }}>
          <div style={{ fontSize: '4.5rem', marginBottom: '1rem' }}>🎉</div>
          <h1 style={{ color: 'var(--success, #10b981)', marginBottom: '0.5rem', fontSize: '1.8rem' }}>
            Payment Successful!
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '1rem' }}>
            Thank you! Your payment has been processed securely via Stripe Sandbox.
          </p>

          {loading ? (
            <div className="spinner-wrap" style={{ margin: '1.5rem 0' }}>
              <div className="spinner" />
            </div>
          ) : (
            <div style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '1.25rem',
              textAlign: 'left',
              marginBottom: '1.75rem',
              fontSize: '0.92rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.6rem'
            }}>
              {auctionId && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Auction ID:</span>
                  <strong>#{auctionId}</strong>
                </div>
              )}
              {payment?.amount && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Amount Paid:</span>
                  <strong style={{ color: 'var(--success, #10b981)', fontSize: '1.05rem' }}>
                    {formatPrice(payment.amount)}
                  </strong>
                </div>
              )}
              {payment?.status && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Payment Status:</span>
                  <span className="badge badge-active" style={{ textTransform: 'uppercase' }}>
                    {payment.status}
                  </span>
                </div>
              )}
              {sessionId && (
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Stripe Session:</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {sessionId.substring(0, 24)}…
                  </span>
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={handleGoToAuction}>
              View Auction
            </button>
            <button className="btn btn-secondary" onClick={() => setPage('mybids')}>
              My Bids
            </button>
            <button className="btn btn-ghost" onClick={() => setPage('home')}>
              Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

