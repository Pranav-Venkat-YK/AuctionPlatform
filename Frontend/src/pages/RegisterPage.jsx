import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { userApi } from '../api';

export default function RegisterPage({ setPage }) {
  const { login } = useAuth();
  const { addToast } = useToast();
  const [form, setForm] = useState({ username: '', email: '', fullName: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await userApi.register(form);
      const data = await userApi.login({
        username: form.username,
        password: form.password,
      });
      const userId = data.id || data.userId;
      login(data.token, { id: userId, username: data.username, email: data.email });
      addToast(`Account created! Welcome, ${data.username}! 🎉`, 'success');
      setPage('home');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card" style={{ maxWidth: 480 }}>
        <div className="auth-card-logo">
          <div className="logo-mark">🔨</div>
          <h1>Bid<span style={{ color: 'var(--accent)' }}>Vault</span></h1>
          <p>Create your free auction account</p>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>⚠️ {error}</div>}

        <form onSubmit={submit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Username *</label>
              <input className="form-control" name="username" value={form.username} onChange={handle}
                placeholder="johndoe" required autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-control" name="fullName" value={form.fullName} onChange={handle}
                placeholder="John Doe" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input className="form-control" type="email" name="email" value={form.email} onChange={handle}
              placeholder="john@example.com" required />
          </div>
          <div className="form-group">
            <label className="form-label">Password *</label>
            <input className="form-control" type="password" name="password" value={form.password} onChange={handle}
              placeholder="Minimum 6 characters" required />
            <span className="form-hint">Must be at least 6 characters long</span>
          </div>

          <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <div className="auth-divider">
          Already have an account?{' '}
          <button onClick={() => setPage('login')}>Sign in</button>
        </div>
      </div>
    </div>
  );
}

