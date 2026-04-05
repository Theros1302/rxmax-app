import React, { useState, useEffect } from 'react';
import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';
import { api } from '../services/api';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { RefreshCw, TrendingUp, DollarSign } from 'lucide-react';

function RefillsPage() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMetrics = async () => {
      const data = await api.getRefillMetrics();
      setMetrics(data);
      setLoading(false);
    };
    loadMetrics();
  }, []);

  if (loading) {
    return <div className="app-header"><h1>Loading...</h1></div>;
  }

  const COLORS = ['#27AE60', '#F39C12', '#E74C3C'];

  const overdueReminders = [
    {
      id: 1,
      patientName: 'Ramesh Gupta',
      storeName: 'Apollo Pharmacy',
      medicine: 'Aspirin 500mg',
      daysOverdue: 3,
      escalationLevel: 'Medium',
    },
    {
      id: 2,
      patientName: 'Suresh Nair',
      storeName: 'HealthFirst',
      medicine: 'Metformin 500mg',
      daysOverdue: 7,
      escalationLevel: 'High',
    },
    {
      id: 3,
      patientName: 'Raj Kumar',
      storeName: 'Apollo Pharmacy',
      medicine: 'Atorvastatin 10mg',
      daysOverdue: 2,
      escalationLevel: 'Low',
    },
    {
      id: 4,
      patientName: 'Arjun Menon',
      storeName: 'Wellness Pharmacy',
      medicine: 'Lisinopril 5mg',
      daysOverdue: 5,
      escalationLevel: 'Medium',
    },
  ];

  const overdueColumns = [
    { key: 'patientName', label: 'Patient' },
    { key: 'storeName', label: 'Store' },
    { key: 'medicine', label: 'Medicine' },
    {
      key: 'daysOverdue',
      label: 'Days Overdue',
      render: (value) => <span style={{ color: '#E74C3C', fontWeight: '600' }}>{value}</span>,
    },
    { key: 'escalationLevel', label: 'Escalation Level' },
  ];

  return (
    <div>
      <div className="app-header">
        <h1>Refill Analytics</h1>
      </div>

      <div className="app-content">
        {/* Summary Stats */}
        <div className="stats-grid">
          <StatCard
            icon={RefreshCw}
            label="Active Reminders"
            value={metrics.totalActiveReminders}
            change={8}
          />
          <StatCard
            icon={TrendingUp}
            label="Conversion Rate"
            value={metrics.conversionRate + '%'}
            change={5}
          />
          <StatCard
            icon={DollarSign}
            label="Revenue Recovered"
            value={metrics.revenueRecovered}
            unit="₹"
            change={12}
          />
        </div>

        {/* Charts */}
        <div className="charts-row">
          <div className="chart-container">
            <div className="chart-header">
              <h2 className="chart-title">Refill Performance by Store</h2>
              <p className="chart-subtitle">Conversion performance</p>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart
                data={metrics.refillPerformanceByStore}
                layout="vertical"
                margin={{ left: 140, right: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#2a3a4a" />
                <XAxis type="number" stroke="#78909C" />
                <YAxis dataKey="name" type="category" stroke="#78909C" width={140} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e2936',
                    border: '1px solid #2a3a4a',
                    borderRadius: '6px',
                  }}
                  labelStyle={{ color: '#FFFFFF' }}
                />
                <Bar dataKey="performance" fill="#27AE60" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-container">
            <div className="chart-header">
              <h2 className="chart-title">Escalation Level Distribution</h2>
              <p className="chart-subtitle">Refill status breakdown</p>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={metrics.escalationLevels}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ level, value }) => `${level}: ${value}%`}
                  outerRadius={120}
                  fill="#1B4F72"
                  dataKey="value"
                >
                  {metrics.escalationLevels.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e2936',
                    border: '1px solid #2a3a4a',
                    borderRadius: '6px',
                  }}
                  labelStyle={{ color: '#FFFFFF' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Conversion Rate Trend */}
        <div className="chart-container">
          <div className="chart-header">
            <h2 className="chart-title">Refill Conversion Rate Trend</h2>
            <p className="chart-subtitle">Monthly performance</p>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={metrics.refillConversionRate}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a3a4a" />
              <XAxis dataKey="month" stroke="#78909C" />
              <YAxis stroke="#78909C" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e2936',
                  border: '1px solid #2a3a4a',
                  borderRadius: '6px',
                }}
                labelStyle={{ color: '#FFFFFF' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="rate"
                stroke="#1B4F72"
                strokeWidth={2}
                dot={{ fill: '#1B4F72', r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Overdue Reminders */}
        <div style={{ marginBottom: '24px' }}>
          <DataTable
            title={`Overdue Reminders (${overdueReminders.length})`}
            data={overdueReminders}
            columns={overdueColumns}
            searchableFields={['patientName', 'storeName', 'medicine']}
          />
        </div>
      </div>
    </div>
  );
}

export default RefillsPage;
