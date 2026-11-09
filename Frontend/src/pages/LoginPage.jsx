import React from 'react';
import AuthPage from './AuthPage';

export default function LoginPage({ setPage }) {
  return <AuthPage mode="login" setPage={setPage} />;
}
