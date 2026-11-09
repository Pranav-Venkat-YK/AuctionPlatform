import React from 'react';
import AuthPage from './AuthPage';

export default function RegisterPage({ setPage }) {
  return <AuthPage mode="register" setPage={setPage} />;
}
