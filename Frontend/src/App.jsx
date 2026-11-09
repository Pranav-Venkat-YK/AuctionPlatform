import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import AuctionDetailPage from './pages/AuctionDetailPage';
import CreateAuctionPage from './pages/CreateAuctionPage';
import MyBidsPage from './pages/MyBidsPage';
import ProfilePage from './pages/ProfilePage';
import LiveAuctionsPage from './pages/LiveAuctionsPage';
import MyAuctionsPage from './pages/MyAuctionsPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentCancelPage from './pages/PaymentCancelPage';

function AppContent() {
  const { user, token } = useAuth();
  const [page, setPage] = useState(() => {
    if (window.location.pathname.startsWith('/payment/success')) return 'payment-success';
    if (window.location.pathname.startsWith('/payment/cancel')) return 'payment-cancel';
    return (token && user ? 'home' : 'login');
  });
  const [selectedAuction, setSelectedAuction] = useState(null);

  // Authentication gate: enforce login/register for unauthenticated users
  useEffect(() => {
    if (!token || !user) {
      if (page !== 'login' && page !== 'register') {
        setPage('login');
      }
    } else {
      // If authenticated and currently on an auth page, redirect to the dashboard
      if (page === 'login' || page === 'register') {
        setPage('home');
      }
    }
  }, [token, user, page]);

  // If user is not logged in, render the Login / Register screen
  if (!token || !user) {
    return <AuthPage mode={page === 'register' ? 'register' : 'login'} setPage={setPage} />;
  }

  // Once authenticated, render dashboard or selected internal view
  const renderPage = () => {
    switch (page) {
      case 'auction':         return <AuctionDetailPage auctionId={selectedAuction} setPage={setPage} />;
      case 'create':          return <CreateAuctionPage setPage={setPage} setSelectedAuction={setSelectedAuction} />;
      case 'mybids':          return <MyBidsPage setPage={setPage} setSelectedAuction={setSelectedAuction} />;
      case 'profile':         return <ProfilePage setPage={setPage} setSelectedAuction={setSelectedAuction} />;
      case 'live':            return <LiveAuctionsPage setPage={setPage} setSelectedAuction={setSelectedAuction} />;
      case 'myauctions':      return <MyAuctionsPage setPage={setPage} setSelectedAuction={setSelectedAuction} />;
      case 'payment-success': return <PaymentSuccessPage setPage={setPage} setSelectedAuction={setSelectedAuction} />;
      case 'payment-cancel':  return <PaymentCancelPage setPage={setPage} setSelectedAuction={setSelectedAuction} />;
      case 'home':
      default:                return <HomePage setPage={setPage} setSelectedAuction={setSelectedAuction} />;
    }
  };

  return (
    <div>
      <Navbar page={page} setPage={setPage} />
      {renderPage()}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
