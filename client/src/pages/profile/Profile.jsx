import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { User, Lock, CheckCircle2, AlertCircle, Shield, AtSign } from 'lucide-react';

export default function Profile() {
  const { user, updateUser } = useAuth();

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // User ID state
  const [newUserId, setNewUserId] = useState('');
  const [userIdPassword, setUserIdPassword] = useState('');
  const [userIdLoading, setUserIdLoading] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChangeUserId = async (e) => {
    e.preventDefault();
    if (!newUserId || !newUserId.trim()) {
      setError('Please enter a new User ID.');
      return;
    }
    if (!userIdPassword) {
      setError('Please enter your current password to verify your identity.');
      return;
    }
    const cleanId = newUserId.trim().toLowerCase();
    if (cleanId.length < 3) {
      setError('User ID must be at least 3 characters long.');
      return;
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(cleanId)) {
      setError('User ID can only contain letters, numbers, underscores, dashes, and periods.');
      return;
    }

    try {
      setUserIdLoading(true);
      setError('');
      setSuccess('');
      const res = await api.post('/auth/change-username', {
        newUsername: cleanId,
        password: userIdPassword
      });
      setSuccess(`Your User ID has been successfully changed to "${res.data.user.username}". Use this new User ID for future logins.`);
      if (updateUser) {
        updateUser(res.data.user);
      }
      setNewUserId('');
      setUserIdPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change User ID');
    } finally {
      setUserIdLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword
      });
      setSuccess('Your password has been changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN': return 'badge-admin';
      case 'HR': return 'badge-hr';
      case 'LEGAL': return 'badge-legal';
      case 'GM': return 'badge-gm';
      case 'ACCOUNTS': return 'badge-accounts';
      default: return 'badge-draft';
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Department Account</h1>
          <p className="page-subtitle">User credentials, role authorization, and password management</p>
        </div>
      </div>

      {success && (
        <div className="alert alert-success">
          <CheckCircle2 size={16} />
          <span>{success}</span>
          <button style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setSuccess('')}>✕</button>
        </div>
      )}

      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setError('')}>✕</button>
        </div>
      )}

      {/* User Information Card */}
      <div className="card mb-6">
        <div className="card-header">
          <h2 className="card-title">Employee Profile</h2>
        </div>
        <div className="card-body">
          <div className="info-grid">
            <div className="info-item">
              <label>Official Name</label>
              <p style={{ fontWeight: 600 }}>{user?.name}</p>
            </div>
            <div className="info-item">
              <label>System Username</label>
              <p style={{ fontFamily: 'monospace' }}>{user?.username}</p>
            </div>
            <div className="info-item">
              <label>Departmental Role</label>
              <div>
                <span className={`badge ${getRoleBadge(user?.role)}`}>
                  {user?.role}
                </span>
              </div>
            </div>
            <div className="info-item">
              <label>Designated Department</label>
              <p>{user?.department || 'BSPHCL Central Holding'}</p>
            </div>
            <div className="info-item">
              <label>Official Email</label>
              <p>{user?.email || '—'}</p>
            </div>
            <div className="info-item">
              <label>Account Status</label>
              <div>
                <span className="badge badge-approved">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change User ID Card */}
      <div className="card mb-6">
        <div className="card-header">
          <h2 className="card-title">Change User ID (Username)</h2>
        </div>
        <div className="card-body">
          <form onSubmit={handleChangeUserId}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Current User ID</label>
                <input
                  type="text"
                  className="form-control"
                  value={user?.username || ''}
                  disabled
                  style={{ background: '#f8fafc', color: '#64748b', cursor: 'not-allowed', fontFamily: 'monospace' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  New User ID <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. new_username"
                  value={newUserId}
                  onChange={(e) => setNewUserId(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  required
                  style={{ fontFamily: 'monospace' }}
                />
                <small style={{ color: '#64748b', fontSize: '11.5px', marginTop: '4px', display: 'block' }}>
                  Letters, numbers, underscores, dashes, and periods. Min 3 characters.
                </small>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Current Password to Confirm <span className="required">*</span>
              </label>
              <input
                type="password"
                className="form-control"
                placeholder="Enter current password to verify identity"
                value={userIdPassword}
                onChange={(e) => setUserIdPassword(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button type="submit" className="btn btn-primary" disabled={userIdLoading}>
                <AtSign size={16} />
                {userIdLoading ? 'Updating User ID...' : 'Update User ID'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Change Password</h2>
        </div>
        <div className="card-body">
          <form onSubmit={handleChangePassword}>
            <div className="form-group">
              <label className="form-label">
                Current Password <span className="required">*</span>
              </label>
              <input
                type="password"
                className="form-control"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  New Password <span className="required">*</span>
                </label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Confirm New Password <span className="required">*</span>
                </label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                <Lock size={16} />
                {loading ? 'Updating Password...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
