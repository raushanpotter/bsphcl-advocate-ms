import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import Modal from '../../components/Modal';
import { UserPlus, Key, UserCheck, UserX, AlertCircle, CheckCircle, AtSign, Trash2 } from 'lucide-react';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Create User Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: 'HR',
    department: 'Human Resources',
    email: '',
    phone: ''
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);

  // Reset Password Modal
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);

  // Change User ID Modal
  const [isUserIdOpen, setIsUserIdOpen] = useState(false);
  const [newUserId, setNewUserId] = useState('');
  const [userIdSubmitting, setUserIdSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/users');
      setUsers(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.username || !formData.password || !formData.role) {
      setError('Please fill in all mandatory fields.');
      return;
    }

    try {
      setCreateSubmitting(true);
      setError('');
      await api.post('/admin/users', formData);
      setSuccess(`User ${formData.username} created successfully!`);
      setIsCreateOpen(false);
      setFormData({
        name: '',
        username: '',
        password: '',
        role: 'HR',
        department: 'Human Resources',
        email: '',
        phone: ''
      });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleToggleStatus = async (user) => {
    if (!window.confirm(`Are you sure you want to ${user.isActive ? 'deactivate' : 'activate'} ${user.name}?`)) {
      return;
    }

    try {
      await api.patch(`/admin/users/${user._id}/status`);
      setSuccess(`User status updated.`);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user status');
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    try {
      setResetSubmitting(true);
      await api.patch(`/admin/users/${selectedUser._id}/reset-password`, { newPassword });
      setSuccess(`Password for ${selectedUser.username} reset successfully!`);
      setIsResetOpen(false);
      setSelectedUser(null);
      setNewPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setResetSubmitting(false);
    }
  };

  const handleUserIdSubmit = async (e) => {
    e.preventDefault();
    if (!newUserId || !newUserId.trim()) {
      setError('New User ID cannot be empty.');
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
      setUserIdSubmitting(true);
      await api.patch(`/admin/users/${selectedUser._id}/change-username`, { newUsername: cleanId });
      setSuccess(`User ID for ${selectedUser.name} changed from "${selectedUser.username}" to "${cleanId}" successfully!`);
      setIsUserIdOpen(false);
      setSelectedUser(null);
      setNewUserId('');
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update User ID');
    } finally {
      setUserIdSubmitting(false);
    }
  };

  const handleDeleteUser = async (userToDelete) => {
    if (!window.confirm(`Are you sure you want to permanently delete account "${userToDelete.name}" (${userToDelete.username})?\n\nThis will completely remove this login credentials from the system.`)) {
      return;
    }

    try {
      setError('');
      setSuccess('');
      const res = await api.delete(`/admin/users/${userToDelete._id}`);
      setSuccess(res.data.message || `User ${userToDelete.username} deleted successfully.`);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user account.');
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
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Department User Management</h1>
          <p className="page-subtitle">Create, monitor and manage role credentials across BSPHCL departments</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsCreateOpen(true)}>
          <UserPlus size={16} />
          Create Department User
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: 16 }}>
          <AlertCircle size={16} />
          <span>{error}</span>
          <button style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setError('')}>✕</button>
        </div>
      )}

      {success && (
        <div className="alert alert-success" style={{ marginBottom: 16 }}>
          <CheckCircle size={16} />
          <span>{success}</span>
          <button style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setSuccess('')}>✕</button>
        </div>
      )}

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Role</th>
                <th>Department</th>
                <th>Email / Phone</th>
                <th>Status</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '30px' }}>
                    <div className="spinner" style={{ margin: '0 auto' }}></div>
                  </td>
                </tr>
              ) : users.length > 0 ? (
                users.map((u) => (
                  <tr key={u._id}>
                    <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{u.name}</td>
                    <td style={{ fontFamily: "'Consolas', monospace", color: '#1e3a5f', whiteSpace: 'nowrap' }}>{u.username}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span className={`badge ${getRoleBadge(u.role)}`}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ minWidth: '160px', maxWidth: '280px', whiteSpace: 'normal', wordBreak: 'break-word' }}>{u.department || '—'}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div>{u.email || '—'}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{u.phone}</div>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span className={`badge ${u.isActive ? 'badge-approved' : 'badge-rejected'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>
                      {new Date(u.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-success'}`}
                          onClick={() => handleToggleStatus(u)}
                          title={u.isActive ? 'Deactivate account' : 'Activate account'}
                        >
                          {u.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => {
                            setSelectedUser(u);
                            setNewPassword('');
                            setIsResetOpen(true);
                          }}
                          title="Reset Password"
                        >
                          <Key size={14} />
                          Reset
                        </button>
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => {
                            setSelectedUser(u);
                            setNewUserId(u.username);
                            setIsUserIdOpen(true);
                          }}
                          title="Change User ID / Username"
                        >
                          <AtSign size={14} />
                          Change ID
                        </button>
                        {u.username !== 'admin' && (
                          <button
                            className="btn btn-sm btn-outline"
                            style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                            onClick={() => handleDeleteUser(u)}
                            title="Delete department user account"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Department Account"
        size="lg"
      >
        <form onSubmit={handleCreateSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                Full Name <span className="required">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Ramesh Kumar"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Username <span className="required">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. hr_ramesh"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                Password <span className="required">*</span>
              </label>
              <input
                type="password"
                className="form-control"
                placeholder="Minimum 6 characters"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Role <span className="required">*</span>
              </label>
              <select
                className="form-control"
                value={formData.role}
                onChange={(e) => {
                  const role = e.target.value;
                  let dept = formData.department;
                  if (role === 'HR') dept = 'Human Resources';
                  if (role === 'LEGAL') dept = 'Legal Department';
                  if (role === 'GM') dept = 'General Management';
                  if (role === 'ACCOUNTS') dept = 'Accounts & Finance';
                  if (role === 'ADMIN') dept = 'Administration';
                  setFormData({ ...formData, role, department: dept });
                }}
                required
              >
                <option value="HR">HR (Bill Registration & Resubmission)</option>
                <option value="LEGAL">LEGAL (Verification & Remarks)</option>
                <option value="GM">GM (Management Approval & Sanction)</option>
                <option value="ACCOUNTS">ACCOUNTS (Payment Tracking)</option>
                <option value="ADMIN">ADMIN (Full Access)</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Department</label>
              <input
                type="text"
                className="form-control"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-control"
                placeholder="e.g. officer@bsphcl.bih.nic.in"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Mobile Number</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. 9876543210"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsCreateOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={createSubmitting}
            >
              {createSubmitting ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={isResetOpen}
        onClose={() => setIsResetOpen(false)}
        title={`Reset Password: ${selectedUser?.username}`}
      >
        <form onSubmit={handleResetSubmit}>
          <p className="text-muted mb-4">
            Enter a new password for <strong>{selectedUser?.name}</strong> ({selectedUser?.role}).
          </p>

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

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsResetOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={resetSubmitting}
            >
              {resetSubmitting ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Change User ID Modal */}
      <Modal
        isOpen={isUserIdOpen}
        onClose={() => setIsUserIdOpen(false)}
        title="Change Department User ID"
      >
        <form onSubmit={handleUserIdSubmit}>
          <p className="text-muted mb-4">
            Update the departmental login User ID (username) for <strong>{selectedUser?.name}</strong> ({selectedUser?.role}).
          </p>

          <div className="form-group">
            <label className="form-label">Current User ID</label>
            <input
              type="text"
              className="form-control"
              value={selectedUser?.username || ''}
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
              placeholder="e.g. hr_officer2"
              value={newUserId}
              onChange={(e) => setNewUserId(e.target.value.toLowerCase().replace(/\s+/g, ''))}
              required
              autoFocus
              style={{ fontFamily: 'monospace' }}
            />
            <small style={{ color: '#64748b', fontSize: '11.5px', marginTop: '4px', display: 'block' }}>
              Minimum 3 characters. Allowed: lowercase letters, numbers, underscores, dashes, and periods.
            </small>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsUserIdOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={userIdSubmitting}
            >
              {userIdSubmitting ? 'Updating...' : 'Update User ID'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
