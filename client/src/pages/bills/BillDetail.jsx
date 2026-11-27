import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api, { UPLOADS_BASE_URL } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatAmount, formatDate, formatDateTime } from '../../utils/helpers';
import StatusBadge from '../../components/StatusBadge';
import WorkflowTimeline from '../../components/WorkflowTimeline';
import Modal from '../../components/Modal';
import { 
  ArrowLeft, FileText, CheckSquare, RotateCcw, 
  XCircle, ShieldCheck, CreditCard, Send, Edit, 
  AlertTriangle, CheckCircle, ExternalLink, Download, 
  AlertCircle, History, Landmark, IndianRupee, Trash2 
} from 'lucide-react';

export default function BillDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [bill, setBill] = useState(null);
  const [payments, setPayments] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Modals state
  const [isLegalVerifyOpen, setIsLegalVerifyOpen] = useState(false);
  const [legalRemarks, setLegalRemarks] = useState('');

  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [returnRemarks, setReturnRemarks] = useState('');

  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectRole, setRejectRole] = useState(''); // 'LEGAL' or 'GM'

  const [isGMApproveOpen, setIsGMApproveOpen] = useState(false);
  const [gmFormData, setGmFormData] = useState({
    approvedAmount: '',
    sanctionLetterNumber: '',
    sanctionLetterDate: new Date().toISOString().split('T')[0],
    remarks: ''
  });
  const [sanctionFile, setSanctionFile] = useState(null);

  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentFormData, setPaymentFormData] = useState({
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMode: 'NEFT',
    transactionReference: '',
    remarks: ''
  });

  const [isResubmitOpen, setIsResubmitOpen] = useState(false);
  const [resubmitRemarks, setResubmitRemarks] = useState('');
  const [resubmitFile, setResubmitFile] = useState(null);
  const [advocatesList, setAdvocatesList] = useState([]);
  const [resubmitFormData, setResubmitFormData] = useState({
    advocate: '',
    originalBillNumber: '',
    billDate: '',
    submissionDate: '',
    claimedAmount: '',
    courtCaseNumber: '',
    courtName: '',
    department: '',
    caseDescription: '',
    remarks: ''
  });

  const openResubmitModal = () => {
    if (bill) {
      setResubmitFormData({
        advocate: bill.advocate?._id || bill.advocate || '',
        originalBillNumber: bill.originalBillNumber || '',
        billDate: bill.billDate ? new Date(bill.billDate).toISOString().split('T')[0] : '',
        submissionDate: bill.submissionDate ? new Date(bill.submissionDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        claimedAmount: bill.claimedAmount || '',
        courtCaseNumber: bill.courtCaseNumber || '',
        courtName: bill.courtName || 'Patna High Court',
        department: bill.department || 'BSPHCL Legal Department',
        caseDescription: bill.caseDescription || '',
        remarks: bill.remarks || ''
      });
      setResubmitRemarks('');
      setResubmitFile(null);
      if (advocatesList.length === 0) {
        api.get('/advocates?isActive=true&limit=100')
          .then(res => setAdvocatesList(res.data.data || []))
          .catch(() => {});
      }
    }
    setIsResubmitOpen(true);
  };

  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchBill();
  }, [id]);

  const fetchBill = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/bills/${id}`);
      setBill(res.data.data.bill);
      setPayments(res.data.data.payments || []);
      setHistory(res.data.data.history || []);
      
      // Auto-set GM approve amount to claimed amount by default
      if (res.data.data.bill) {
        setGmFormData(prev => ({
          ...prev,
          approvedAmount: res.data.data.bill.claimedAmount || ''
        }));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load bill details');
    } finally {
      setLoading(false);
    }
  };

  // Legal Actions
  const handleLegalVerify = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await api.post(`/legal/bills/${id}/verify`, { legalRemarks });
      setActionSuccess('Bill verified and forwarded to General Management!');
      setIsLegalVerifyOpen(false);
      setLegalRemarks('');
      fetchBill();
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLegalReturn = async (e) => {
    e.preventDefault();
    if (!returnRemarks.trim()) {
      setError('Return remarks are mandatory to inform HR of corrections required.');
      return;
    }
    try {
      setActionLoading(true);
      await api.post(`/legal/bills/${id}/return`, { returnRemarks });
      setActionSuccess('Bill returned to HR with mandatory remarks.');
      setIsReturnOpen(false);
      setReturnRemarks('');
      fetchBill();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to return bill');
    } finally {
      setActionLoading(false);
    }
  };

  // Rejection Handler (for Legal and GM)
  const handleReject = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      setError('Rejection reason is mandatory.');
      return;
    }
    try {
      setActionLoading(true);
      if (rejectRole === 'LEGAL') {
        await api.post(`/legal/bills/${id}/reject`, { rejectionReason });
      } else {
        await api.post(`/gm/bills/${id}/reject`, { rejectionReason });
      }
      setActionSuccess('Bill has been rejected.');
      setIsRejectOpen(false);
      setRejectionReason('');
      fetchBill();
    } catch (err) {
      setError(err.response?.data?.message || 'Rejection failed');
    } finally {
      setActionLoading(false);
    }
  };

  // GM Approve Handler
  const handleGMApprove = async (e) => {
    e.preventDefault();
    if (!gmFormData.approvedAmount || Number(gmFormData.approvedAmount) <= 0) {
      setError('Approved amount is mandatory and must be a positive number.');
      return;
    }
    if (!gmFormData.sanctionLetterNumber.trim()) {
      setError('Sanction letter number is mandatory.');
      return;
    }
    if (!gmFormData.sanctionLetterDate) {
      setError('Sanction letter date is mandatory.');
      return;
    }

    try {
      setActionLoading(true);
      const formData = new FormData();
      formData.append('approvedAmount', gmFormData.approvedAmount);
      formData.append('sanctionLetterNumber', gmFormData.sanctionLetterNumber);
      formData.append('sanctionLetterDate', gmFormData.sanctionLetterDate);
      if (gmFormData.remarks) formData.append('remarks', gmFormData.remarks);
      if (sanctionFile) formData.append('sanctionLetterDocument', sanctionFile);

      await api.post(`/gm/bills/${id}/approve`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setActionSuccess('Bill approved and forwarded to Accounts for payment!');
      setIsGMApproveOpen(false);
      fetchBill();
    } catch (err) {
      setError(err.response?.data?.message || 'Approval failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Accounts Payment Handler
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    const outstanding = (bill.approvedAmount || 0) - (bill.totalPaid || 0);
    const amountNum = Number(paymentFormData.amount);

    if (!amountNum || amountNum <= 0) {
      setError('Please enter a valid positive payment amount.');
      return;
    }
    if (amountNum > outstanding + 0.01) {
      setError(`Payment cannot exceed outstanding approved amount of ₹${outstanding.toLocaleString('en-IN')}.`);
      return;
    }
    if (!paymentFormData.paymentDate) {
      setError('Payment date is required.');
      return;
    }

    try {
      setActionLoading(true);
      await api.post(`/accounts/bills/${id}/payments`, paymentFormData);
      setActionSuccess('Payment recorded successfully!');
      setIsPaymentOpen(false);
      setPaymentFormData({
        amount: '',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMode: 'NEFT',
        transactionReference: '',
        remarks: ''
      });
      fetchBill();
    } catch (err) {
      setError(err.response?.data?.message || 'Payment recording failed');
    } finally {
      setActionLoading(false);
    }
  };

  // HR Resubmit Handler with full refill & correction support
  const handleHRResubmit = async (e) => {
    e.preventDefault();
    if (!resubmitFormData.claimedAmount || Number(resubmitFormData.claimedAmount) <= 0) {
      setError('Claimed amount is mandatory and must be greater than zero.');
      return;
    }
    if (!resubmitFormData.originalBillNumber.trim()) {
      setError('Original bill number is mandatory.');
      return;
    }
    if (!resubmitFormData.courtCaseNumber.trim()) {
      setError('Court case number is mandatory.');
      return;
    }
    if (!resubmitRemarks.trim()) {
      setError('Resubmission explanation remarks for Legal Department are mandatory.');
      return;
    }

    try {
      setActionLoading(true);
      setError('');

      const formData = new FormData();
      Object.keys(resubmitFormData).forEach(key => {
        if (resubmitFormData[key] !== undefined && resubmitFormData[key] !== null) {
          formData.append(key, resubmitFormData[key]);
        }
      });
      formData.append('resubmitRemarks', resubmitRemarks.trim());
      if (resubmitFile) {
        formData.append('billDocument', resubmitFile);
      }

      await api.post(`/hr/bills/${id}/resubmit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setActionSuccess('Bill corrections saved and successfully resubmitted to Legal Department!');
      setIsResubmitOpen(false);
      setResubmitRemarks('');
      setResubmitFile(null);
      fetchBill();
    } catch (err) {
      setError(err.response?.data?.message || 'Resubmission failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Account Officer: Remove Bill Handler
  const handleRemoveBill = async () => {
    const isConfirmed = window.confirm(
      `⚠️ VERIFICATION REQUIRED (Account Officer)\n\nAre you sure you want to permanently remove bill "${bill.billId}"?\n\n• Advocate: ${bill.advocate?.name || 'N/A'}\n• Claimed: ₹${bill.claimedAmount || 0}\n• Sanctioned: ₹${bill.approvedAmount || 0}\n\nThis will permanently delete this bill and all associated records from the system. This action cannot be undone.`
    );
    if (!isConfirmed) return;

    try {
      setActionLoading(true);
      await api.delete(`/bills/${id}`);
      alert(`Bill ${bill.billId} has been successfully removed.`);
      navigate('/accounts/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove bill.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error && !bill) {
    return (
      <div className="alert alert-danger">
        {error}
      </div>
    );
  }

  const outstanding = (bill?.approvedAmount || 0) - (bill?.totalPaid || 0);

  // Role permissions checks
  const canHRSubmit = (user?.role === 'HR' || user?.role === 'ADMIN') && bill?.status === 'DRAFT';
  const canHRResubmit = (user?.role === 'HR' || user?.role === 'ADMIN') && bill?.status === 'RETURNED_TO_HR';
  const canLegalAct = (user?.role === 'LEGAL' || user?.role === 'ADMIN') && bill?.status === 'HR_SUBMITTED' && bill?.currentStage === 'LEGAL';
  const canGMAct = (user?.role === 'GM' || user?.role === 'ADMIN') && bill?.status === 'LEGAL_VERIFIED' && bill?.currentStage === 'GM';
  const canAccountsAct = (user?.role === 'ACCOUNTS' || user?.role === 'ADMIN') && ['APPROVED', 'PARTIALLY_PAID'].includes(bill?.status) && bill?.currentStage === 'ACCOUNTS';

  return (
    <div>
      <div className="page-header">
        <div>
          <Link to="/bills" className="btn btn-sm btn-outline mb-4" style={{ display: 'inline-flex' }}>
            <ArrowLeft size={14} /> Back to Bills Registry
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 className="page-title">{bill.billId}</h1>
            <StatusBadge status={bill.status} />
            <span className="badge badge-draft">Stage: {bill.currentStage}</span>
          </div>
          <p className="page-subtitle">Original Bill No: {bill.originalBillNumber} | Case: {bill.courtCaseNumber}</p>
        </div>

        {/* Action Buttons for current user & bill status */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {canHRSubmit && (
            <button className="btn btn-primary" onClick={() => api.post(`/hr/bills/${id}/submit`).then(() => { setActionSuccess('Submitted to Legal!'); fetchBill(); })}>
              <Send size={16} /> Submit to Legal
            </button>
          )}

          {canHRResubmit && (
            <button className="btn btn-warning" onClick={openResubmitModal} title="Refill corrections and resubmit to Legal Department">
              <RotateCcw size={16} /> Resubmit to Legal
            </button>
          )}

          {canLegalAct && (
            <>
              <button className="btn btn-success" onClick={() => setIsLegalVerifyOpen(true)}>
                <CheckSquare size={16} /> Verify & Forward to GM
              </button>
              <button className="btn btn-warning" onClick={() => setIsReturnOpen(true)}>
                <RotateCcw size={16} /> Return to HR
              </button>
              <button className="btn btn-danger" onClick={() => { setRejectRole('LEGAL'); setIsRejectOpen(true); }}>
                <XCircle size={16} /> Reject Bill
              </button>
            </>
          )}

          {canGMAct && (
            <>
              <button className="btn btn-success" onClick={() => setIsGMApproveOpen(true)}>
                <ShieldCheck size={16} /> Sanction & Approve
              </button>
              <button className="btn btn-danger" onClick={() => { setRejectRole('GM'); setIsRejectOpen(true); }}>
                <XCircle size={16} /> Reject Bill
              </button>
            </>
          )}

          {canAccountsAct && (
            <button className="btn btn-primary" onClick={() => setIsPaymentOpen(true)}>
              <CreditCard size={16} /> Record Payment
            </button>
          )}

          {user?.role === 'ACCOUNTS' && (
            <button
              className="btn btn-outline"
              style={{ color: '#dc2626', borderColor: '#fca5a5' }}
              onClick={handleRemoveBill}
              title="Remove Bill (Account Officer exclusive)"
            >
              <Trash2 size={16} /> Remove Bill
            </button>
          )}
        </div>
      </div>

      {actionSuccess && (
        <div className="alert alert-success">
          <CheckCircle size={16} />
          <span>{actionSuccess}</span>
          <button style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setActionSuccess('')}>✕</button>
        </div>
      )}

      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setError('')}>✕</button>
        </div>
      )}

      {/* Critical Status Alerts */}
      {bill.status === 'RETURNED_TO_HR' && (
        <div className="alert alert-warning">
          <AlertTriangle size={20} />
          <div>
            <strong>Returned to HR by Legal Department:</strong>
            <p style={{ marginTop: '4px' }}>"{bill.returnRemarks}"</p>
          </div>
        </div>
      )}

      {bill.status === 'REJECTED' && (
        <div className="alert alert-danger">
          <XCircle size={20} />
          <div>
            <strong>Bill Rejected:</strong>
            <p style={{ marginTop: '4px' }}>"{bill.rejectionReason}"</p>
          </div>
        </div>
      )}

      {/* Workflow Progress Bar */}
      <div className="card mb-6">
        <div className="card-header">
          <h2 className="card-title">Workflow Progression Status</h2>
        </div>
        <div className="card-body">
          <WorkflowTimeline bill={bill} />
        </div>
      </div>

      {/* Financial Comparison Summary Cards */}
      <div className="stats-grid mb-6">
        <div className="stat-card">
          <div className="stat-icon blue">
            <IndianRupee size={20} />
          </div>
          <div className="stat-info">
            <div className="stat-value" title={formatAmount(bill.claimedAmount)}>{formatAmount(bill.claimedAmount)}</div>
            <div className="stat-label">Claimed by Advocate</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <IndianRupee size={20} />
          </div>
          <div className="stat-info">
            <div className="stat-value" title={bill.approvedAmount ? formatAmount(bill.approvedAmount) : 'Pending Sanction'}>
              {bill.approvedAmount ? formatAmount(bill.approvedAmount) : 'Pending Sanction'}
            </div>
            <div className="stat-label">Sanctioned by GM</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon teal">
            <IndianRupee size={20} />
          </div>
          <div className="stat-info">
            <div className="stat-value" title={formatAmount(bill.totalPaid)}>{formatAmount(bill.totalPaid)}</div>
            <div className="stat-label">Total Amount Disbursed</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon red">
            <IndianRupee size={20} />
          </div>
          <div className="stat-info">
            <div className="stat-value" title={bill.approvedAmount ? formatAmount(outstanding) : '—'}>
              {bill.approvedAmount ? formatAmount(outstanding) : '—'}
            </div>
            <div className="stat-label">Outstanding Liability</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Bill Core Information */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Bill & Case Information</h2>
          </div>
          <div className="card-body">
            <div className="info-grid">
              <div className="info-item">
                <label>Original Invoice Number</label>
                <p>{bill.originalBillNumber}</p>
              </div>
              <div className="info-item">
                <label>Bill Invoice Date</label>
                <p>{formatDate(bill.billDate)}</p>
              </div>
              <div className="info-item">
                <label>Physical Intake Date</label>
                <p>{formatDate(bill.submissionDate)}</p>
              </div>
              <div className="info-item">
                <label>Concerned Entity / Company</label>
                <p>{bill.department}</p>
              </div>
              <div className="info-item">
                <label>Court Case Number</label>
                <p>{bill.courtCaseNumber}</p>
              </div>
              <div className="info-item">
                <label>Court / Tribunal</label>
                <p>{bill.courtName}</p>
              </div>
            </div>

            <div style={{ marginTop: '16px' }}>
              <label style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 600 }}>
                Case Subject / Description
              </label>
              <p style={{ fontSize: '13.5px', marginTop: '4px', color: '#334155' }}>
                {bill.caseDescription || 'No description provided.'}
              </p>
            </div>

            {bill.remarks && (
              <div style={{ marginTop: '12px' }}>
                <label style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 600 }}>
                  Intake Remarks
                </label>
                <p style={{ fontSize: '13.5px', marginTop: '4px', color: '#334155' }}>
                  {bill.remarks}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Advocate Details */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Advocate Profile</h2>
            {bill.advocate?._id && (
              <Link to={`/advocates/${bill.advocate._id}`} className="btn btn-sm btn-outline">
                <ExternalLink size={12} /> View Full Profile
              </Link>
            )}
          </div>
          <div className="card-body">
            <div className="info-grid">
              <div className="info-item">
                <label>Advocate Name</label>
                <p style={{ fontWeight: 600 }}>{bill.advocate?.name}</p>
              </div>
              <div className="info-item">
                <label>Bar Council Enrollment</label>
                <p style={{ fontFamily: 'monospace' }}>{bill.advocate?.enrollmentNumber}</p>
              </div>
              <div className="info-item">
                <label>Mobile Number</label>
                <p>{bill.advocate?.mobile}</p>
              </div>
              <div className="info-item">
                <label>Email Address</label>
                <p>{bill.advocate?.email || '—'}</p>
              </div>
              <div className="info-item">
                <label>Specialization</label>
                <p>{bill.advocate?.specialization || 'General Practice'}</p>
              </div>
              <div className="info-item">
                <label>Advocate Internal ID</label>
                <p style={{ fontFamily: 'monospace' }}>{bill.advocate?.advocateId}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Verification, Sanction, and Documents */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Verification and Sanction Details */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Scrutiny & Sanction Records</h2>
          </div>
          <div className="card-body">
            {/* Legal Verification Section */}
            <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '14px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#1e40af', textTransform: 'uppercase' }}>
                  1. Legal Verification
                </span>
                {bill.legalVerifiedAt && (
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    {formatDateTime(bill.legalVerifiedAt)}
                  </span>
                )}
              </div>
              <div className="info-item">
                <label>Verification Remarks</label>
                <p>{bill.legalRemarks || 'Pending legal scrutiny.'}</p>
              </div>
              {bill.legalVerifiedBy && (
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  Verified by: <strong>{bill.legalVerifiedBy.name}</strong> ({bill.legalVerifiedBy.role})
                </div>
              )}
            </div>

            {/* GM Sanction Section */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#15803d', textTransform: 'uppercase' }}>
                  2. General Management Sanction
                </span>
                {bill.gmApprovedAt && (
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    {formatDateTime(bill.gmApprovedAt)}
                  </span>
                )}
              </div>
              <div className="info-grid">
                <div className="info-item">
                  <label>Sanction Letter No</label>
                  <p>{bill.sanctionLetterNumber || 'Pending sanction'}</p>
                </div>
                <div className="info-item">
                  <label>Sanction Date</label>
                  <p>{bill.sanctionLetterDate ? formatDate(bill.sanctionLetterDate) : '—'}</p>
                </div>
                <div className="info-item">
                  <label>Final Approved Amount</label>
                  <p className="amount amount-approved">
                    {bill.approvedAmount ? formatAmount(bill.approvedAmount) : '—'}
                  </p>
                </div>
              </div>
              {bill.gmApprovedBy && (
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                  Approved by: <strong>{bill.gmApprovedBy.name}</strong> ({bill.gmApprovedBy.role})
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Uploaded Documents */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Official Attached Documents</h2>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Scanned Bill Document */}
              <div style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FileText size={20} color="#2563eb" />
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 600 }}>Scanned Advocate Invoice</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Uploaded by HR at Intake</div>
                  </div>
                </div>
                {bill.billDocument ? (
                  <a
                    href={`${UPLOADS_BASE_URL}/${bill.billDocument}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-sm btn-secondary"
                  >
                    <Download size={14} /> View PDF
                  </a>
                ) : (
                  <span className="badge badge-draft">Not Uploaded</span>
                )}
              </div>

              {/* Sanction Letter Document */}
              <div style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ShieldCheck size={20} color="#16a34a" />
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 600 }}>GM Sanction Letter</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Executive Approval Order</div>
                  </div>
                </div>
                {bill.sanctionLetterDocument ? (
                  <a
                    href={`${UPLOADS_BASE_URL}/${bill.sanctionLetterDocument}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-sm btn-secondary"
                  >
                    <Download size={14} /> View PDF
                  </a>
                ) : (
                  <span className="badge badge-draft">Not Uploaded</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Offline Payment History Table */}
      <div className="card mb-6">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 className="card-title">Offline Payment Records ({payments.length})</h2>
            {bill.status === 'PAID' && <span className="badge badge-paid">Fully Settled</span>}
            {bill.status === 'PARTIALLY_PAID' && <span className="badge badge-partially_paid">Partially Paid</span>}
          </div>
          {canAccountsAct && (
            <button className="btn btn-sm btn-primary" onClick={() => setIsPaymentOpen(true)}>
              <CreditCard size={14} /> Add Payment Record
            </button>
          )}
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Disbursement Date</th>
                <th>Payment Mode</th>
                <th>Amount Disbursed</th>
                <th>UTR / Cheque / Ref No</th>
                <th>Payment Remarks</th>
                <th>Recorded By</th>
                <th>Recorded Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {payments.length > 0 ? (
                payments.map((p) => (
                  <tr key={p._id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDate(p.paymentDate)}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span className="badge badge-draft" style={{ fontWeight: 600 }}>
                        {p.paymentMode}
                      </span>
                    </td>
                    <td className="amount amount-paid" style={{ whiteSpace: 'nowrap' }}>{formatAmount(p.amount)}</td>
                    <td style={{ fontFamily: "'Consolas', monospace", whiteSpace: 'nowrap' }}>{p.transactionReference || '—'}</td>
                    <td style={{ minWidth: '180px', maxWidth: '340px', whiteSpace: 'normal', wordBreak: 'break-word', fontSize: '13px', lineHeight: '1.4' }}>{p.remarks || '—'}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{p.recordedBy?.name || 'Accounts'}</td>
                    <td style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>{formatDateTime(p.createdAt)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                    {bill.status === 'APPROVED' ? 'No disbursements recorded yet. Accounts can add payments.' : 'Payments will be recorded once approved by General Management.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Workflow Audit Trail History */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Complete Workflow History & Audit Trail</h2>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Action</th>
                <th>Previous Status</th>
                <th>New Status</th>
                <th>Remarks / Reason</th>
                <th>Performed By</th>
                <th>Role</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {history.length > 0 ? (
                history.map((h) => (
                  <tr key={h._id}>
                    <td style={{ fontWeight: 600, color: '#1e3a5f', whiteSpace: 'nowrap' }}>{h.action}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {h.previousStatus ? <StatusBadge status={h.previousStatus} /> : '—'}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <StatusBadge status={h.newStatus} />
                    </td>
                    <td style={{ minWidth: '220px', maxWidth: '380px', whiteSpace: 'normal', wordBreak: 'break-word', fontSize: '13px', lineHeight: '1.4', paddingRight: '16px' }}>
                      {h.remarks || '—'}
                    </td>
                    <td style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>{h.performedBy?.name || 'System'}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span className="badge badge-draft">{h.performedByRole || '—'}</span>
                    </td>
                    <td style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>{formatDateTime(h.createdAt)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                    No history log entries available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Legal Verify */}
      <Modal
        isOpen={isLegalVerifyOpen}
        onClose={() => setIsLegalVerifyOpen(false)}
        title="Legal Department Verification"
      >
        <form onSubmit={handleLegalVerify}>
          <p className="text-muted mb-4">
            Verify that case details, advocate appearance, and fee schedule align with BSPHCL empanelment guidelines.
          </p>

          <div className="form-group">
            <label className="form-label">Legal Verification Remarks</label>
            <textarea
              className="form-control"
              placeholder="e.g. Verified court proceedings and fee claim as per approved BSPHCL schedule. Recommended for sanction."
              value={legalRemarks}
              onChange={(e) => setLegalRemarks(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsLegalVerifyOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-success" disabled={actionLoading}>
              <CheckSquare size={16} />
              {actionLoading ? 'Processing...' : 'Verify & Forward to GM'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Legal Return to HR */}
      <Modal
        isOpen={isReturnOpen}
        onClose={() => setIsReturnOpen(false)}
        title="Return Bill to HR for Correction"
      >
        <form onSubmit={handleLegalReturn}>
          <div className="alert alert-warning mb-4">
            <AlertTriangle size={16} />
            <span>Returning this bill will allow HR to edit the intake details or attach corrected documents.</span>
          </div>

          <div className="form-group">
            <label className="form-label">
              Mandatory Return Remarks <span className="required">*</span>
            </label>
            <textarea
              className="form-control"
              placeholder="Clearly state what needs correction (e.g., Wrong case number, missing vakalatnama, claim exceeding rate card)"
              value={returnRemarks}
              onChange={(e) => setReturnRemarks(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsReturnOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-warning" disabled={actionLoading}>
              <RotateCcw size={16} />
              {actionLoading ? 'Returning...' : 'Confirm Return to HR'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Rejection (Legal or GM) */}
      <Modal
        isOpen={isRejectOpen}
        onClose={() => setIsRejectOpen(false)}
        title={`Reject Advocate Bill (${rejectRole})`}
      >
        <form onSubmit={handleReject}>
          <div className="alert alert-danger mb-4">
            <XCircle size={16} />
            <span>Rejection terminates the bill workflow. A formal, justified reason must be recorded.</span>
          </div>

          <div className="form-group">
            <label className="form-label">
              Mandatory Rejection Reason <span className="required">*</span>
            </label>
            <textarea
              className="form-control"
              placeholder="State the official basis for rejecting this claim..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsRejectOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-danger" disabled={actionLoading}>
              <XCircle size={16} />
              {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: GM Sanction & Approval */}
      <Modal
        isOpen={isGMApproveOpen}
        onClose={() => setIsGMApproveOpen(false)}
        title="General Management Sanction & Approval"
        size="lg"
      >
        <form onSubmit={handleGMApprove}>
          <p className="text-muted mb-4">
            As the designated Competent Management Authority, review the legal verification and determine the sanctioned disbursement amount.
          </p>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Claimed by Advocate</label>
              <input
                type="text"
                className="form-control"
                value={formatAmount(bill.claimedAmount)}
                disabled
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Sanctioned / Approved Amount (INR ₹) <span className="required">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="0.01"
                className="form-control"
                placeholder="Enter sanctioned amount"
                value={gmFormData.approvedAmount}
                onChange={(e) => setGmFormData({ ...gmFormData, approvedAmount: e.target.value })}
                required
              />
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                Note: Can be adjusted or deducted from the original claimed amount.
              </span>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                Sanction Letter Number <span className="required">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. BSPHCL/LAW/SANCTION/2026/892"
                value={gmFormData.sanctionLetterNumber}
                onChange={(e) => setGmFormData({ ...gmFormData, sanctionLetterNumber: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Sanction Letter Date <span className="required">*</span>
              </label>
              <input
                type="date"
                className="form-control"
                value={gmFormData.sanctionLetterDate}
                onChange={(e) => setGmFormData({ ...gmFormData, sanctionLetterDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Upload Sanction Order Document (PDF Only)</label>
            <input
              type="file"
              accept="application/pdf"
              className="form-control"
              onChange={(e) => setSanctionFile(e.target.files[0] || null)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Executive Approval Remarks</label>
            <textarea
              className="form-control"
              placeholder="e.g. Sanction granted as per Board Delegation of Financial Powers."
              value={gmFormData.remarks}
              onChange={(e) => setGmFormData({ ...gmFormData, remarks: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsGMApproveOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-success" disabled={actionLoading}>
              <ShieldCheck size={16} />
              {actionLoading ? 'Sanctioning...' : 'Sanction & Forward to Accounts'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Accounts Record Payment */}
      <Modal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        title="Record Departmental Offline Payment"
      >
        <form onSubmit={handleRecordPayment}>
          <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span className="text-sm text-muted">Sanctioned Amount:</span>
              <strong className="amount amount-approved">{formatAmount(bill.approvedAmount)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span className="text-sm text-muted">Total Paid So Far:</span>
              <strong className="amount amount-paid">{formatAmount(bill.totalPaid)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '4px', borderTop: '1px solid #e2e8f0' }}>
              <span className="text-sm" style={{ fontWeight: 600, color: '#dc2626' }}>Remaining Outstanding:</span>
              <strong className="amount amount-outstanding">{formatAmount(outstanding)}</strong>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                Disbursement Amount (₹) <span className="required">*</span>
              </label>
              <input
                type="number"
                min="0.01"
                max={outstanding}
                step="0.01"
                className="form-control"
                placeholder={`Up to ${outstanding.toFixed(2)}`}
                value={paymentFormData.amount}
                onChange={(e) => setPaymentFormData({ ...paymentFormData, amount: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Payment Mode <span className="required">*</span>
              </label>
              <select
                className="form-control"
                value={paymentFormData.paymentMode}
                onChange={(e) => setPaymentFormData({ ...paymentFormData, paymentMode: e.target.value })}
                required
              >
                <option value="NEFT">NEFT (Electronic Transfer)</option>
                <option value="RTGS">RTGS (High Value Settlement)</option>
                <option value="Cheque">Treasury / Bank Cheque</option>
                <option value="Other">Other Mode</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                Payment Date <span className="required">*</span>
              </label>
              <input
                type="date"
                className="form-control"
                value={paymentFormData.paymentDate}
                onChange={(e) => setPaymentFormData({ ...paymentFormData, paymentDate: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">UTR / Cheque / Transaction Ref</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. UTR0982347102"
                value={paymentFormData.transactionReference}
                onChange={(e) => setPaymentFormData({ ...paymentFormData, transactionReference: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Payment Remarks</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Final installment disbursed to advocate account"
              value={paymentFormData.remarks}
              onChange={(e) => setPaymentFormData({ ...paymentFormData, remarks: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsPaymentOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={actionLoading}>
              <CreditCard size={16} />
              {actionLoading ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: HR Resubmit to Legal with Refill Support */}
      <Modal
        isOpen={isResubmitOpen}
        onClose={() => setIsResubmitOpen(false)}
        title="Refill & Resubmit Corrected Bill to Legal"
        size="lg"
      >
        <form onSubmit={handleHRResubmit}>
          {/* Highlight Legal Return Remarks */}
          <div className="alert alert-warning mb-4" style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '2px', color: '#b45309' }} />
            <div>
              <strong style={{ color: '#92400e' }}>Reason Returned by Legal Department:</strong>
              <p style={{ marginTop: '3px', fontWeight: 600, color: '#78350f' }}>"{bill?.returnRemarks || 'Corrections requested by legal department.'}"</p>
              <span style={{ fontSize: '12px', color: '#a16207' }}>
                All required fields below are pre-filled with existing data. You can refill, modify, and attach corrected documents as required before resubmitting.
              </span>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Empanelled Advocate <span className="required">*</span></label>
              <select
                className="form-control"
                value={resubmitFormData.advocate}
                onChange={(e) => setResubmitFormData({ ...resubmitFormData, advocate: e.target.value })}
                required
              >
                {bill?.advocate && (
                  <option value={bill.advocate._id || bill.advocate}>
                    {bill.advocate.name || 'Current Advocate'} ({bill.advocate.enrollmentNumber || ''})
                  </option>
                )}
                {advocatesList
                  .filter(a => a._id !== (bill?.advocate?._id || bill?.advocate))
                  .map(a => (
                    <option key={a._id} value={a._id}>
                      {a.name} ({a.enrollmentNumber})
                    </option>
                  ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Original Bill Number <span className="required">*</span></label>
              <input
                type="text"
                className="form-control"
                value={resubmitFormData.originalBillNumber}
                onChange={(e) => setResubmitFormData({ ...resubmitFormData, originalBillNumber: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Bill Date <span className="required">*</span></label>
              <input
                type="date"
                className="form-control"
                value={resubmitFormData.billDate}
                onChange={(e) => setResubmitFormData({ ...resubmitFormData, billDate: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Submission Date <span className="required">*</span></label>
              <input
                type="date"
                className="form-control"
                value={resubmitFormData.submissionDate}
                onChange={(e) => setResubmitFormData({ ...resubmitFormData, submissionDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Claimed Amount (₹) <span className="required">*</span></label>
              <input
                type="number"
                min="1"
                step="any"
                className="form-control"
                value={resubmitFormData.claimedAmount}
                onChange={(e) => setResubmitFormData({ ...resubmitFormData, claimedAmount: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Court Case Number <span className="required">*</span></label>
              <input
                type="text"
                className="form-control"
                value={resubmitFormData.courtCaseNumber}
                onChange={(e) => setResubmitFormData({ ...resubmitFormData, courtCaseNumber: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Court / Tribunal Name <span className="required">*</span></label>
              <input
                type="text"
                className="form-control"
                value={resubmitFormData.courtName}
                onChange={(e) => setResubmitFormData({ ...resubmitFormData, courtName: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Department / Unit <span className="required">*</span></label>
              <input
                type="text"
                className="form-control"
                value={resubmitFormData.department}
                onChange={(e) => setResubmitFormData({ ...resubmitFormData, department: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Case Description / Subject Matter</label>
            <textarea
              className="form-control"
              rows={2}
              value={resubmitFormData.caseDescription}
              onChange={(e) => setResubmitFormData({ ...resubmitFormData, caseDescription: e.target.value })}
              placeholder="e.g. Writ petition regarding transmission line right-of-way compensation"
            />
          </div>

          {/* Document Attachment Section */}
          <div className="form-group">
            <label className="form-label">Bill Document Attachment (PDF)</label>
            {bill?.billDocument && (
              <div style={{ marginBottom: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge badge-approved" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <FileText size={12} /> Existing Attachment Available
                </span>
                <a
                  href={`${UPLOADS_BASE_URL}/${bill.billDocument}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#2563eb', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <ExternalLink size={12} /> View Current Document
                </a>
              </div>
            )}
            <input
              type="file"
              accept=".pdf"
              className="form-control"
              onChange={(e) => setResubmitFile(e.target.files[0] || null)}
            />
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              {bill?.billDocument 
                ? 'Select a new PDF only if you wish to replace the existing document with a corrected copy.' 
                : 'Upload the advocate fee bill / court memo in PDF format (max 10MB).'}
            </span>
          </div>

          {/* Resubmission Remarks */}
          <div className="form-group">
            <label className="form-label">
              Resubmission Remarks / Explanation for Legal <span className="required">*</span>
            </label>
            <textarea
              className="form-control"
              rows={2}
              placeholder="e.g. Attached verified court order, corrected claimed fee schedule as requested by Legal Department."
              value={resubmitRemarks}
              onChange={(e) => setResubmitRemarks(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsResubmitOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-warning" disabled={actionLoading}>
              <RotateCcw size={16} />
              {actionLoading ? 'Resubmitting to Legal...' : 'Confirm & Resubmit to Legal'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
