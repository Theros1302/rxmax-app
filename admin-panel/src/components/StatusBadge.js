import React from 'react';

function StatusBadge({ type, text, icon: Icon = null }) {
  const getClassName = () => {
    switch (type) {
      case 'active':
        return 'status-badge status-active';
      case 'inactive':
        return 'status-badge status-inactive';
      case 'pending':
        return 'status-badge status-pending';
      case 'verified':
        return 'status-badge status-verified';
      case 'unverified':
        return 'status-badge status-unverified';
      case 'delivered':
        return 'status-badge status-active';
      case 'processing':
        return 'status-badge status-pending';
      default:
        return 'status-badge';
    }
  };

  return (
    <span className={getClassName()}>
      {Icon && <Icon size={12} />}
      {text}
    </span>
  );
}

export default StatusBadge;
