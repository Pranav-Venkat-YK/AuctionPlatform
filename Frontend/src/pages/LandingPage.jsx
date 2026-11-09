import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function LandingPage({ setPage }) {
  const { user } = useAuth();

  return (
    <div className="landing-page">
      {/* ============================================================
          HERO SECTION — Sovereign Luxury Presence
          ============================================================ */}
      <section className="landing-hero-section">
        <div className="container">
          <div className="landing-hero-content">
            {/* Status Pill Badge */}
            <div className="landing-badge">
              <span className="landing-badge-dot" />
              <span>LIVE AUCTION ECOSYSTEM · MILITARY-GRADE SPEED & SECURITY</span>
            </div>

            {/* Main Headline */}
            <h1 className="landing-title">
              Where Rare Artifacts & <br />
              <span className="landing-title-accent">Discerning Collectors</span> Converge.
            </h1>

            {/* Narrative Subtitle */}
            <p className="landing-subtitle">
              BidVault is an enterprise-grade distributed auction marketplace engineered for rare timepieces,
              fine horology, historic masterworks, and bespoke collectibles. Powered by microsecond Kafka event streams,
              automated reserve verification, and bank-grade Stripe settlement escrow.
            </p>

            {/* Primary Action Button Bar */}
            <div className="landing-actions">
              {user ? (
                <>
                  <button
                    className="btn btn-primary btn-lg"
                    onClick={() => setPage('home')}
                  >
                    🔨 Enter Auctions Dashboard
                  </button>
                  <button
                    className="btn btn-secondary btn-lg"
                    onClick={() => setPage('create')}
                  >
                    ➕ List an Item
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="btn btn-primary btn-lg"
                    onClick={() => setPage('register')}
                    style={{ minWidth: 190 }}
                  >
                    ✨ Get Started — Register
                  </button>
                  <button
                    className="btn btn-secondary btn-lg"
                    onClick={() => setPage('login')}
                    style={{ minWidth: 160 }}
                  >
                    🔑 Member Sign In
                  </button>
                  <button
                    className="btn btn-ghost btn-lg"
                    onClick={() => setPage('home')}
                  >
                    Explore Catalog →
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
