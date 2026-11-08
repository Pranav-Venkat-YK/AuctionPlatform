import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import AuctionDetailPage from './pages/AuctionDetailPage';
import CreateAuctionPage from './pages/CreateAuctionPage';
import MyBidsPage from './pages/MyBidsPage';
import ProfilePage from './pages/ProfilePage';
import LiveAuctionsPage from './pages/LiveAuctionsPage';
import MyAuctionsPage from './pages/MyAuctionsPage';

function AppContent() {
  const [page, setPage] = useState('home');
  const [selectedAuction, setSelectedAuction] = useState(null);

  const renderPage = () => {
    switch (page) {
      case 'login':    return <LoginPage setPage={setPage} />;
      case 'register': return <RegisterPage setPage={setPage} />;
      case 'auction':  return <AuctionDetailPage auctionId={selectedAuction} setPage={setPage} />;
      case 'create':   return <CreateAuctionPage setPage={setPage} setSelectedAuction={setSelectedAuction} />;
      case 'mybids':   return <MyBidsPage setPage={setPage} setSelectedAuction={setSelectedAuction} />;
      case 'profile':  return <ProfilePage setPage={setPage} setSelectedAuction={setSelectedAuction} />;
      case 'live':     return <LiveAuctionsPage setPage={setPage} setSelectedAuction={setSelectedAuction} />;
      case 'myauctions': return <MyAuctionsPage setPage={setPage} setSelectedAuction={setSelectedAuction} />;
      default:         return <HomePage setPage={setPage} setSelectedAuction={setSelectedAuction} />;
    }
  };

  const noNav = page === 'login' || page === 'register';

  return (
    <div>
      {!noNav && <Navbar page={page} setPage={setPage} />}
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

