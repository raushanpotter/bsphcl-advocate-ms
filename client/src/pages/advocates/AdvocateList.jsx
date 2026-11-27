import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Scale, PlusCircle, Search, Edit2, 
  ExternalLink, UserCheck, UserX, AlertCircle,
  Trash2, CheckCircle2
} from 'lucide-react';

export default function AdvocateList() {
  const { user } = useAuth();
  const [advocates, setAdvocates] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const canManage = ['ADMIN', 'HR'].includes(user?.role);

  useEffect(() => {
    fetchAdvocates();
  }, [page, statusFilter]);

  const fetchAdvocates = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 15 };
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== '') params.isActive = statusFilter;

      const res = await api.get('/advocates', { params });
      setAdvocates(res.data.data);
      setTotal(res.data.total);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch advocates');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAdvocate = async (adv) => {
    if (!window.confirm(`Are you sure you want to delete advocate "${adv.name}" (${adv.enrollmentNumber})?\n\nThis will permanently remove the advocate record.`)) {
      return;
    }

    try {
      setError('');
      setSuccess('');
      const res = await api.delete(`/advocates/${adv._id}`);
      setSuccess(res.data.message || `Advocate "${adv.name}" was deleted successfully.`);
      fetchAdvocates();
    } catch (err) {
      const data = err.response?.data;
      if (data?.hasBills) {
        if (window.confirm(`${data.message}\n\nDo you want to delete advocate "${adv.name}" along with their ${data.billCount} registered bill(s)?`)) {
          try {
            const forceRes = await api.delete(`/advocates/${adv._id}?force=true`);
            setSuccess(forceRes.data.message || `Advocate "${adv.name}" deleted.`);
            fetchAdvocates();
            return;
          } catch (forceErr) {
            setError(forceErr.response?.data?.message || 'Failed to force delete advocate.');
            return;
          }
        }
      }
      setError(data?.message || err.message || 'Failed to delete advocate.');
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchAdvocates();
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Advocate Directory</h1>
          <p className="page-subtitle">Roster of empanelled and standing advocates for BSPHCL legal representation</p>
        </div>
        {canManage && (
          <Link to="/advocates/add" className="btn btn-primary">
            <PlusCircle size={16} />
            Add New Advocate
          </Link>
        )}
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

      <div className="card">
        {/* Search & Filter Bar */}
        <div className="filter-bar">
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', flex: 1, minWidth: '280px' }}>
            <div className="search-bar" style={{ flex: 1 }}>
              <Search size={16} />
              <input
                type="text"
                placeholder="Search by advocate name, enrollment no, or mobile..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-secondary">Search</button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label className="text-sm font-semibold text-muted">Status:</label>
            <select
              className="form-control"
              style={{ width: '130px', padding: '6px 10px' }}
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Status</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>

        {/* Advocates Table */}
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Advocate ID</th>
                <th>Name</th>
                <th>Enrollment Number</th>
                <th>Mobile</th>
                <th>Email</th>
                <th>Specialization</th>
                <th>Status</th>
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
              ) : advocates.length > 0 ? (
                advocates.map((adv) => (
                  <tr key={adv._id}>
                    <td style={{ fontWeight: 600, color: '#1e3a5f', fontFamily: 'monospace' }}>
                      <Link to={`/advocates/${adv._id}`} style={{ color: '#2563eb', textDecoration: 'none' }}>
                        {adv.advocateId}
                      </Link>
                    </td>
                    <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{adv.name}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span className="badge badge-draft" style={{ fontFamily: "'Consolas', monospace" }}>
                        {adv.enrollmentNumber}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>{adv.mobile || '—'}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{adv.email || '—'}</td>
                    <td style={{ minWidth: '160px', maxWidth: '300px', whiteSpace: 'normal', wordBreak: 'break-word' }}>{adv.specialization || 'General Legal Practice'}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span className={`badge ${adv.isActive ? 'badge-approved' : 'badge-rejected'}`}>
                        {adv.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <Link to={`/advocates/${adv._id}`} className="btn btn-sm btn-secondary" title="View advocate profile & bills">
                          <ExternalLink size={14} />
                          View
                        </Link>
                        {canManage && (
                          <>
                            <Link to={`/advocates/${adv._id}/edit`} className="btn btn-sm btn-outline" title="Edit advocate details">
                              <Edit2 size={14} />
                              Edit
                            </Link>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDeleteAdvocate(adv)}
                              title="Delete advocate"
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    No advocates found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
