import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { formatAmount, formatDate } from '../../utils/helpers';
import StatusBadge from '../../components/StatusBadge';
import { 
  FilePlus, Send, RotateCcw, XCircle, FileText, 
  ArrowRight, Scale, CheckCircle2 
} from 'lucide-react';

export default function HRDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/hr/dashboard');
      setData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load HR dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitToLegal = async (billId) => {
    if (!window.confirm('Forward this bill to Legal Department for verification?')) return;
    try {
      await api.post(`/hr/bills/${billId}/submit`);
      setActionSuccess('Bill submitted to Legal Department successfully!');
      fetchDashboard();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit bill');
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">HR Department Dashboard</h1>
          <p className="page-subtitle">Advocate bill registration, document scanning, and submission tracking</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link to="/bills/register" className="btn btn-primary">
            <FilePlus size={16} />
            Register New Bill
          </Link>
          <Link to="/advocates/add" className="btn btn-secondary">
            <Scale size={16} />
            Add Advocate
          </Link>
        </div>
      </div>

      {actionSuccess && (
        <div className="alert alert-success">
          <CheckCircle2 size={16} />
          <span>{actionSuccess}</span>
          <button style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setActionSuccess('')}>✕</button>
        </div>
      )}

      {error && (
        <div className="alert alert-danger">
          <span>{error}</span>
          <button style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setError('')}>✕</button>
        </div>
      )}

      {/* KPI Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <FileText size={20} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{data?.total || 0}</div>
            <div className="stat-label">Total Registered by HR</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon yellow">
            <Send size={20} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{data?.submitted || 0}</div>
            <div className="stat-label">Forwarded to Legal</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">
            <RotateCcw size={20} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{data?.returned || 0}</div>
            <div className="stat-label">Returned for Correction</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon red">
            <XCircle size={20} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{data?.rejected || 0}</div>
            <div className="stat-label">Rejected Bills</div>
          </div>
        </div>
      </div>

      {/* Returned Bills Alert Section */}
      {data?.returned > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: 24 }}>
          <RotateCcw size={18} />
          <div style={{ flex: 1 }}>
            <strong>Action Required:</strong> You have {data.returned} bill(s) returned by the Legal Department for correction. Please review the remarks and resubmit.
          </div>
          <Link to="/bills?status=RETURNED_TO_HR" className="btn btn-sm btn-warning">
            View Returned Bills
          </Link>
        </div>
      )}

      {/* Recent HR Bills */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">My Registered Bills</h2>
          <Link to="/bills?myBills=true" className="btn btn-sm btn-outline">
            View All My Bills
            <ArrowRight size={14} />
          </Link>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Bill ID</th>
                <th>Advocate</th>
                <th>Case No</th>
                <th>Original Bill No</th>
                <th>Claimed Amount</th>
                <th>Status</th>
                <th>Current Stage</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.recentBills?.length > 0 ? (
                data.recentBills.map((bill) => (
                  <tr key={bill._id}>
                    <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                      <Link to={`/bills/${bill._id}`} style={{ color: '#2563eb', textDecoration: 'none' }}>
                        {bill.billId}
                      </Link>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>{bill.advocate?.name || '—'}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{bill.courtCaseNumber}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{bill.originalBillNumber}</td>
                    <td className="amount" style={{ whiteSpace: 'nowrap' }}>{formatAmount(bill.claimedAmount)}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <StatusBadge status={bill.status} />
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span className="badge badge-draft">{bill.currentStage}</span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {bill.status === 'DRAFT' && (
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleSubmitToLegal(bill._id)}
                          >
                            <Send size={12} />
                            Submit
                          </button>
                        )}
                        <Link to={`/bills/${bill._id}`} className="btn btn-sm btn-secondary">
                          Details
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    No bills registered yet. Click "Register New Bill" above to get started.
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
