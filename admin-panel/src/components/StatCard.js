import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

function StatCard({ icon: Icon, label, value, change, unit = '' }) {
  const isPositive = change >= 0;

  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <div className="stat-card-icon">
          <Icon size={22} />
        </div>
        {change !== undefined && (
          <div className={`stat-card-change ${isPositive ? 'positive' : 'negative'}`}>
            {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value">
        {typeof value === 'number' && unit ? (unit + value.toLocaleString('en-IN')) : value.toLocaleString('en-IN')}
      </div>
    </div>
  );
}

export default StatCard;
