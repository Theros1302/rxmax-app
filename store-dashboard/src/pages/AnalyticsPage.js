import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';
import { api } from '../services/api';

function AnalyticsPage() {
  const [orders, setOrders] = useState([]);
  const [patients, setPatients] = useState([]);
  const [revenue, setRevenue] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      const [ordersData, patientsData, revenueData, inventoryData] = await Promise.all([
        api.getOrders(),
        api.getPatients(),
        api.getDailyRevenue(),
        api.getInventory()
      ]);

      setOrders(ordersData);
      setPatients(patientsData);
      setRevenue(revenueData.slice(-30));
      setInventory(inventoryData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading analytics:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <p style={{ textAlign: 'center', padding: '40px' }}>Loading analytics...</p>
      </div>
    );
  }

  // Calculate KPIs
  const totalRevenue = revenue.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  const repeatPatients = patients.filter(p => p.totalOrders > 1).length;
  const repeatRate = patients.length > 0 ? Math.round((repeatPatients / patients.length) * 100) : 0;

  // Orders by type data
  const ordersByType = [
    { name: 'Pending', value: orders.filter(o => o.status === 'pending').length, fill: '#F39C12' },
    { name: 'Confirmed', value: orders.filter(o => o.status === 'confirmed').length, fill: '#2E86C1' },
    { name: 'Delivered', value: orders.filter(o => o.status === 'delivered').length, fill: '#27AE60' }
  ];

  // New patients per week
  const newPatientsPerWeek = [
    { week: 'Week 1', patients: 12 },
    { week: 'Week 2', patients: 18 },
    { week: 'Week 3', patients: 14 },
    { week: 'Week 4', patients: 21 },
    { week: 'Week 5', patients: 16 }
  ];

  // Top medicines by revenue
  const topMedicines = inventory
    .sort((a, b) => (b.stock * b.sellingPrice) - (a.stock * a.sellingPrice))
    .slice(0, 10)
    .map(med => ({
      name: med.name.substring(0, 15) + '...',
      revenue: Math.round(med.stock * med.sellingPrice)
    }));

  // Daily statistics
  const dailyStats = revenue.slice(-7).map(d => ({
    date: new Date(d.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    revenue: d.revenue,
    orders: d.orders
  }));

  const statsColumns = [
    { key: 'date', label: 'Date', sortable: true },
    { key: 'revenue', label: 'Revenue', sortable: true, render: (val) => `₹${val.toLocaleString('en-IN')}` },
    { key: 'orders', label: 'Orders', sortable: true }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">Comprehensive business insights and performance metrics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-4" style={{ marginBottom: '32px' }}>
        <StatCard
          icon={() => <span style={{ fontSize: '24px' }}>💰</span>}
          label="Total Revenue"
          value={`₹${totalRevenue.toLocaleString('en-IN')}`}
          change={18}
          changeType="positive"
        />
        <StatCard
          icon={() => <span style={{ fontSize: '24px' }}>🛒</span>}
          label="Total Orders"
          value={totalOrders}
          change={12}
          changeType="positive"
        />
        <StatCard
          icon={() => <span style={{ fontSize: '24px' }}>📊</span>}
          label="Avg Order Value"
          value={`₹${avgOrderValue}`}
          change={5}
          changeType="positive"
        />
        <StatCard
          icon={() => <span style={{ fontSize: '24px' }}>👥</span>}
          label="Repeat Rate"
          value={`${repeatRate}%`}
          change={8}
          changeType="positive"
        />
      </div>

      {/* Revenue Trend */}
      <div className="card" style={{ marginBottom: '32px' }}>
        <h3 className="card-title">Revenue Trend - Last 30 Days</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={revenue}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-gray)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: 'var(--text-light)' }}
              tickFormatter={(date) => new Date(date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
            />
            <YAxis tick={{ fontSize: 12, fill: 'var(--text-light)' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid var(--border-gray)',
                borderRadius: '8px'
              }}
              formatter={(value) => `₹${value.toLocaleString('en-IN')}`}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="var(--primary)"
              dot={false}
              strokeWidth={2}
              name="Daily Revenue"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Orders & New Patients */}
      <div className="grid grid-2" style={{ marginBottom: '32px' }}>
        {/* Orders by Type */}
        <div className="card">
          <h3 className="card-title">Orders by Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={ordersByType}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {ordersByType.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* New Patients per Week */}
        <div className="card">
          <h3 className="card-title">New Patients per Week</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={newPatientsPerWeek}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-gray)" />
              <XAxis dataKey="week" tick={{ fontSize: 12, fill: 'var(--text-light)' }} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--text-light)' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid var(--border-gray)',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="patients" fill="var(--success)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Medicines */}
      <div className="card" style={{ marginBottom: '32px' }}>
        <h3 className="card-title">Top 10 Medicines by Revenue Potential</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={topMedicines}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 200, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-gray)" />
            <XAxis type="number" tick={{ fontSize: 12, fill: 'var(--text-light)' }} />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: 'var(--text-light)' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid var(--border-gray)',
                borderRadius: '8px'
              }}
              formatter={(value) => `₹${value.toLocaleString('en-IN')}`}
            />
            <Bar dataKey="revenue" fill="var(--primary)" radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Daily Statistics Table */}
      <DataTable
        title="Daily Statistics - Last 7 Days"
        columns={statsColumns}
        data={dailyStats}
      />
    </div>
  );
}

export default AnalyticsPage;
