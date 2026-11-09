import React, { useState, useRef } from 'react';
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
    img: '',
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
  const [imageMode, setImageMode] = useState('upload'); // 'upload' | 'url'
  const [imageMeta, setImageMeta] = useState(null); // { name, size, dimensions }
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

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

  const processFile = file => {
    if (!file) return;
    if (!file.type.match(/^image\/(jpeg|jpg|png|webp|gif)$/i)) {
      setError('Please select a valid image file (JPG, PNG, or WebP).');
      return;
    }
    setError('');

    const reader = new FileReader();
    reader.onerror = () => setError('Failed to read image file.');
    reader.onload = ev => {
      const img = new Image();
      img.onerror = () => setError('Failed to process image file.');
      img.onload = () => {
        // Auto-scale to max 1440px on longest side for optimal high-DPI quality & fast transfer
        const MAX = 1440;
        let w = img.width;
        let h = img.height;
        if (w > MAX || h > MAX) {
          if (w > h) {
            h = Math.round((h * MAX) / w);
            w = MAX;
          } else {
            w = Math.round((w * MAX) / h);
            h = MAX;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);

        const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(mime, 0.88);
        const approxSizeKb = (dataUrl.length * 0.75 / 1024).toFixed(1);

        setForm(f => ({ ...f, img: dataUrl }));
        setImageMeta({
          name: file.name,
          size: `${approxSizeKb} KB`,
          dimensions: `${w} × ${h} px`,
        });
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setForm(f => ({ ...f, img: '' }));
    setImageMeta(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

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
    if (form.img && form.img.trim()) {
      itemAttributes['img'] = form.img.trim();
    }

    const formatIso = dt => (dt && dt.length === 16 ? `${dt}:00` : dt);

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      img: form.img.trim() || null,
      sellerId: Number(user?.id || user?.userId),
      startingPrice: parseFloat(form.startingPrice),
      reservePrice: form.reservePrice ? parseFloat(form.reservePrice) : null,
      minBidIncrement: parseFloat(form.minBidIncrement) || 1,
      startTime: formatIso(form.startTime),
      endTime: formatIso(form.endTime),
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

  const toLocalIso = (d) => {
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  const minStart = toLocalIso(new Date(Date.now() + 60000));

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
                {/* Auction Item Image */}
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>Item Image (JPG / PNG)</label>
                    
                    {/* Method Dropdown / Selector */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Source:</span>
                      <select
                        className="form-control"
                        value={imageMode}
                        onChange={e => setImageMode(e.target.value)}
                        style={{ padding: '0.3rem 0.75rem', fontSize: '0.82rem', width: 'auto' }}
                      >
                        <option value="upload">💻 Local System (.jpg / .png)</option>
                        <option value="url">🔗 Web Image URL</option>
                      </select>
                    </div>
                  </div>

                  {/* Hidden native file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    style={{ display: 'none' }}
                    onChange={e => {
                      if (e.target.files?.[0]) processFile(e.target.files[0]);
                    }}
                  />

                  {/* If image is selected/loaded, show preview container */}
                  {form.img ? (
                    <div className="image-preview-container">
                      <img
                        src={form.img}
                        alt="Auction Item Preview"
                        className="image-preview-thumb"
                        onError={() => setError('Image failed to render. Please check the file or URL.')}
                      />
                      <div className="image-preview-meta">
                        <div className="image-preview-name">
                          {imageMeta?.name || (form.img.startsWith('data:') ? 'Uploaded Local Image' : form.img)}
                        </div>
                        <div className="image-preview-info">
                          {imageMeta ? `${imageMeta.dimensions} · ${imageMeta.size} · Ready to save to Postgres` : 'External Image URL'}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem' }}>
                          {imageMode === 'upload' && (
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              📂 Choose Another File
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--danger)' }}
                            onClick={clearImage}
                          >
                            Remove Image
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : imageMode === 'upload' ? (
                    /* Local System File Picker & Dropzone */
                    <div
                      className={`image-upload-zone ${dragOver ? 'dragover' : ''}`}
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={e => { e.preventDefault(); setDragOver(false); }}
                      onDrop={e => {
                        e.preventDefault();
                        setDragOver(false);
                        if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
                      }}
                    >
                      <div className="image-upload-icon">📁</div>
                      <div className="image-upload-title">
                        Choose a .jpg or .png from your computer
                      </div>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ pointerEvents: 'none', margin: '0.25rem 0' }}
                      >
                        Browse Local Files...
                      </button>
                      <div className="image-upload-hint">
                        Or drag & drop here · JPG, PNG, WebP · Encoded and saved directly into Postgres
                      </div>
                    </div>
                  ) : (
                    /* Direct URL input */
                    <div>
                      <input
                        className="form-control"
                        name="img"
                        value={form.img}
                        onChange={handle}
                        placeholder="https://example.com/item-photo.jpg"
                        type="url"
                      />
                      <span className="form-hint">Direct link to an image of the auction item</span>
                    </div>
                  )}
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

