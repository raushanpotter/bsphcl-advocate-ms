import React from 'react';

export default function StatusBadge({ status }) {
  const getBadgeConfig = (status) => {
    switch (status) {
      case 'DRAFT':
        return { label: 'Draft', className: 'badge-draft' };
      case 'HR_SUBMITTED':
        return { label: 'Pending Legal', className: 'badge-hr_submitted' };
      case 'LEGAL_VERIFIED':
        return { label: 'Legal Verified', className: 'badge-legal_verified' };
      case 'RETURNED_TO_HR':
        return { label: 'Returned to HR', className: 'badge-returned_to_hr' };
      case 'APPROVED':
        return { label: 'GM Approved', className: 'badge-approved' };
      case 'REJECTED':
        return { label: 'Rejected', className: 'badge-rejected' };
      case 'PARTIALLY_PAID':
        return { label: 'Partially Paid', className: 'badge-partially_paid' };
      case 'PAID':
        return { label: 'Fully Paid', className: 'badge-paid' };
      default:
        return { label: status || 'Unknown', className: 'badge-draft' };
    }
  };

  const { label, className } = getBadgeConfig(status);

  return (
    <span className={`badge ${className}`}>
      {label}
    </span>
  );
}
