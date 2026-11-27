import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { formatAmount, formatDate } from '../../utils/helpers';
import StatusBadge from '../../components/StatusBadge';
import { 
  BarChart3, Download, Filter, 
  Calendar, FileText, CheckCircle2, AlertCircle 
} from 'lucide-react';

export default function Reports() {
  const [summary, setSummary] = useState(null);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  // Filters
  const [status, setStatus] = useState('');
  const [dateType, setDateType] = useState('submissionDate');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchReportData();
  }, [status, dateType, startDate, endDate]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (status) params.status = status;
      if (dateType) params.dateType = dateType;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const [summaryRes, billsRes] = await Promise.all([
        api.get('/reports/summary'),
        api.get('/reports/bills', { params })
      ]);

      setSummary(summaryRes.data.data);
      setBills(billsRes.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate report data');
    } finally {
      setLoading(false);
    }
  };

  const generateClientCSV = (data) => {
    const headers = [
      'Bill ID', 'Advocate Name', 'Bar Enrollment', 'Advocate Mobile', 'Advocate Email',
      'Original Bill No', 'Court Case No', 'Court Name', 'Department',
      'Bill Date', 'Submission Date', 'Claimed Amount (INR)', 'Approved Amount (INR)',
      'Total Paid (INR)', 'Outstanding Liability (INR)', 'Status', 'Current Stage',
      'Sanction Letter No'
    ];
    const rows = [headers];
    data.forEach(b => {
      const approved = Number(b.approvedAmount || 0);
      const paid = Number(b.totalPaid || 0);
      const outstanding = approved > paid ? approved - paid : 0;
      rows.push([
        b.billId || '',
        b.advocate?.name || '',
        b.advocate?.enrollmentNumber || '',
        b.advocate?.mobile || '',
        b.advocate?.email || '',
        b.originalBillNumber || '',
        b.courtCaseNumber || '',
        b.courtName || '',
        b.department || '',
        b.billDate ? new Date(b.billDate).toLocaleDateString('en-IN') : '',
        b.submissionDate ? new Date(b.submissionDate).toLocaleDateString('en-IN') : '',
        Number(b.claimedAmount || 0),
        approved,
        paid,
        outstanding,
        b.status || '',
        b.currentStage || '',
        b.sanctionLetterNumber || ''
      ]);
    });
    const csvContent = rows
      .map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\r\n');
    const blob = new Blob(["\uFEFF", csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateSuffix = startDate || endDate ? `_${startDate || 'start'}_to_${endDate || 'today'}` : '';
    link.setAttribute('download', `BSPHCL_Advocate_Bills_Report${dateSuffix}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      setError('');
      const params = {};
      if (status) params.status = status;
      if (dateType) params.dateType = dateType;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      params.format = 'csv';

      const response = await api.get('/reports/bills', {
        params,
        responseType: 'blob'
      });

      // UTF-8 BOM so Excel opens with proper Indian Rupee and special characters
      const blob = new Blob(["\uFEFF", response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const dateSuffix = startDate || endDate ? `_${startDate || 'from_start'}_to_${endDate || 'today'}` : '';
      link.setAttribute('download', `BSPHCL_Advocate_Bills_Report${dateSuffix}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      if (bills.length > 0) {
        generateClientCSV(bills);
      } else {
        setError(err.response?.data?.message || 'Failed to export CSV report');
      }
    } finally {
      setExporting(false);
    }
  };

  // Quick Date Range Helpers
  const setThisMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const today = now.toISOString().split('T')[0];
    setStartDate(firstDay);
    setEndDate(today);
  };

  const setLast30Days = () => {
    const now = new Date();
    const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const today = now.toISOString().split('T')[0];
    setStartDate(past);
    setEndDate(today);
  };

  const setThisYear = () => {
    const now = new Date();
    const firstDay = `${now.getFullYear()}-01-01`;
    const today = now.toISOString().split('T')[0];
    setStartDate(firstDay);
    setEndDate(today);
  };

  const totalClaimed = bills.reduce((acc, b) => acc + (b.claimedAmount || 0), 0);
  const totalApproved = bills.reduce((acc, b) => acc + (b.approvedAmount || 0), 0);
  const totalPaid = bills.reduce((acc, b) => acc + (b.totalPaid || 0), 0);
  const totalOutstanding = totalApproved - totalPaid;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Executive Management Reports</h1>
          <p className="page-subtitle">Departmental analytics, advocate expenditure statements, and audit export</p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={handleExportCSV}
          disabled={exporting || loading}
          title="Export filtered report data into CSV format (Excel compatible)"
        >
          <Download size={16} />
          {exporting ? 'Generating CSV...' : 'Export to CSV'}
        </button>
      </div>

      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setError('')}>✕</button>
        </div>
      )}

      {/* Aggregate KPI Cards */}
      <div className="stats-grid mb-6">
        <div className="stat-card">
          <div className="stat-icon blue">
            <FileText size={20} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{bills.length}</div>
            <div className="stat-label">Bills in Report Scope</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon yellow">
            <BarChart3 size={20} />
          </div>
          <div className="stat-info">
            <div className="stat-value" title={formatAmount(totalClaimed)}>{formatAmount(totalClaimed)}</div>
            <div className="stat-label">Total Claimed Amount</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <CheckCircle2 size={20} />
          </div>
          <div className="stat-info">
            <div className="stat-value" title={formatAmount(totalApproved)}>{formatAmount(totalApproved)}</div>
            <div className="stat-label">Total Approved Amount</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon teal">
            <CheckCircle2 size={20} />
          </div>
          <div className="stat-info">
            <div className="stat-value" title={formatAmount(totalPaid)}>{formatAmount(totalPaid)}</div>
            <div className="stat-label">Total Settled (Paid)</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon red">
            <AlertCircle size={20} />
          </div>
          <div className="stat-info">
            <div className="stat-value" title={formatAmount(totalOutstanding)}>{formatAmount(totalOutstanding)}</div>
            <div className="stat-label">Outstanding Liability</div>
          </div>
        </div>
      </div>

      {/* Report Filter & Data Table */}
      <div className="card">
        <div className="filter-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={16} color="#64748b" />
            <span className="text-sm font-semibold">Filter Report By:</span>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              className="form-control"
              style={{ width: '150px', padding: '6px 10px' }}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All Bill Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="HR_SUBMITTED">Pending Legal</option>
              <option value="LEGAL_VERIFIED">Legal Verified</option>
              <option value="RETURNED_TO_HR">Returned to HR</option>
              <option value="APPROVED">GM Approved</option>
              <option value="PARTIALLY_PAID">Partially Paid</option>
              <option value="PAID">Fully Paid</option>
              <option value="REJECTED">Rejected</option>
            </select>

            <select
              className="form-control"
              style={{ width: '165px', padding: '6px 10px' }}
              value={dateType}
              onChange={(e) => setDateType(e.target.value)}
              title="Select date criteria"
            >
              <option value="submissionDate">Submission Date</option>
              <option value="billDate">Advocate Bill Date</option>
              <option value="createdAt">System Registration Date</option>
            </select>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="text-muted" style={{ fontSize: '12px' }}>From:</span>
              <input
                type="date"
                className="form-control"
                style={{ width: '135px', padding: '6px 8px' }}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                title="Start date"
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="text-muted" style={{ fontSize: '12px' }}>To:</span>
              <input
                type="date"
                className="form-control"
                style={{ width: '135px', padding: '6px 8px' }}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                title="End date"
              />
            </div>

            <div style={{ display: 'flex', gap: '4px' }}>
              <button type="button" className="btn btn-sm btn-outline" style={{ fontSize: '11px', padding: '4px 8px' }} onClick={setThisMonth}>
                This Month
              </button>
              <button type="button" className="btn btn-sm btn-outline" style={{ fontSize: '11px', padding: '4px 8px' }} onClick={setLast30Days}>
                Last 30 Days
              </button>
              <button type="button" className="btn btn-sm btn-outline" style={{ fontSize: '11px', padding: '4px 8px' }} onClick={setThisYear}>
                This Year
              </button>
            </div>

            {(status || startDate || endDate) && (
              <button
                className="btn btn-sm btn-outline"
                style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                onClick={() => { setStatus(''); setStartDate(''); setEndDate(''); }}
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ whiteSpace: 'nowrap' }}>Bill ID</th>
                <th style={{ whiteSpace: 'nowrap' }}>Advocate Name</th>
                <th style={{ whiteSpace: 'nowrap' }}>Bar Enrollment</th>
                <th style={{ whiteSpace: 'nowrap' }}>Original Bill No</th>
                <th style={{ whiteSpace: 'nowrap' }}>Submission Date</th>
                <th style={{ whiteSpace: 'nowrap' }}>Claimed (₹)</th>
                <th style={{ whiteSpace: 'nowrap' }}>Approved (₹)</th>
                <th style={{ whiteSpace: 'nowrap' }}>Paid (₹)</th>
                <th style={{ whiteSpace: 'nowrap' }}>Outstanding (₹)</th>
                <th style={{ whiteSpace: 'nowrap' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '30px' }}>
                    <div className="spinner" style={{ margin: '0 auto' }}></div>
                  </td>
                </tr>
              ) : bills.length > 0 ? (
                bills.map((b) => {
                  const billOutstanding = (b.approvedAmount || 0) - (b.totalPaid || 0);
                  return (
                    <tr key={b._id}>
                      <td style={{ fontWeight: 600, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                        <a href={`/bills/${b._id}`} style={{ color: '#2563eb', textDecoration: 'none' }}>
                          {b.billId}
                        </a>
                      </td>
                      <td style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>{b.advocate?.name || '—'}</td>
                      <td style={{ fontSize: '12.5px', color: '#475569', whiteSpace: 'nowrap' }}>{b.advocate?.enrollmentNumber || '—'}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{b.originalBillNumber}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{formatDate(b.submissionDate)}</td>
                      <td className="amount" style={{ whiteSpace: 'nowrap' }}>{formatAmount(b.claimedAmount)}</td>
                      <td className="amount amount-approved" style={{ whiteSpace: 'nowrap' }}>{formatAmount(b.approvedAmount)}</td>
                      <td className="amount amount-paid" style={{ whiteSpace: 'nowrap' }}>{formatAmount(b.totalPaid)}</td>
                      <td className="amount amount-outstanding" style={{ whiteSpace: 'nowrap' }}>
                        {b.approvedAmount ? formatAmount(billOutstanding) : '—'}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <StatusBadge status={b.status} />
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    No bills match the selected report filter.
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
