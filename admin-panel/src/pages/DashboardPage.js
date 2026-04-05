import React, { useState, useEffect } from 'react';
import {
  Store,
  Users,
  ShoppingCart,
  TrendingUp,
  RefreshCw,
  Activity,
} from 'lucide-react';
import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { api } from '../services/api';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

function DashboardPage() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMetrics = async () => {
      const data = await api.getDashboardMetrics();
      setMetrics(data);
      setLoading(false);
    };
    loadMetrics();
  }, []);

  if (loading) {
    return <div className="app-header"><h1>Loading...</h1></div>;
  }

  const recentStoresColumns = [
    { key: 'name', label: 'Store Name' },
    { key: 'owner', label: 'Owner' },
    { key: 'city', label: 'City' },
    {
      key: 'plan',
      label: 'Plan',
      render: (value) => (
        <span className={`plan-badge plan-${value.toLowerCase()}`}>{value}</span>
      ),
    },
    { key: 'date', label: 'Signup Date' },
  ];

  return (
    <div>
      <div className="app-header">
        <h1>Dashboard</h1>
      </div>

      <div className="app-content">
        {/* KPI Cards */}
        <div className="dashboard-grid">
          <StatCard
            icon={Store}
            label="Total Stores"
            value={metrics.totalStores}
            change={metrics.totalStoresGrowth}
          />
          <StatCard
            icon={Users}
            label="Total Patients"
            value={metrics.totalPatients}
            change={metrics.totalPatientsGrowth}
          />
          <StatCard
            icon={ShoppingCart}
            label="Orders This Month"
            value={metrics.totalOrdersMonth}
            change={8}
          />
          <StatCard
            icon={TrendingUp}
            label="Revenue This Month"
            value={metrics.totalRevenueMonth}
            unit="₹"
            change={12}
          />
          <StatCard
            icon={RefreshCw}
            label="Active Refill Reminders"
            value={metrics.activeRefillReminders}
            change={-5}
          />
          <StatCard
            icon={Activity}
            label="Platform GMV"
            value={metrics.platformGMV}
            unit="₹"
            change={18}
          />
        </div>

        {/* Charts */}
        <div className="charts-row">
          <div className="chart-container">
            <div className="chart-header">
              <h2 className="chart-title">Revenue Trend</h2>
              <p className="chart-subtitle">Last 6 months</p>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={metrics.revenueData}>
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
                  dataKey="revenue"
                  stroke="#1B4F72"
                  strokeWidth={2}
                  dot={{ fill: '#1B4F72', r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-container">
            <div className="chart-header">
              <h2 className="chart-title">Orders by City</h2>
              <p className="chart-subtitle">This month</p>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={metrics.ordersByCity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a3a4a" />
                <XAxis dataKey="city" stroke="#78909C" />
                <YAxis stroke="#78909C" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e2936',
                    border: '1px solid #2a3a4a',
                    borderRadius: '6px',
                  }}
                  labelStyle={{ color: '#FFFFFF' }}
                />
                <Bar dataKey="orders" fill="#1B4F72" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Store Signups */}
        <div style={{ marginBottom: '24px' }}>
          <DataTable
            title="Recent Store Signups"
            data={metrics.recentStoreSignups}
            columns={recentStoresColumns}
          />
        </div>

        {/* Platform Health */}
        <div className="chart-container">
          <div className="chart-header">
            <h2 className="chart-title">Platform Health Indicators</h2>
            <p className="chart-subtitle">Current status</p>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
            }}
          >
            <div style={{ padding: '16px', backgroundColor: '#0f3a1e', borderRadius: '8px' }}>
              <p style={{ color: '#78909C', fontSize: '12px', marginBottom: '8px' }}>
                SYSTEM STATUS
              </p>
              <p style={{ color: '#2ECC71', fontWeight: '700', fontSize: '16px' }}>
                Operational
              </p>
            </div>
            <div style={{ padding: '16px', backgroundColor: '#0f2a3a', borderRadius: '8px' }}>
              <p style={{ color: '#78909C', fontSize: '12px', marginBottom: '8px' }}>
                API UPTIME
              </p>
              <p style={{ color: '#1B4F72', fontWeight: '700', fontSize: '16px' }}>
                99.9%
              </p>
            </div>
            <div style={{ padding: '16px', backgroundColor: '#0f3a1e', borderRadius: '8px' }}>
              <p style={{ color: '#78909C', fontSize: '12px', marginBottom: '8px' }}>
                ACTIVE USERS
              </p>
              <p style={{ color: '#2ECC71', fontWeight: '700', fontSize: '16px' }}>
                1,245
              </p>
            </div>
            <div style={{ padding: '16px', backgroundColor: '#0f2a3a', borderRadius: '8px' }}>
              <p style={{ color: '#78909C', fontSize: '12px', marginBottom: '8px' }}>
                RESPONSE TIME
              </p>
              <p style={{ color: '#1B4F72', fontWeight: '700', fontSize: '16px' }}>
                145ms
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
