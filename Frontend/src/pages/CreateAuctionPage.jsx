import React, { useState } from 'react';
import { auctionApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

function toISOLocal(dt) {
  // Convert datetime-local value to ISO without timezone shift
  return dt ? new Date(dt).toISOString().replace('Z', '') : undefined;
}

export default function CreateAuctionPage({ setPage, setSelectedAuction }) {
  const { token, user } = useAuth();
  const { addToast } = useToast();

  const [form, setForm] = useState({
    title: '',
    description: '',
    startingPrice: '',
    reservePrice: '',
    minBidIncrement: '1.00',
    startTime: '',
    endTime: '',
    // Item attributes as dynamic key-value pairs
  });

  const [attrs, setAttrs] = useState([{ key: '', value: '' }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!user) {
    return (
      <div className="page">
        <div className="container">
          <div className="alert alert-warning" style={{ maxWidth: 500 }}>
            🔒 You must be logged in to create an auction.
          </div>
          <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setPage('login')}>
            Log In
          </button>
        </div>
      </div>
    );
  }

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const setAttr = (i, field, val) => {
    setAttrs(prev => prev.map((a, idx) => idx === i ? { ...a, [field]: val } : a));
  };

  const addAttr = () => setAttrs(prev => [...prev, { key: '', value: '' }]);
  const removeAttr = i => setAttrs(prev => prev.filter((_, idx) => idx !== i));

  const submit = async e => {
    e.preventDefault();
    setError('');

    if (!form.title.trim()) { setError('Title is required'); return; }
    if (!form.startingPrice || parseFloat(form.startingPrice) <= 0) { setError('Starting price must be > 0'); return; }
    if (!form.startTime || !form.endTime) { setError('Start and end times are required'); return; }
    if (new Date(form.endTime) <= new Date(form.startTime)) { setError('End time must be after start time'); return; }

    // Build item attributes object
    const itemAttributes = {};
    attrs.forEach(({ key, value }) => {
      if (key.trim()) itemAttributes[key.trim()] = value.trim();
    });

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      sellerId: user.id || user.userId,
      startingPrice: parseFloat(form.startingPrice),
      reservePrice: form.reservePrice ? parseFloat(form.reservePrice) : null,
      minBidIncrement: parseFloat(form.minBidIncrement) || 1,
      startTime: form.startTime,
      endTime: form.endTime,
      itemAttributes: Object.keys(itemAttributes).length > 0 ? itemAttributes : null,
    };

    setLoading(true);
    try {
      const created = await auctionApi.create(payload, token);
      addToast('Auction created successfully! 🎉', 'success');
      setSelectedAuction(created.id);
      setPage('auction');
    } catch (err) {
      setError(err.message || 'Failed to create auction');
    } finally {
      setLoading(false);
    }
  };

  const minStart = new Date(Date.now() + 60000).toISOString().slice(0, 16);

  return (
    <div className="page">
      <div className="container">
        <div className="create-form-wrapper">
          <div className="page-header">
            <div>
              <h1 className="page-title">Create New Auction</h1>
              <p className="page-subtitle">List your item and start receiving bids</p>
            </div>
            <button className="btn btn-secondary" onClick={() => setPage('home')}>Cancel</button>
          </div>

          {error && <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>⚠️ {error}</div>}

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Basic Info */}
            <div className="card card-body">
              <div className="section-title">📋 Basic Information</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Item Title *</label>
                  <input className="form-control" name="title" value={form.title} onChange={handle}
                    placeholder="e.g. Antique Pocket Watch — 1920s Swiss Movement" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-control" name="description" value={form.description} onChange={handle}
                    placeholder="Describe the item, its condition, provenance, dimensions, etc."
                    style={{ minHeight: 100 }} />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="card card-body">
              <div className="section-title">💰 Pricing</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Starting Price (₹) *</label>
                    <input className="form-control" type="number" name="startingPrice" value={form.startingPrice}
                      onChange={handle} placeholder="0.00" min="0.01" step="0.01" required />
                    <span className="form-hint">The opening bid amount</span>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Reserve Price (₹)</label>
                    <input className="form-control" type="number" name="reservePrice" value={form.reservePrice}
                      onChange={handle} placeholder="Optional minimum to sell" min="0" step="0.01" />
                    <span className="form-hint">Item won't sell below this</span>
                  </div>
                </div>
                <div className="form-group" style={{ maxWidth: 260 }}>
                  <label className="form-label">Minimum Bid Increment (₹) *</label>
                  <input className="form-control" type="number" name="minBidIncrement" value={form.minBidIncrement}
                    onChange={handle} placeholder="1.00" min="0.01" step="0.01" required />
                  <span className="form-hint">Each new bid must exceed current by at least this amount</span>
                </div>
              </div>
            </div>

            {/* Schedule */}
            <div className="card card-body">
              <div className="section-title">🗓️ Schedule</div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Start Time *</label>
                  <input className="form-control" type="datetime-local" name="startTime" value={form.startTime}
                    onChange={handle} min={minStart} required />
                </div>
                <div className="form-group">
                  <label className="form-label">End Time *</label>
                  <input className="form-control" type="datetime-local" name="endTime" value={form.endTime}
                    onChange={handle} min={form.startTime || minStart} required />
                </div>
              </div>
            </div>

            {/* Item Attributes */}
            <div className="card card-body">
              <div className="section-title">🏷️ Item Attributes</div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                Add custom attributes like condition, material, year, dimensions, etc.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {attrs.map((attr, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      className="form-control"
                      placeholder="Key (e.g. Condition)"
                      value={attr.key}
                      onChange={e => setAttr(i, 'key', e.target.value)}
                      style={{ flex: '0 0 40%' }}
                    />
                    <input
                      className="form-control"
                      placeholder="Value (e.g. Excellent)"
                      value={attr.value}
                      onChange={e => setAttr(i, 'value', e.target.value)}
                      style={{ flex: 1 }}
                    />
                    {attrs.length > 1 && (
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeAttr(i)}
                        style={{ color: 'var(--danger)', flexShrink: 0 }}>
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button type="button" className="btn btn-secondary btn-sm" style={{ marginTop: '0.75rem', alignSelf: 'flex-start' }}
                onClick={addAttr}>
                + Add Attribute
              </button>
            </div>

            {/* Summary Preview */}
            {form.title && form.startingPrice && (
              <div className="alert alert-info">
                <div>
                  <strong>Preview: </strong>"{form.title}" — Starting at {
                    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(form.startingPrice)
                  }
                  {form.endTime && ` · Ends ${new Date(form.endTime).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}`}
                </div>
              </div>
            )}

            <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading}>
              {loading ? 'Creating Auction…' : '🔨 Create Auction'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

