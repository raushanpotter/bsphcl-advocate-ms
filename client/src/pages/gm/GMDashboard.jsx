import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { formatAmount, formatDate } from '../../utils/helpers';
import StatusBadge from '../../components/StatusBadge';
import { 
  CheckCircle, Clock, XCircle, ArrowRight, 
  FileText, ShieldCheck, CheckSquare 
} from 'lucide-react';

export default function GMDashboard() {
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
        api.get('/gm/dashboard'),
        api.get('/gm/pending')
      ]);
      setData(dashRes.data.data);
      setPendingBills(pendingRes.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load GM dashboard');
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
          <h1 className="page-title">General Management Approval Dashboard</h1>
          <p className="page-subtitle">Competent Authority: Review legally verified claims, sanction amounts, and approve</p>
        </div>
        <Link to="/bills" className="btn btn-secondary">
          <FileText size={16} />
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
            <div className="stat-label">Bills Awaiting GM Sanction</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <CheckCircle size={20} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{data?.approved || 0}</div>
            <div className="stat-label">Sanctioned & Approved</div>
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

      {/* Pending GM Sanctions Table */}
      <div className="card mb-6">
        <div className="card-header">
          <h2 className="card-title">Legally Verified Bills Awaiting GM Sanction ({pendingBills.length})</h2>
          <span className="badge badge-legal_verified">Verified by Legal</span>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Bill ID</th>
                <th>Advocate</th>
                <th>Case Number</th>
                <th>Department</th>
                <th>Claimed Amount</th>
                <th>Legal Remarks</th>
                <th>Verified By</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingBills.length > 0 ? (
                pendingBills.map((bill) => (
                  <tr key={bill._id}>
                    <td style={{ fontWeight: 600 }}>
                      <Link to={`/bills/${bill._id}`} style={{ color: '#2563eb', textDecoration: 'none' }}>
                        {bill.billId}
                      </Link>
                    </td>
                    <td style={{ fontWeight: 500 }}>{bill.advocate?.name || '—'}</td>
                    <td>{bill.courtCaseNumber}</td>
                    <td>{bill.department}</td>
                    <td className="amount" style={{ whiteSpace: 'nowrap' }}>{formatAmount(bill.claimedAmount)}</td>
                    <td style={{ minWidth: '200px', maxWidth: '340px', whiteSpace: 'normal', wordBreak: 'break-word', fontSize: '13px', color: '#475569', lineHeight: '1.4' }}>
                      {bill.legalRemarks || 'Verified without specific conditions.'}
                    </td>
                    <td style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>
                      {bill.legalVerifiedBy?.name || 'Legal Head'}
                    </td>
                    <td>
                      <Link to={`/bills/${bill._id}`} className="btn btn-sm btn-success">
                        <ShieldCheck size={14} />
                        Sanction & Approve
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    No bills currently pending GM approval.
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
