import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeft, Upload, FileText, Save, Send, AlertCircle } from 'lucide-react';

export default function RegisterBill() {
  const navigate = useNavigate();
  const [advocates, setAdvocates] = useState([]);
  const [loadingAdvocates, setLoadingAdvocates] = useState(true);

  const [formData, setFormData] = useState({
    advocate: '',
    originalBillNumber: '',
    billDate: '',
    submissionDate: new Date().toISOString().split('T')[0],
    claimedAmount: '',
    courtCaseNumber: '',
    courtName: 'Patna High Court',
    caseDescription: '',
    department: 'BSPHCL Legal Department',
    remarks: ''
  });

  const [billFile, setBillFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/advocates?isActive=true&limit=100')
      .then(res => setAdvocates(res.data.data))
      .catch(err => setError('Failed to load active advocates list'))
      .finally(() => setLoadingAdvocates(false));
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setFileError('Only PDF documents are allowed.');
        setBillFile(null);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setFileError('File size must not exceed 10 MB.');
        setBillFile(null);
        return;
      }
      setFileError('');
      setBillFile(file);
    }
  };

  const handleSubmit = async (submitDirectlyToLegal) => {
    if (!formData.advocate) {
      setError('Please select an advocate.');
      return;
    }
    if (!formData.originalBillNumber.trim()) {
      setError("Please provide the advocate's original bill number.");
      return;
    }
    if (!formData.billDate || !formData.submissionDate) {
      setError('Please select both the Bill Date and Submission Date.');
      return;
    }
    if (!formData.claimedAmount || Number(formData.claimedAmount) <= 0) {
      setError('Please enter a valid claimed amount.');
      return;
    }
    if (!formData.courtCaseNumber.trim() || !formData.courtName.trim()) {
      setError('Court Case Number and Court Name are required.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const data = new FormData();
      Object.keys(formData).forEach(key => {
        data.append(key, formData[key]);
      });
      if (billFile) {
        data.append('billDocument', billFile);
      }

      // 1. Create bill
      const res = await api.post('/bills', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const newBill = res.data.data;

      // 2. If submitting directly to Legal, trigger submission endpoint
      if (submitDirectlyToLegal) {
        await api.post(`/hr/bills/${newBill._id}/submit`);
      }

      navigate(`/bills/${newBill._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register bill. Please check inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <Link to="/bills" className="btn btn-sm btn-outline mb-4" style={{ display: 'inline-flex' }}>
            <ArrowLeft size={14} /> Back to Bills
          </Link>
          <h1 className="page-title">Register Physical Advocate Bill</h1>
          <p className="page-subtitle">Stage 1: HR Department bill intake, physical invoice data capture & document scanning</p>
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
          <form onSubmit={(e) => e.preventDefault()}>
            {/* Advocate Selection */}
            <div className="form-group">
              <label className="form-label">
                Advocate <span className="required">*</span>
              </label>
              {loadingAdvocates ? (
                <div className="text-muted">Loading advocate roster...</div>
              ) : (
                <select
                  className="form-control"
                  value={formData.advocate}
                  onChange={(e) => setFormData({ ...formData, advocate: e.target.value })}
                  required
                >
                  <option value="">-- Select Empanelled Advocate --</option>
                  {advocates.map((adv) => (
                    <option key={adv._id} value={adv._id}>
                      {adv.name} ({adv.enrollmentNumber}) - {adv.advocateId}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Bill Details */}
            <div className="form-row-3">
              <div className="form-group">
                <label className="form-label">
                  Advocate's Original Bill No <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. ADV/INV/2026/45"
                  value={formData.originalBillNumber}
                  onChange={(e) => setFormData({ ...formData, originalBillNumber: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Bill Date <span className="required">*</span>
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.billDate}
                  onChange={(e) => setFormData({ ...formData, billDate: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Physical Submission Date <span className="required">*</span>
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.submissionDate}
                  onChange={(e) => setFormData({ ...formData, submissionDate: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Claimed Amount and Concerned Department */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  Claimed Amount (INR ₹) <span className="required">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  className="form-control"
                  placeholder="e.g. 50000"
                  value={formData.claimedAmount}
                  onChange={(e) => setFormData({ ...formData, claimedAmount: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Department Concerned <span className="required">*</span>
                </label>
                <select
                  className="form-control"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  required
                >
                  <option value="BSPHCL Holding Legal Cell">BSPHCL Holding Legal Cell</option>
                  <option value="SBPDCL (South Bihar Power Distribution)">SBPDCL (South Bihar Power Distribution)</option>
                  <option value="NBPDCL (North Bihar Power Distribution)">NBPDCL (North Bihar Power Distribution)</option>
                  <option value="BSPTCL (Transmission Company)">BSPTCL (Transmission Company)</option>
                  <option value="BSPGCL (Generation Company)">BSPGCL (Generation Company)</option>
                  <option value="Human Resources & Establishment">Human Resources & Establishment</option>
                </select>
              </div>
            </div>

            {/* Court Case Details */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  Court Case / Writ Petition No <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. CWJC No. 10245 of 2023"
                  value={formData.courtCaseNumber}
                  onChange={(e) => setFormData({ ...formData, courtCaseNumber: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Court / Tribunal Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. High Court of Judicature at Patna"
                  value={formData.courtName}
                  onChange={(e) => setFormData({ ...formData, courtName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Case Subject / Brief Description</label>
              <textarea
                className="form-control"
                placeholder="Brief nature of proceedings (e.g., Tariff dispute, land compensation, service writ, etc.)"
                value={formData.caseDescription}
                onChange={(e) => setFormData({ ...formData, caseDescription: e.target.value })}
              />
            </div>

            {/* Document Upload */}
            <div className="form-group">
              <label className="form-label">
                Upload Scanned Bill Document (PDF Only, Max 10MB)
              </label>
              <input
                type="file"
                accept="application/pdf"
                className="form-control"
                onChange={handleFileChange}
              />
              {fileError && <div className="form-error">{fileError}</div>}
              {billFile && (
                <div style={{ marginTop: '6px', fontSize: '13px', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={14} /> Selected: {billFile.name} ({(billFile.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Intake Remarks (Optional)</label>
              <input
                type="text"
                className="form-control"
                placeholder="Any special remarks or receipt reference"
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              <Link to="/bills" className="btn btn-secondary">
                Cancel
              </Link>
              <button
                type="button"
                className="btn btn-outline"
                disabled={submitting}
                onClick={() => handleSubmit(false)}
              >
                <Save size={16} />
                {submitting ? 'Saving...' : 'Save as Draft'}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={submitting}
                onClick={() => handleSubmit(true)}
              >
                <Send size={16} />
                {submitting ? 'Submitting...' : 'Register & Forward to Legal'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
