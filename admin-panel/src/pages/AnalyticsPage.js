import React, { useState, useEffect } from 'react';
import DataTable from '../components/DataTable';
import { api } from '../services/api';
import {
  PieChart,
  Pie,
  Cell,
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

function AnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      const data = await api.getAnalytics();
      setAnalytics(data);
      setLoading(false);
    };
    loadAnalytics();
  }, []);

  if (loading) {
    return <div className="app-header"><h1>Loading...</h1></div>;
  }

  const COLORS = ['#1B4F72', '#2874A6', '#5DADE2', '#85C1E2', '#AED6F1', '#D6EAF8'];

  const performanceColumns = [
    { key: 'store', label: 'Store Name' },
    {
      key: 'revenue',
      label: 'Revenue (₹L)',
      render: (value) => <span>{value.toFixed(1)}</span>,
    },
    {
      key: 'patients',
      label: 'Patients',
      render: (value) => <span>{value}</span>,
    },
    {
      key: 'orders',
      label: 'Orders',
      render: (value) => <span>{value}</span>,
    },
    {
      key: 'avgValue',
      label: 'Avg Order Value (₹)',
      render: (value) => <span>{value}</span>,
    },
  ];

  return (
    <div>
      <div className="app-header">
        <h1>Platform Analytics</h1>
      </div>

      <div className="app-content">
        <div className="charts-row">
          <div className="chart-container">
            <div className="chart-header">
              <h2 className="chart-title">Revenue by City</h2>
              <p className="chart-subtitle">Distribution across regions</p>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={analytics.revenueByCity}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ city, value }) => `${city}: ₹${value}L`}
                  outerRadius={120}
                  fill="#1B4F72"
                  dataKey="value"
                >
                  {analytics.revenueByCity.map((entry, index) => (
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

          <div className="chart-container">
            <div className="chart-header">
              <h2 className="chart-title">Store Growth Trend</h2>
              <p className="chart-subtitle">New stores per month</p>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={analytics.newStoresPerMonth}>
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
                <Line
                  type="monotone"
                  dataKey="stores"
                  stroke="#27AE60"
                  strokeWidth={2}
                  dot={{ fill: '#27AE60', r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="charts-row">
          <div className="chart-container">
            <div className="chart-header">
              <h2 className="chart-title">Patient Growth Trend</h2>
              <p className="chart-subtitle">New patients per month</p>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={analytics.newPatientsPerMonth}>
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
                <Line
                  type="monotone"
                  dataKey="patients"
                  stroke="#F39C12"
                  strokeWidth={2}
                  dot={{ fill: '#F39C12', r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-container">
            <div className="chart-header">
              <h2 className="chart-title">Top 10 Stores by Revenue</h2>
              <p className="chart-subtitle">This period</p>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart
                data={analytics.topStoresByRevenue}
                layout="vertical"
                margin={{ left: 150, right: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#2a3a4a" />
                <XAxis type="number" stroke="#78909C" />
                <YAxis dataKey="name" type="category" stroke="#78909C" width={150} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e2936',
                    border: '1px solid #2a3a4a',
                    borderRadius: '6px',
                  }}
                  labelStyle={{ color: '#FFFFFF' }}
                />
                <Bar dataKey="revenue" fill="#1B4F72" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="charts-row">
          <div className="chart-container">
            <div className="chart-header">
              <h2 className="chart-title">Top 10 Medicines by Orders</h2>
              <p className="chart-subtitle">Most ordered medicines</p>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart
                data={analytics.topMedicinesByOrders}
                layout="vertical"
                margin={{ left: 150, right: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#2a3a4a" />
                <XAxis type="number" stroke="#78909C" />
                <YAxis dataKey="name" type="category" stroke="#78909C" width={150} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e2936',
                    border: '1px solid #2a3a4a',
                    borderRadius: '6px',
                  }}
                  labelStyle={{ color: '#FFFFFF' }}
                />
                <Bar dataKey="orders" fill="#27AE60" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Performance Table */}
        <div style={{ marginBottom: '24px' }}>
          <DataTable
            title="Store Performance Comparison"
            data={analytics.storePerformance}
            columns={performanceColumns}
            searchableFields={['store']}
          />
        </div>
      </div>
    </div>
  );
}

export default AnalyticsPage;
