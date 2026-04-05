import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Users,
  ShoppingCart,
  TrendingUp,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Mail,
} from 'lucide-react';
import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { api } from '../services/api';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

function StoreDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [store, setStore] = useState(null);
  const [patients, setPatients] = useState([]);
  const [orders, setOrders] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const storeData = await api.getStore(id);
      const patientsData = await api.getStorePatients(id);
      const ordersData = await api.getStoreOrders(id);
      const revenueData = await api.getStoreRevenue30Days(id);

      setStore(storeData);
      setPatients(patientsData);
      setOrders(ordersData);
      setRevenueData(revenueData);
      setLoading(false);
    };
    loadData();
  }, [id]);

  if (loading || !store) {
    return <div className="app-header"><h1>Loading...</h1></div>;
  }

  const avgOrderValue = store.orders > 0 ? (store.revenue * 100000 / store.orders).toFixed(0) : 0;

  const patientColumns = [
    { key: 'name', label: 'Patient Name' },
    { key: 'phone', label: 'Phone' },
    {
      key: 'orders',
      label: 'Orders',
      render: (value) => <span>{value}</span>,
    },
    {
      key: 'lifetime',
      label: 'Lifetime Value (₹)',
      render: (value) => <span>{value.toLocaleString('en-IN')}</span>,
    },
  ];

  const orderColumns = [
    { key: 'id', label: 'Order ID' },
    { key: 'patientName', label: 'Patient' },
    {
      key: 'amount',
      label: 'Amount (₹)',
      render: (value) => <span>{value}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <StatusBadge
          type={value.toLowerCase()}
          text={value}
        />
      ),
    },
    { key: 'date', label: 'Date' },
  ];

  return (
    <div>
      <div className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigate('/stores')}
            className="btn btn-secondary"
            style={{ padding: '8px', width: 'auto' }}
          >
            <ChevronLeft size={18} />
          </button>
          <h1>{store.name}</h1>
        </div>
        <div className="detail-actions">
          <button className="detail-btn">Activate/Deactivate</button>
          <button className="detail-btn">Change Plan</button>
          <button className="detail-btn">Verify</button>
          <button className="detail-btn primary">
            <Mail size={16} />
            Send Notification
          </button>
        </div>
      </div>

      <div className="app-content">
        {/* Store Profile */}
        <div className="profile-section">
          <div className="profile-card">
            <div className="profile-field">
              <label className="profile-label">Store Name</label>
              <div className="profile-value">{store.name}</div>
            </div>
            <div className="profile-field">
              <label className="profile-label">Owner</label>
              <div className="profile-value">{store.owner}</div>
            </div>
            <div className="profile-field">
              <label className="profile-label">City</label>
              <div className="profile-value">{store.city}</div>
            </div>
            <div className="profile-field">
              <label className="profile-label">Plan</label>
              <div style={{ marginTop: '6px' }}>
                <span className={`plan-badge plan-${store.plan.toLowerCase()}`}>
                  {store.plan}
                </span>
              </div>
            </div>
          </div>

          <div className="profile-card">
            <div className="profile-field">
              <label className="profile-label">Phone</label>
              <div className="profile-value">{store.phone}</div>
            </div>
            <div className="profile-field">
              <label className="profile-label">Email</label>
              <div className="profile-value">{store.email}</div>
            </div>
            <div className="profile-field">
              <label className="profile-label">Status</label>
              <div style={{ marginTop: '6px' }}>
                <StatusBadge type={store.status.toLowerCase()} text={store.status} />
              </div>
            </div>
            <div className="profile-field">
              <label className="profile-label">Verified</label>
              <div style={{ marginTop: '6px' }}>
                <StatusBadge
                  type={store.verified ? 'verified' : 'unverified'}
                  text={store.verified ? 'Yes' : 'No'}
                  icon={store.verified ? CheckCircle : AlertCircle}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <StatCard
            icon={Users}
            label="Total Patients"
            value={store.patients}
            change={5}
          />
          <StatCard
            icon={ShoppingCart}
            label="Total Orders"
            value={store.orders}
            change={8}
          />
          <StatCard
            icon={TrendingUp}
            label="Total Revenue"
            value={store.revenue}
            unit="₹"
            change={12}
          />
          <StatCard
            icon={DollarSign}
            label="Avg Order Value"
            value={avgOrderValue}
            unit="₹"
            change={3}
          />
        </div>

        {/* Revenue Chart */}
        <div className="chart-container">
          <div className="chart-header">
            <h2 className="chart-title">Revenue Trend</h2>
            <p className="chart-subtitle">Last 30 days</p>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a3a4a" />
              <XAxis dataKey="date" stroke="#78909C" />
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
                dataKey="revenue"
                stroke="#1B4F72"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Patients Table */}
        <div style={{ marginBottom: '24px' }}>
          <DataTable
            title={`Store Patients (${patients.length})`}
            data={patients}
            columns={patientColumns}
            searchableFields={['name', 'phone']}
          />
        </div>

        {/* Orders Table */}
        <div style={{ marginBottom: '24px' }}>
          <DataTable
            title={`Order History (${orders.length})`}
            data={orders}
            columns={orderColumns}
            searchableFields={['id', 'patientName']}
          />
        </div>
      </div>
    </div>
  );
}

export default StoreDetailPage;
