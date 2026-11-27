import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';

export default function AdvocateForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    enrollmentNumber: '',
    mobile: '',
    email: '',
    address: '',
    specialization: 'Civil & Electricity Law',
    isActive: true
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) {
      api.get(`/advocates/${id}`)
        .then(res => {
          const adv = res.data.data;
          setFormData({
            name: adv.name || '',
            enrollmentNumber: adv.enrollmentNumber || '',
            mobile: adv.mobile || '',
            email: adv.email || '',
            address: adv.address || '',
            specialization: adv.specialization || '',
            isActive: adv.isActive ?? true
          });
        })
        .catch(err => setError(err.response?.data?.message || 'Failed to load advocate'))
        .finally(() => setInitialLoading(false));
    }
  }, [id, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.enrollmentNumber.trim()) {
      setError('Name and Enrollment Number are mandatory fields.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      if (isEdit) {
        await api.put(`/advocates/${id}`, formData);
      } else {
        await api.post('/advocates', formData);
      }
      navigate('/advocates');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save advocate details.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <Link to="/advocates" className="btn btn-sm btn-outline mb-4" style={{ display: 'inline-flex' }}>
            <ArrowLeft size={14} /> Back to Directory
          </Link>
          <h1 className="page-title">{isEdit ? 'Edit Advocate Profile' : 'Add New Empanelled Advocate'}</h1>
          <p className="page-subtitle">Ensure Bar Council registration details are accurately registered</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  Advocate Full Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Adv. Arvind Kumar Sinha"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Enrollment / Registration Number <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. BR/1234/2012"
                  value={formData.enrollmentNumber}
                  onChange={(e) => setFormData({ ...formData, enrollmentNumber: e.target.value.toUpperCase() })}
                  required
                  style={{ fontFamily: "'Consolas', monospace" }}
                />
                <span style={{ fontSize: '11px', color: '#64748b' }}>Bar Council of India / State Bar registration number.</span>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Mobile Number</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. 9835012345 (Optional)"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="e.g. adv.arvind@gmail.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Specialization / Practice Areas</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. High Court / Labour Tribunal / Commercial & Electricity Act"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Chamber / Residential Address</label>
              <textarea
                className="form-control"
                placeholder="Full address in Patna or district court jurisdiction"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            {isEdit && (
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  <span className="text-sm font-semibold">Active Empanelled Advocate</span>
                </label>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <Link to="/advocates" className="btn btn-secondary">
                Cancel
              </Link>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                <Save size={16} />
                {loading ? 'Saving...' : isEdit ? 'Update Advocate' : 'Register Advocate'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
