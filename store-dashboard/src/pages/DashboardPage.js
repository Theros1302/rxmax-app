import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { DollarSign, ShoppingCart, AlertTriangle, Users, Link2, Copy, Check } from 'lucide-react';
import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';
import { api } from '../services/api';

function DashboardPage() {
  const navigate = useNavigate();
  const [todayRevenue, setTodayRevenue] = useState('₹0');
  const [totalOrders, setTotalOrders] = useState(0);
  const [pendingRefills, setPendingRefills] = useState(0);
  const [atRiskPatients, setAtRiskPatients] = useState(0);
  const [revenueData, setRevenueData] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [atRiskRevenue, setAtRiskRevenue] = useState('₹0');
  const [refillsThisWeek, setRefillsThisWeek] = useState(0);
  const [patientLink, setPatientLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    loadDashboardData();
    loadPatientLink();
  }, []);

  const loadPatientLink = async () => {
    try {
      var storeProfile = await api.getStoreProfile();
      var slug = (storeProfile && storeProfile.slug) || '';
      var storeId = (storeProfile && storeProfile.id) || localStorage.getItem('rxmax_store_id') || '';
      var linkParam = slug || storeId;
      if (linkParam) {
        setPatientLink('https://rxmax-patient-app.vercel.app/store/' + linkParam);
      }
    } catch (err) {
      var fallbackId = localStorage.getItem('rxmax_store_id') || '';
      if (fallbackId) {
        setPatientLink('https://rxmax-patient-app.vercel.app/store/' + fallbackId);
      }
    }
  };

  const copyPatientLink = () => {
    if (patientLink) {
      navigator.clipboard.writeText(patientLink).then(function() {
        setLinkCopied(true);
        setTimeout(function() { setLinkCopied(false); }, 2000);
      });
    }
  };

  const loadDashboardData = async () => {
    try {
      const [orders, refills, patients, revenueData] = await Promise.all([
        api.getOrders(),
        api.getRefills(),
        api.getPatients(),
        api.getDailyRevenue()
      ]);

      const todayData = revenueData[revenueData.length - 1];
      setTodayRevenue(`₹${todayData.revenue.toLocaleString('en-IN')}`);
      setTotalOrders(todayData.orders);

      const today = new Date().toISOString().split('T')[0];
      const dueTodayRefills = refills.filter(r => r.refillDueDate <= today && r.status === 'pending').length;
      setPendingRefills(dueTodayRefills);

      const atRisk = patients.filter(p => p.riskLevel === 'high' || (p.riskLevel === 'medium' && p.adherenceScore < 70)).length;
      setAtRiskPatients(atRisk);

      const atRiskRevenueAmount = refills
        .filter(r => r.escalationLevel === 'urgent' || r.daysRemaining <= 0)
        .reduce((sum, r) => sum + r.estimatedValue, 0);
      setAtRiskRevenue(`₹${atRiskRevenueAmount.toLocaleString('en-IN')}`);

      const nextWeekDate = new Date();
      nextWeekDate.setDate(nextWeekDate.getDate() + 7);
      const nextWeekStr = nextWeekDate.toISOString().split('T')[0];
      const thisWeekRefills = refills.filter(r => r.refillDueDate <= nextWeekStr && r.status === 'pending');
      setRefillsThisWeek(thisWeekRefills.length);

      setRevenueData(revenueData.slice(-30));

      const recent = orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
      setRecentOrders(recent);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const orderTableColumns = [
    { key: 'id', label: 'Order ID' },
    { key: 'patientName', label: 'Patient' },
    { key: 'totalAmount', label: 'Amount', render: (val) => `₹${val.toLocaleString('en-IN')}` },
    {
      key: 'status',
      label: 'Status',
      render: (status) => (
        <span className={`badge badge-${status === 'delivered' ? 'success' : status === 'pending' ? 'warning' : 'info'}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      )
    },
    {
      key: 'date',
      label: 'Date',
      render: (date) => new Date(date).toLocaleDateString('en-IN')
    }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Welcome back! Here's your store performance at a glance.</p>
      </div>

      {patientLink && (
        <div className="card" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, #f0f7ff 0%, #e8f4f8 100%)', border: '1px solid #b3d9ff' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: 'var(--primary)', borderRadius: '10px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Link2 size={20} color="white" />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: 'var(--text-dark)' }}>Patient Onboarding Link</h4>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-light)' }}>Share this link with patients to connect them to your pharmacy</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1', minWidth: '280px', maxWidth: '600px' }}>
              <input
                type="text"
                readOnly
                value={patientLink}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: '1px solid #b3d9ff',
                  borderRadius: '8px',
                  fontSize: '13px',
                  backgroundColor: 'white',
                  color: 'var(--text-dark)',
                  outline: 'none'
                }}
                onClick={function(e) { e.target.select(); }}
              />
              <button
                onClick={copyPatientLink}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: linkCopied ? '#10b981' : 'var(--primary)',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                  whiteSpace: 'nowrap',
                  transition: 'background-color 0.2s'
                }}
              >
                {linkCopied ? <Check size={14} /> : <Copy size={14} />}
                {linkCopied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-4">
        <StatCard
          icon={DollarSign}
          label="Today's Revenue"
          value={todayRevenue}
          change={12}
          changeType="positive"
        />
        <StatCard
          icon={ShoppingCart}
          label="Orders Today"
          value={totalOrders}
          change={8}
          changeType="positive"
        />
        <StatCard
          icon={AlertTriangle}
          label="Pending Refills"
          value={pendingRefills}
          change={-5}
          changeType="negative"
        />
        <StatCard
          icon={Users}
          label="At-Risk Patients"
          value={atRiskPatients}
          change={3}
          changeType="negative"
        />
      </div>

      <div className="card" style={{ marginTop: '32px' }}>
        <h3 className="card-title">Revenue Trend - Last 30 Days</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={revenueData}>
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
              labelFormatter={(date) => new Date(date).toLocaleDateString('en-IN')}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
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

      <div className="grid grid-2" style={{ marginTop: '32px' }}>
        <div className="alert alert-danger">
          <AlertTriangle className="alert-icon" />
          <div className="alert-content">
            <h4>Revenue at Risk</h4>
            <p style={{ fontSize: '16px', fontWeight: '600', marginTop: '8px' }}>{atRiskRevenue}</p>
            <p style={{ fontSize: '12px', marginTop: '4px' }}>
              Patients haven't refilled or responded to reminders. Take action now.
            </p>
          </div>
        </div>

        <div className="alert alert-warning">
          <AlertTriangle className="alert-icon" />
          <div className="alert-content">
            <h4>Refills Due This Week</h4>
            <p style={{ fontSize: '16px', fontWeight: '600', marginTop: '8px' }}>
              {refillsThisWeek} refills pending
            </p>
            <p style={{ fontSize: '12px', marginTop: '4px' }}>
              Send nudges and reminders to maximize revenue.
            </p>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '32px' }}>
        <DataTable
          title="Recent Orders"
          columns={orderTableColumns}
          data={recentOrders}
          searchField="patientName"
          onRowClick={(row) => navigate(`/orders/${row.id}`)}
        />
      </div>
    </div>
  );
}

export default DashboardPage;
