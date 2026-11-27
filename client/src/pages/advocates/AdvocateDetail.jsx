import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatAmount, formatDate } from '../../utils/helpers';
import StatusBadge from '../../components/StatusBadge';
import { 
  ArrowLeft, Scale, Phone, Mail, 
  MapPin, Briefcase, FileText, PlusCircle,
  Edit2, Trash2, AlertCircle
} from 'lucide-react';

export default function AdvocateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [advocate, setAdvocate] = useState(null);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');

  const canManage = ['ADMIN', 'HR'].includes(user?.role);

  useEffect(() => {
    fetchAdvocateDetails();
  }, [id]);

  const fetchAdvocateDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/advocates/${id}`);
      setAdvocate(res.data.data);
      setBills(res.data.bills || []);
    } catch (err) {
      setLoadError(err.response?.data?.message || 'Failed to fetch advocate profile');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAdvocate = async () => {
    if (!window.confirm(`Are you sure you want to permanently delete advocate "${advocate.name}" (${advocate.enrollmentNumber})?`)) {
      return;
    }

    try {
      setActionError('');
      await api.delete(`/advocates/${id}`);
      navigate('/advocates');
    } catch (err) {
      const data = err.response?.data;
      if (data?.hasBills) {
        if (window.confirm(`${data.message}\n\nDo you want to delete advocate "${advocate.name}" along with their ${data.billCount} registered bill(s)?`)) {
          try {
            await api.delete(`/advocates/${id}?force=true`);
            navigate('/advocates');
            return;
          } catch (forceErr) {
            setActionError(forceErr.response?.data?.message || 'Failed to force delete advocate.');
            return;
          }
        }
      }
      setActionError(data?.message || err.message || 'Failed to delete advocate.');
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  if (loadError || !advocate) {
    return (
      <div className="alert alert-danger">
        {loadError || 'Advocate not found'}
      </div>
    );
  }

  const totalClaimed = bills.reduce((acc, b) => acc + (b.claimedAmount || 0), 0);
  const totalApproved = bills.reduce((acc, b) => acc + (b.approvedAmount || 0), 0);
  const totalPaid = bills.reduce((acc, b) => acc + (b.totalPaid || 0), 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <Link to="/advocates" className="btn btn-sm btn-outline mb-4" style={{ display: 'inline-flex' }}>
            <ArrowLeft size={14} /> Back to Directory
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 className="page-title">{advocate.name}</h1>
            <span className={`badge ${advocate.isActive ? 'badge-approved' : 'badge-rejected'}`}>
              {advocate.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p className="page-subtitle">Registration ID: {advocate.advocateId} | Bar Enrollment: {advocate.enrollmentNumber}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {canManage && (
            <>
              <Link to={`/advocates/${advocate._id}/edit`} className="btn btn-secondary">
                <Edit2 size={16} />
                Edit Profile
              </Link>
              <button className="btn btn-danger" onClick={handleDeleteAdvocate}>
                <Trash2 size={16} />
                Delete Advocate
              </button>
            </>
          )}
          <Link to="/bills/register" className="btn btn-primary">
            <PlusCircle size={16} />
            Register Bill for Advocate
          </Link>
        </div>
      </div>

      {actionError && (
        <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
          <AlertCircle size={16} />
          <span>{actionError}</span>
          <button style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setActionError('')}>✕</button>
        </div>
      )}

      {/* Info Card */}
      <div className="card mb-6">
        <div className="card-header">
          <h2 className="card-title">Advocate Profile Details</h2>
        </div>
        <div className="card-body">
          <div className="info-grid">
            <div className="info-item">
              <label>Full Legal Name</label>
              <p>{advocate.name}</p>
            </div>
            <div className="info-item">
              <label>Bar Council Enrollment</label>
              <p style={{ fontFamily: 'monospace' }}>{advocate.enrollmentNumber}</p>
            </div>
            <div className="info-item">
              <label>Mobile Number</label>
              <p>{advocate.mobile}</p>
            </div>
            <div className="info-item">
              <label>Email Address</label>
              <p>{advocate.email || '—'}</p>
            </div>
            <div className="info-item">
              <label>Specialization</label>
              <p>{advocate.specialization || 'General Legal Practice'}</p>
            </div>
            <div className="info-item">
              <label>Chamber / Office Address</label>
              <p>{advocate.address || '—'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Financial stats for this advocate */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <FileText size={20} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{bills.length}</div>
            <div className="stat-label">Total Bills Submitted</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon yellow">
            <Scale size={20} />
          </div>
          <div className="stat-info">
            <div className="stat-value" title={formatAmount(totalClaimed)}>{formatAmount(totalClaimed)}</div>
            <div className="stat-label">Total Amount Claimed</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <Scale size={20} />
          </div>
          <div className="stat-info">
            <div className="stat-value" title={formatAmount(totalApproved)}>{formatAmount(totalApproved)}</div>
            <div className="stat-label">Total Approved by GM</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon teal">
            <Scale size={20} />
          </div>
          <div className="stat-info">
            <div className="stat-value" title={formatAmount(totalPaid)}>{formatAmount(totalPaid)}</div>
            <div className="stat-label">Total Paid to Date</div>
          </div>
        </div>
      </div>

      {/* Advocate's Bills History Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Bill History for {advocate.name}</h2>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Bill ID</th>
                <th>Case Number</th>
                <th>Original Bill No</th>
                <th>Submission Date</th>
                <th>Claimed Amount</th>
                <th>Approved Amount</th>
                <th>Paid Amount</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {bills.length > 0 ? (
                bills.map((bill) => (
                  <tr key={bill._id}>
                    <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                      <Link to={`/bills/${bill._id}`} style={{ color: '#2563eb', textDecoration: 'none' }}>
                        {bill.billId}
                      </Link>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>{bill.courtCaseNumber}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{bill.originalBillNumber}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDate(bill.submissionDate)}</td>
                    <td className="amount" style={{ whiteSpace: 'nowrap' }}>{formatAmount(bill.claimedAmount)}</td>
                    <td className="amount amount-approved" style={{ whiteSpace: 'nowrap' }}>{formatAmount(bill.approvedAmount)}</td>
                    <td className="amount amount-paid" style={{ whiteSpace: 'nowrap' }}>{formatAmount(bill.totalPaid)}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <StatusBadge status={bill.status} />
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <Link to={`/bills/${bill._id}`} className="btn btn-sm btn-secondary">
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    No bills recorded for this advocate yet.
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
