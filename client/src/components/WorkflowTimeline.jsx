import React from 'react';
import { Check, X, RotateCcw } from 'lucide-react';
import { formatDateTime } from '../utils/helpers';

export default function WorkflowTimeline({ bill }) {
  if (!bill) return null;

  // Stages:
  // 1. HR Registration
  // 2. Legal Verification
  // 3. GM Approval
  // 4. Accounts Payment

  const isRejected = bill.status === 'REJECTED';
  const isReturned = bill.status === 'RETURNED_TO_HR';

  // Step 1: HR
  const hrDone = ['HR_SUBMITTED', 'LEGAL_VERIFIED', 'APPROVED', 'PARTIALLY_PAID', 'PAID', 'RETURNED_TO_HR'].includes(bill.status) || (isRejected && bill.currentStage !== 'HR');
  const hrDate = bill.submittedToLegalAt || bill.createdAt;

  // Step 2: Legal
  const legalDone = ['LEGAL_VERIFIED', 'APPROVED', 'PARTIALLY_PAID', 'PAID'].includes(bill.status) || (isRejected && bill.currentStage === 'GM');
  const legalActive = bill.status === 'HR_SUBMITTED';
  const legalRejected = isRejected && bill.rejectionReason && !bill.approvedAmount;
  const legalDate = bill.legalVerifiedAt;

  // Step 3: GM
  const gmDone = ['APPROVED', 'PARTIALLY_PAID', 'PAID'].includes(bill.status);
  const gmActive = bill.status === 'LEGAL_VERIFIED';
  const gmRejected = isRejected && bill.currentStage === 'REJECTED' && bill.legalVerifiedAt;
  const gmDate = bill.gmApprovedAt;

  // Step 4: Accounts
  const accountsDone = bill.status === 'PAID';
  const accountsPartial = bill.status === 'PARTIALLY_PAID';
  const accountsActive = bill.status === 'APPROVED';

  return (
    <div style={{ margin: '20px 0' }}>
      <div className="workflow-timeline">
        {/* Step 1: HR Registration */}
        <div className="workflow-step">
          <div className={`workflow-step-circle ${hrDone ? 'done' : 'active'}`}>
            {hrDone ? <Check size={16} /> : '1'}
          </div>
          <div className={`workflow-step-label ${hrDone ? 'done' : 'active'}`}>
            HR Registered
          </div>
          <span style={{ fontSize: '10px', color: '#94a3b8' }}>
            {hrDate ? formatDateTime(hrDate) : ''}
          </span>
          {bill.createdBy && (
            <span style={{ fontSize: '10px', color: '#64748b' }}>
              By: {bill.createdBy?.name || 'HR'}
            </span>
          )}
        </div>

        <div className={`workflow-connector ${hrDone ? (legalDone || legalActive ? 'done' : 'active') : ''}`} />

        {/* Step 2: Legal Verification */}
        <div className="workflow-step">
          <div className={`workflow-step-circle ${
            legalRejected ? 'rejected' : isReturned ? 'rejected' : legalDone ? 'done' : legalActive ? 'active' : 'pending'
          }`}>
            {legalRejected ? <X size={16} /> : isReturned ? <RotateCcw size={16} /> : legalDone ? <Check size={16} /> : '2'}
          </div>
          <div className={`workflow-step-label ${
            legalRejected ? 'text-danger' : isReturned ? 'text-warning' : legalDone ? 'done' : legalActive ? 'active' : ''
          }`}>
            {isReturned ? 'Returned to HR' : legalRejected ? 'Legal Rejected' : 'Legal Verified'}
          </div>
          <span style={{ fontSize: '10px', color: '#94a3b8' }}>
            {legalDate ? formatDateTime(legalDate) : ''}
          </span>
          {bill.legalVerifiedBy && (
            <span style={{ fontSize: '10px', color: '#64748b' }}>
              By: {bill.legalVerifiedBy?.name || 'Legal'}
            </span>
          )}
        </div>

        <div className={`workflow-connector ${legalDone ? (gmDone || gmActive ? 'done' : 'active') : ''}`} />

        {/* Step 3: GM Approval */}
        <div className="workflow-step">
          <div className={`workflow-step-circle ${
            gmRejected ? 'rejected' : gmDone ? 'done' : gmActive ? 'active' : 'pending'
          }`}>
            {gmRejected ? <X size={16} /> : gmDone ? <Check size={16} /> : '3'}
          </div>
          <div className={`workflow-step-label ${
            gmRejected ? 'text-danger' : gmDone ? 'done' : gmActive ? 'active' : ''
          }`}>
            {gmRejected ? 'GM Rejected' : 'GM Approved'}
          </div>
          <span style={{ fontSize: '10px', color: '#94a3b8' }}>
            {gmDate ? formatDateTime(gmDate) : ''}
          </span>
          {bill.gmApprovedBy && (
            <span style={{ fontSize: '10px', color: '#64748b' }}>
              By: {bill.gmApprovedBy?.name || 'GM'}
            </span>
          )}
        </div>

        <div className={`workflow-connector ${gmDone ? (accountsDone ? 'done' : accountsPartial || accountsActive ? 'active' : '') : ''}`} />

        {/* Step 4: Accounts Payment */}
        <div className="workflow-step">
          <div className={`workflow-step-circle ${
            accountsDone ? 'done' : accountsPartial || accountsActive ? 'active' : 'pending'
          }`}>
            {accountsDone ? <Check size={16} /> : '4'}
          </div>
          <div className={`workflow-step-label ${
            accountsDone ? 'done' : accountsPartial ? 'active' : accountsActive ? 'active' : ''
          }`}>
            {accountsDone ? 'Paid in Full' : accountsPartial ? 'Partially Paid' : 'Payment Pending'}
          </div>
          <span style={{ fontSize: '10px', color: '#94a3b8' }}>
            {bill.totalPaid ? `Paid: ₹${bill.totalPaid.toLocaleString('en-IN')}` : ''}
          </span>
        </div>
      </div>
    </div>
  );
}
