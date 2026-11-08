import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const Profile = () => {
  const { token, user, logout, updateUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '',
    email: '',
    fullName: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(`/users/${user.id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Failed to load user profile');
        }

        const data = await response.json();
        setProfile(data);
        setEditForm({
          username: data.username || '',
          email: data.email || '',
          fullName: data.fullName || '',
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (user && user.id && token) {
      fetchProfile();
    }
  }, [user, token]);

  const handleEditChange = (e) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const response = await fetch(`/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      setProfile(data);
      updateUser({ username: data.username, email: data.email });
      setSuccess('Profile updated successfully');
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <p style={{ color: 'var(--text-muted)' }}>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="header">
        <h1>User Profile</h1>
        <p>Manage your account settings and credentials</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {!editing ? (
        <div>
          <div className="profile-field">
            <div className="profile-label">User ID</div>
            <div className="profile-value">{profile?.id}</div>
          </div>

          <div className="profile-field">
            <div className="profile-label">Username</div>
            <div className="profile-value">{profile?.username}</div>
          </div>

          <div className="profile-field">
            <div className="profile-label">Email Address</div>
            <div className="profile-value">{profile?.email}</div>
          </div>

          <div className="profile-field">
            <div className="profile-label">Full Name</div>
            <div className="profile-value">{profile?.fullName || 'Not provided'}</div>
          </div>

          <div className="profile-field">
            <div className="profile-label">Account Created</div>
            <div className="profile-value">
              {profile?.createdAt ? new Date(profile.createdAt).toLocaleString() : 'N/A'}
            </div>
          </div>

          <button
            type="button"
            className="btn"
            onClick={() => setEditing(true)}
          >
            Edit Profile
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={logout}
          >
            Log Out
          </button>
        </div>
      ) : (
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={editForm.username}
              onChange={handleEditChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={editForm.email}
              onChange={handleEditChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={editForm.fullName}
              onChange={handleEditChange}
            />
          </div>

          <button type="submit" className="btn" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setEditing(false);
              setError('');
            }}
          >
            Cancel
          </button>
        </form>
      )}
    </div>
  );
};
