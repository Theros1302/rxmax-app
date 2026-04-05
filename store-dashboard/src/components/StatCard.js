import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

function StatCard({ icon: Icon, label, value, change, changeType }) {
  const getIconColor = () => {
    if (!changeType) return 'primary';
    return changeType === 'positive' ? 'success' : 'danger';
  };

  const formatChange = () => {
    if (change === null || change === undefined) return '';
    const symbol = changeType === 'positive' ? '+' : '';
    return `${symbol}${change}%`;
  };

  return (
    <div className="stat-card">
      <div className={`stat-icon ${getIconColor()}`}>
        <Icon size={24} />
      </div>
      <div className="stat-content">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        {change !== null && change !== undefined && (
          <div className={`stat-change ${changeType}`}>
            {changeType === 'positive' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            <span>{formatChange()} vs last month</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default StatCard;
