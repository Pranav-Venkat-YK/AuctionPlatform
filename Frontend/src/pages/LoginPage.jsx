import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { userApi } from '../api';

export default function LoginPage({ setPage }) {
  const { login } = useAuth();
  const { addToast } = useToast();
  const [form, setForm] = useState({ usernameOrEmail: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await userApi.login({
        username: form.usernameOrEmail,
        usernameOrEmail: form.usernameOrEmail,
        password: form.password,
      });
      const userId = data.id || data.userId;
      login(data.token, { id: userId, username: data.username, email: data.email });
      addToast(`Welcome back, ${data.username}! 🎉`, 'success');
      setPage('home');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-card-logo">
          <div className="logo-mark">🔨</div>
          <h1>Bid<span style={{ color: 'var(--accent)' }}>Vault</span></h1>
          <p>Sign in to your auction account</p>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>⚠️ {error}</div>}

        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Username or Email</label>
            <input
              className="form-control"
              type="text"
              name="usernameOrEmail"
              value={form.usernameOrEmail}
              onChange={handle}
              placeholder="johndoe or john@example.com"
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-control"
              type="password"
              name="password"
              value={form.password}
              onChange={handle}
              placeholder="Your password"
              required
            />
          </div>
          <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="auth-divider">
          Don't have an account?{' '}
          <button onClick={() => setPage('register')}>Create one</button>
        </div>
      </div>
    </div>
  );
}

