import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { Profile } from './components/Profile';

const MainContent = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('login');

  if (token) {
    return <Profile />;
  }

  return (
    <div className="container">
      {activeTab === 'login' ? (
        <Login onSwitchToRegister={() => setActiveTab('register')} />
      ) : (
        <Register onSwitchToLogin={() => setActiveTab('login')} />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}
