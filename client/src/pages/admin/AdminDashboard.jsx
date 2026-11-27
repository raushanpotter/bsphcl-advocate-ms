import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { formatAmount, formatDate } from '../../utils/helpers';
import StatusBadge from '../../components/StatusBadge';
import { 
  FileText, Clock, CheckCircle2, AlertTriangle, 
  CreditCard, IndianRupee, Users, Scale, ArrowRight 
} from 'lucide-react';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/dashboard');
      setData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data.');
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

  if (error) {
    return (
      <div className="alert alert-danger">
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Executive Overview</h1>
          <p className="page-subtitle">BSPHCL Advocate Bill Management System — Administrator Command Center</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link to="/admin/users" className="btn btn-primary">
            <Users size={16} />
            Manage Users
          </Link>
          <Link to="/bills" className="btn btn-secondary">
            <FileText size={16} />
            All Bills
          </Link>
        </div>
      </div>

      {/* Primary KPI Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <FileText size={20} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{data?.totalBills || 0}</div>
            <div className="stat-label">Total Bills Registered</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon yellow">
            <Clock size={20} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{data?.pendingLegal || 0}</div>
            <div className="stat-label">Pending with Legal</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">
            <Clock size={20} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{data?.pendingGM || 0}</div>
            <div className="stat-label">Pending with GM</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <CheckCircle2 size={20} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{data?.approved || 0}</div>
            <div className="stat-label">GM Approved Bills</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">
            <CreditCard size={20} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{data?.partiallyPaid || 0}</div>
            <div className="stat-label">Partially Paid</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon teal">
            <CheckCircle2 size={20} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{data?.paid || 0}</div>
            <div className="stat-label">Fully Settled (Paid)</div>
          </div>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="card mb-6">
        <div className="card-header">
          <h2 className="card-title">Financial Summary</h2>
        </div>
        <div className="card-body">
          <div className="stats-grid" style={{ marginBottom: 0 }}>
            <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', minWidth: 0, overflow: 'hidden' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Total Claimed
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={formatAmount(data?.totalClaimed)}>
                {formatAmount(data?.totalClaimed)}
              </div>
            </div>

            <div style={{ padding: '12px 14px', background: '#ecfdf5', borderRadius: '8px', border: '1px solid #a7f3d0', minWidth: 0, overflow: 'hidden' }}>
              <div style={{ fontSize: '11px', color: '#065f46', fontWeight: 600, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Total Approved
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#047857', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={formatAmount(data?.totalApproved)}>
                {formatAmount(data?.totalApproved)}
              </div>
            </div>

            <div style={{ padding: '12px 14px', background: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe', minWidth: 0, overflow: 'hidden' }}>
              <div style={{ fontSize: '11px', color: '#1e40af', fontWeight: 600, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Total Disbursed (Paid)
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#1d4ed8', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={formatAmount(data?.totalPaid)}>
                {formatAmount(data?.totalPaid)}
              </div>
            </div>

            <div style={{ padding: '12px 14px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca', minWidth: 0, overflow: 'hidden' }}>
              <div style={{ fontSize: '11px', color: '#991b1b', fontWeight: 600, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Total Outstanding
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#dc2626', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={formatAmount(data?.totalOutstanding)}>
                {formatAmount(data?.totalOutstanding)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Bills Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Recent Bill Activity</h2>
          <Link to="/bills" className="btn btn-sm btn-outline">
            View All Bills
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
                <th>Claimed</th>
                <th>Approved</th>
                <th>Paid</th>
                <th>Stage</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {data?.recentBills?.length > 0 ? (
                data.recentBills.map((bill) => (
                  <tr key={bill._id}>
                    <td style={{ fontWeight: 600, color: '#1e3a5f', whiteSpace: 'nowrap' }}>
                      <Link to={`/bills/${bill._id}`} style={{ textDecoration: 'none', color: '#2563eb' }}>
                        {bill.billId}
                      </Link>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>{bill.advocate?.name || '—'}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{bill.courtCaseNumber}</td>
                    <td className="amount" style={{ whiteSpace: 'nowrap' }}>{formatAmount(bill.claimedAmount)}</td>
                    <td className="amount amount-approved" style={{ whiteSpace: 'nowrap' }}>{formatAmount(bill.approvedAmount)}</td>
                    <td className="amount amount-paid" style={{ whiteSpace: 'nowrap' }}>{formatAmount(bill.totalPaid)}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span className="badge badge-draft">{bill.currentStage}</span>
                    </td>
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
                  <td colSpan="9" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                    No bills recorded yet.
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
