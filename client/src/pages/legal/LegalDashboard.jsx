import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { formatAmount, formatDate } from '../../utils/helpers';
import StatusBadge from '../../components/StatusBadge';
import { 
  FileCheck, Clock, RotateCcw, XCircle, 
  ArrowRight, CheckSquare, Eye 
} from 'lucide-react';

export default function LegalDashboard() {
  const [data, setData] = useState(null);
  const [pendingBills, setPendingBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dashRes, pendingRes] = await Promise.all([
        api.get('/legal/dashboard'),
        api.get('/legal/pending')
      ]);
      setData(dashRes.data.data);
      setPendingBills(pendingRes.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load Legal dashboard');
    } finally {
      setLoading(false);
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
          <h1 className="page-title">Legal Department Dashboard</h1>
          <p className="page-subtitle">Scrutinize advocate court case records, claim authenticity, and documents</p>
        </div>
        <Link to="/bills" className="btn btn-secondary">
          <FileCheck size={16} />
          All Bills
        </Link>
      </div>

      {error && (
        <div className="alert alert-danger">
          <span>{error}</span>
          <button style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setError('')}>✕</button>
        </div>
      )}

      {/* KPI Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon yellow">
            <Clock size={20} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{data?.pending || 0}</div>
            <div className="stat-label">Bills Awaiting Verification</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue">
            <FileCheck size={20} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{data?.verified || 0}</div>
            <div className="stat-label">Verified & Sent to GM</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">
            <RotateCcw size={20} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{data?.returned || 0}</div>
            <div className="stat-label">Returned to HR</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon red">
            <XCircle size={20} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{data?.rejected || 0}</div>
            <div className="stat-label">Rejected by Legal</div>
          </div>
        </div>
      </div>

      {/* Pending Verification Table */}
      <div className="card mb-6">
        <div className="card-header">
          <h2 className="card-title">Bills Requiring Legal Verification ({pendingBills.length})</h2>
          <span className="badge badge-hr_submitted">Action Required</span>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Bill ID</th>
                <th>Advocate</th>
                <th>Enrollment No</th>
                <th>Case Number</th>
                <th>Court</th>
                <th>Claimed Amount</th>
                <th>Submission Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingBills.length > 0 ? (
                pendingBills.map((bill) => (
                  <tr key={bill._id}>
                    <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                      <Link to={`/bills/${bill._id}`} style={{ color: '#2563eb', textDecoration: 'none' }}>
                        {bill.billId}
                      </Link>
                    </td>
                    <td style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>{bill.advocate?.name || '—'}</td>
                    <td style={{ whiteSpace: 'nowrap', fontFamily: "'Consolas', monospace" }}>{bill.advocate?.enrollmentNumber || '—'}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{bill.courtCaseNumber}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{bill.courtName}</td>
                    <td className="amount" style={{ whiteSpace: 'nowrap' }}>{formatAmount(bill.claimedAmount)}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDate(bill.submissionDate)}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <Link to={`/bills/${bill._id}`} className="btn btn-sm btn-primary">
                        <CheckSquare size={14} />
                        Verify Bill
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    All caught up! No bills currently waiting for legal verification.
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
