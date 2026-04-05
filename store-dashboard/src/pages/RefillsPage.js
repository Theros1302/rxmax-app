import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import DataTable from '../components/DataTable';
import StatCard from '../components/StatCard';
import { api } from '../services/api';
import { Send, AlertTriangle, TrendingUp } from 'lucide-react';

function RefillsPage() {
  const [refills, setRefills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoNudgeEnabled, setAutoNudgeEnabled] = useState(true);
  const [conversionRate, setConversionRate] = useState(0);
  const [thisWeekRefills, setThisWeekRefills] = useState(0);
  const [revenueAtRisk, setRevenueAtRisk] = useState(0);

  useEffect(() => {
    loadRefills();
  }, []);

  const loadRefills = async () => {
    try {
      const data = await api.getRefills();
      setRefills(data);

      // Calculate metrics
      const nextWeekDate = new Date();
      nextWeekDate.setDate(nextWeekDate.getDate() + 7);
      const nextWeekStr = nextWeekDate.toISOString().split('T')[0];
      const thisWeek = data.filter(r => r.refillDueDate <= nextWeekStr && r.status === 'pending');
      setThisWeekRefills(thisWeek.length);

      const revenue = data
        .filter(r => r.escalationLevel === 'urgent' || r.daysRemaining <= 0)
        .reduce((sum, r) => sum + r.estimatedValue, 0);
      setRevenueAtRisk(revenue);

      const completed = data.filter(r => r.status === 'completed').length;
      const rate = data.length > 0 ? Math.round((completed / data.length) * 100) : 0;
      setConversionRate(rate);

      setLoading(false);
    } catch (error) {
      console.error('Error loading refills:', error);
      setLoading(false);
    }
  };

  const handleNudge = async (refillId) => {
    await api.sendRefillNudge(refillId);
    setRefills(refills.map(r =>
      r.id === refillId ? { ...r, reminderStatus: 'sent' } : r
    ));
  };

  const handleAutoNudgeToggle = async (enabled) => {
    await api.toggleAutoNudge(enabled);
    setAutoNudgeEnabled(enabled);
  };

  const getDaysRemainingColor = (days) => {
    if (days > 5) return 'success';
    if (days > 0) return 'warning';
    return 'danger';
  };

  const refillColumns = [
    { key: 'patientName', label: 'Patient', sortable: true },
    { key: 'medicine', label: 'Medicine', sortable: true },
    {
      key: 'refillDueDate',
      label: 'Due Date',
      sortable: true,
      render: (date) => new Date(date).toLocaleDateString('en-IN')
    },
    {
      key: 'daysRemaining',
      label: 'Days Remaining',
      sortable: true,
      render: (days, row) => {
        const color = getDaysRemainingColor(days);
        return (
          <span style={{ color: `var(--${color})`, fontWeight: '600' }}>
            {days > 0 ? `${days} days` : 'Overdue'}
          </span>
        );
      }
    },
    {
      key: 'estimatedValue',
      label: 'Est. Value',
      sortable: true,
      render: (val) => `₹${val.toLocaleString('en-IN')}`
    },
    {
      key: 'reminderStatus',
      label: 'Reminder',
      sortable: false,
      render: (status) => (
        <span className={`badge badge-${status === 'sent' ? 'success' : 'warning'}`}>
          {status === 'sent' ? 'Sent' : 'Not Sent'}
        </span>
      )
    },
    {
      key: 'escalationLevel',
      label: 'Escalation',
      sortable: true,
      render: (level) => {
        const colors = { low: 'success', normal: 'info', urgent: 'danger', critical: 'danger' };
        return (
          <span className={`badge badge-${colors[level]}`}>
            {level.charAt(0).toUpperCase() + level.slice(1)}
          </span>
        );
      }
    },
    {
      key: 'id',
      label: 'Actions',
      sortable: false,
      render: (val, row) => (
        <button
          className="btn btn-small btn-secondary"
          onClick={(e) => {
            e.stopPropagation();
            handleNudge(row.id);
          }}
          disabled={row.reminderStatus === 'sent'}
        >
          <Send size={14} /> Nudge
        </button>
      )
    }
  ];

  // Sample refill conversion trend data
  const conversionTrendData = [
    { week: 'Week 1', conversion: 65 },
    { week: 'Week 2', conversion: 72 },
    { week: 'Week 3', conversion: 68 },
    { week: 'Week 4', conversion: 78 },
    { week: 'Week 5', conversion: conversionRate }
  ];

  if (loading) {
    return (
      <div className="page-container">
        <p style={{ textAlign: 'center', padding: '40px' }}>Loading refills...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Refills</h1>
        <p className="page-subtitle">Smart refill intelligence & patient nudges</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-3" style={{ marginBottom: '32px' }}>
        <StatCard
          icon={() => <span style={{ fontSize: '24px' }}>📋</span>}
          label="This Week's Refills"
          value={thisWeekRefills}
        />
        <StatCard
          icon={AlertTriangle}
          label="Revenue at Risk"
          value={`₹${revenueAtRisk.toLocaleString('en-IN')}`}
          change={-15}
          changeType="negative"
        />
        <StatCard
          icon={TrendingUp}
          label="Conversion Rate"
          value={`${conversionRate}%`}
          change={8}
          changeType="positive"
        />
      </div>

      {/* Auto-Nudge Toggle */}
      <div className="card" style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 className="card-title" style={{ marginBottom: '4px' }}>Auto-Nudge System</h3>
            <p className="card-subtitle">Automatically remind patients for refills</p>
          </div>
          <button
            className={`btn ${autoNudgeEnabled ? 'btn-success' : 'btn-outline'}`}
            onClick={() => handleAutoNudgeToggle(!autoNudgeEnabled)}
          >
            {autoNudgeEnabled ? 'Enabled' : 'Disabled'}
          </button>
        </div>
      </div>

      {/* Conversion Trend Chart */}
      <div className="card" style={{ marginBottom: '32px' }}>
        <h3 className="card-title">Refill Conversion Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={conversionTrendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-gray)" />
            <XAxis dataKey="week" tick={{ fontSize: 12, fill: 'var(--text-light)' }} />
            <YAxis tick={{ fontSize: 12, fill: 'var(--text-light)' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid var(--border-gray)',
                borderRadius: '8px'
              }}
              formatter={(value) => `${value}%`}
            />
            <Bar dataKey="conversion" fill="var(--success)" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Refills Table */}
      <DataTable
        title="Pending Refills"
        columns={refillColumns}
        data={refills}
        searchField="patientName"
      />
    </div>
  );
}

export default RefillsPage;
