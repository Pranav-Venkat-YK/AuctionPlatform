import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => 
    sessionStorage.getItem('bv_token') || localStorage.getItem('bv_token') || null
  );
  const [user, setUser] = useState(() => {
    try { 
      return JSON.parse(sessionStorage.getItem('bv_user') || localStorage.getItem('bv_user')); 
    } catch { 
      return null; 
    }
  });

  const login = useCallback((authToken, userData) => {
    setToken(authToken);
    setUser(userData);
    sessionStorage.setItem('bv_token', authToken);
    sessionStorage.setItem('bv_user', JSON.stringify(userData));
    localStorage.setItem('bv_token', authToken);
    localStorage.setItem('bv_user', JSON.stringify(userData));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    sessionStorage.removeItem('bv_token');
    sessionStorage.removeItem('bv_user');
    localStorage.removeItem('bv_token');
    localStorage.removeItem('bv_user');
  }, []);

  const updateUser = useCallback((data) => {
    setUser(prev => {
      const updated = { ...prev, ...data };
      sessionStorage.setItem('bv_user', JSON.stringify(updated));
      localStorage.setItem('bv_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};

