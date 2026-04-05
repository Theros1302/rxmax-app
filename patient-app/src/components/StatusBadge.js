import React from 'react';

const StatusBadge = ({ status }) => {
  const statusMap = {
    pending: { label: 'Pending', className: 'badge-pending' },
    verified: { label: 'Verified', className: 'badge-verified' },
    processing: { label: 'Processing', className: 'badge-processing' },
    ready: { label: 'Ready', className: 'badge-ready' },
    delivered: { label: 'Delivered', className: 'badge-delivered' },
    cancelled: { label: 'Cancelled', className: 'badge-cancelled' }
  };

  const config = statusMap[status] || { label: status, className: 'badge-pending' };

  return (
    <div className={`badge ${config.className}`}>
      {config.label}
    </div>
  );
};

export default StatusBadge;
