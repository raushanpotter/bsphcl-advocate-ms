import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { formatAmount, formatDate } from '../../utils/helpers';
import StatusBadge from '../../components/StatusBadge';
import { 
  CreditCard, Clock, CheckCircle2, 
  IndianRupee, ArrowRight, PlusCircle,
  Trash2, AlertCircle 
} from 'lucide-react';

export default function AccountsDashboard() {
  const [data, setData] = useState(null);
  const [pendingBills, setPendingBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dashRes, pendingRes] = await Promise.all([
        api.get('/accounts/dashboard'),
        api.get('/accounts/pending')
      ]);
      setData(dashRes.data.data);
      setPendingBills(pendingRes.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load Accounts dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBill = async (bill) => {
    const isConfirmed = window.confirm(
      `⚠️ VERIFICATION REQUIRED (Account Officer)\n\nAre you sure you want to permanently remove bill "${bill.billId}"?\n\n• Advocate: ${bill.advocate?.name || 'N/A'}\n• Sanction Amount: ₹${bill.approvedAmount || 0}\n\nThis will completely remove this bill and all associated records. This action cannot be undone.`
    );
    if (!isConfirmed) return;

    try {
      setError('');
      setSuccess('');
      const res = await api.delete(`/bills/${bill._id}`);
      setSuccess(res.data.message || `Bill ${bill.billId} was permanently removed.`);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove bill.');
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
          <h1 className="page-title">Accounts & Finance Dashboard</h1>
          <p className="page-subtitle">Disbursement management, offline payment recording, and balance tracking</p>
        </div>
        <Link to="/reports" className="btn btn-secondary">
          <CreditCard size={16} />
          Financial Reports
        </Link>
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

      {/* KPI Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon yellow">
            <Clock size={20} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{data?.awaitingPayment || 0}</div>
            <div className="stat-label">Awaiting First Payment</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">
            <CreditCard size={20} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{data?.partiallyPaid || 0}</div>
            <div className="stat-label">Partially Paid Bills</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <CheckCircle2 size={20} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{data?.paid || 0}</div>
            <div className="stat-label">Fully Settled Bills</div>
          </div>
        </div>
      </div>

      {/* Financial Numbers Card */}
      <div className="card mb-6">
        <div className="card-header">
          <h2 className="card-title">Sanction vs Disbursed Overview</h2>
        </div>
        <div className="card-body">
          <div className="stats-grid" style={{ marginBottom: 0 }}>
            <div style={{ padding: '12px 14px', background: '#ecfdf5', borderRadius: '8px', border: '1px solid #a7f3d0', minWidth: 0, overflow: 'hidden' }}>
              <div style={{ fontSize: '11px', color: '#065f46', fontWeight: 600, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Total Approved Sanctions
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#047857', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={formatAmount(data?.totalApproved)}>
                {formatAmount(data?.totalApproved)}
              </div>
            </div>

            <div style={{ padding: '12px 14px', background: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe', minWidth: 0, overflow: 'hidden' }}>
              <div style={{ fontSize: '11px', color: '#1e40af', fontWeight: 600, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Total Paid to Date
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#1d4ed8', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={formatAmount(data?.totalPaid)}>
                {formatAmount(data?.totalPaid)}
              </div>
            </div>

            <div style={{ padding: '12px 14px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca', minWidth: 0, overflow: 'hidden' }}>
              <div style={{ fontSize: '11px', color: '#991b1b', fontWeight: 600, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Remaining Outstanding Liability
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#dc2626', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={formatAmount(data?.totalOutstanding)}>
                {formatAmount(data?.totalOutstanding)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bills Pending Payment Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Approved Bills Pending Payment ({pendingBills.length})</h2>
          <span className="badge badge-approved">GM Approved</span>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Bill ID</th>
                <th>Advocate</th>
                <th>Sanction Letter No</th>
                <th>Approved Amount</th>
                <th>Paid Amount</th>
                <th>Outstanding Balance</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingBills.length > 0 ? (
                pendingBills.map((bill) => {
                  const outstanding = (bill.approvedAmount || 0) - (bill.totalPaid || 0);
                  return (
                    <tr key={bill._id}>
                      <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                        <Link to={`/bills/${bill._id}`} style={{ color: '#2563eb', textDecoration: 'none' }}>
                          {bill.billId}
                        </Link>
                      </td>
                      <td style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>{bill.advocate?.name || '—'}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{bill.sanctionLetterNumber || '—'}</td>
                      <td className="amount amount-approved" style={{ whiteSpace: 'nowrap' }}>{formatAmount(bill.approvedAmount)}</td>
                      <td className="amount amount-paid" style={{ whiteSpace: 'nowrap' }}>{formatAmount(bill.totalPaid)}</td>
                      <td className="amount amount-outstanding" style={{ whiteSpace: 'nowrap' }}>{formatAmount(outstanding)}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <StatusBadge status={bill.status} />
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <Link to={`/bills/${bill._id}`} className="btn btn-sm btn-primary">
                            <PlusCircle size={14} />
                            Record Payment
                          </Link>
                          <button
                            className="btn btn-sm btn-outline"
                            style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                            onClick={() => handleRemoveBill(bill)}
                            title="Remove Bill (Account Officer exclusive)"
                          >
                            <Trash2 size={14} />
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    No bills currently pending payment.
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
