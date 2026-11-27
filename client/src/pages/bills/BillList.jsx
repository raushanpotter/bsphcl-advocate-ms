import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatAmount, formatDate } from '../../utils/helpers';
import StatusBadge from '../../components/StatusBadge';
import { 
  FileText, Search, PlusCircle, Filter, 
  ArrowRight, ExternalLink, Calendar, Download 
} from 'lucide-react';

export default function BillList() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [bills, setBills] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [stage, setStage] = useState(searchParams.get('stage') || '');
  const [startDate, setStartDate] = useState(searchParams.get('startDate') || '');
  const [endDate, setEndDate] = useState(searchParams.get('endDate') || '');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const myBills = searchParams.get('myBills') === 'true';

  useEffect(() => {
    fetchBills();
  }, [page, status, stage, startDate, endDate, myBills]);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 15 };
      if (search.trim()) params.search = search.trim();
      if (status) params.status = status;
      if (stage) params.stage = stage;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (myBills) params.myBills = 'true';

      const res = await api.get('/bills', { params });
      setBills(res.data.data);
      setTotal(res.data.total);
      setPages(res.data.pages || 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch bills');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchBills();
  };

  const clearFilters = () => {
    setSearch('');
    setStatus('');
    setStage('');
    setStartDate('');
    setEndDate('');
    setPage(1);
    setSearchParams({});
  };

  const [exporting, setExporting] = useState(false);
  const handleExportCSV = async () => {
    try {
      setExporting(true);
      setError('');
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (status) params.status = status;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      params.format = 'csv';

      const response = await api.get('/reports/bills', {
        params,
        responseType: 'blob'
      });

      const blob = new Blob(["\uFEFF", response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const dateSuffix = startDate || endDate ? `_${startDate || 'from_start'}_to_${endDate || 'today'}` : '';
      link.setAttribute('download', `BSPHCL_Advocate_Bills${dateSuffix}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to export bills to CSV');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{myBills ? 'My Registered Bills' : 'Advocate Bills Master Registry'}</h1>
          <p className="page-subtitle">Track bill progress through HR, Legal verification, GM sanction, and Accounts settlement</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className="btn btn-outline" 
            onClick={handleExportCSV} 
            disabled={exporting}
            title="Export filtered bills to CSV (Excel compatible)"
          >
            <Download size={16} />
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
          {['ADMIN', 'HR'].includes(user?.role) && (
            <Link to="/bills/register" className="btn btn-primary">
              <PlusCircle size={16} />
              Register New Bill
            </Link>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          <span>{error}</span>
          <button style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setError('')}>✕</button>
        </div>
      )}

      <div className="card">
        {/* Search & Comprehensive Filters */}
        <div className="filter-bar">
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', flex: 1, minWidth: '260px' }}>
            <div className="search-bar" style={{ flex: 1 }}>
              <Search size={16} />
              <input
                type="text"
                placeholder="Search by Bill ID, Original Bill No, Case No..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-secondary">Search</button>
          </form>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              className="form-control"
              style={{ width: '150px', padding: '6px 10px' }}
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            >
              <option value="">All Statuses</option>
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
              style={{ width: '140px', padding: '6px 10px' }}
              value={stage}
              onChange={(e) => { setStage(e.target.value); setPage(1); }}
            >
              <option value="">All Stages</option>
              <option value="HR">HR Stage</option>
              <option value="LEGAL">Legal Stage</option>
              <option value="GM">GM Stage</option>
              <option value="ACCOUNTS">Accounts Stage</option>
              <option value="COMPLETED">Completed</option>
              <option value="REJECTED">Rejected</option>
            </select>

            <input
              type="date"
              className="form-control"
              style={{ width: '135px', padding: '6px 8px' }}
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              title="Filter from submission date"
            />

            <input
              type="date"
              className="form-control"
              style={{ width: '135px', padding: '6px 8px' }}
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              title="Filter up to submission date"
            />

            {(search || status || stage || startDate || endDate) && (
              <button className="btn btn-sm btn-outline" onClick={clearFilters}>
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Bills Table */}
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Bill ID</th>
                <th>Advocate</th>
                <th>Case No</th>
                <th>Submission</th>
                <th>Claimed</th>
                <th>Approved</th>
                <th>Paid</th>
                <th>Outstanding</th>
                <th>Stage</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="11" style={{ textAlign: 'center', padding: '30px' }}>
                    <div className="spinner" style={{ margin: '0 auto' }}></div>
                  </td>
                </tr>
              ) : bills.length > 0 ? (
                bills.map((bill) => {
                  const outstanding = bill.approvedAmount ? (bill.approvedAmount - (bill.totalPaid || 0)) : 0;
                  return (
                    <tr key={bill._id}>
                      <td style={{ fontWeight: 600, fontFamily: "'Consolas', monospace", whiteSpace: 'nowrap' }}>
                        <Link to={`/bills/${bill._id}`} style={{ color: '#2563eb', textDecoration: 'none' }}>
                          {bill.billId}
                        </Link>
                      </td>
                      <td style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>{bill.advocate?.name || '—'}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{bill.courtCaseNumber}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{formatDate(bill.submissionDate)}</td>
                      <td className="amount" style={{ whiteSpace: 'nowrap' }}>{formatAmount(bill.claimedAmount)}</td>
                      <td className="amount amount-approved" style={{ whiteSpace: 'nowrap' }}>{formatAmount(bill.approvedAmount)}</td>
                      <td className="amount amount-paid" style={{ whiteSpace: 'nowrap' }}>{formatAmount(bill.totalPaid)}</td>
                      <td className="amount amount-outstanding" style={{ whiteSpace: 'nowrap' }}>
                        {bill.approvedAmount ? formatAmount(outstanding) : '—'}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span className="badge badge-draft">{bill.currentStage}</span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <StatusBadge status={bill.status} />
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <Link to={`/bills/${bill._id}`} className="btn btn-sm btn-secondary">
                          <ExternalLink size={12} />
                          Details
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="11" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    No bills found matching your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="pagination">
            <span className="pagination-info">
              Showing page {page} of {pages} ({total} total records)
            </span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                className="page-btn"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </button>
              {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={`page-btn ${p === page ? 'active' : ''}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                className="page-btn"
                disabled={page >= pages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
