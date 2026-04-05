import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ShoppingCart, ClipboardList, Pill, AlertCircle } from 'lucide-react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';

const HomePage = ({ patient, store }) => {
  const [upcomingRefills, setUpcomingRefills] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const refills = await api.getUpcomingRefills();
        const orders = await api.listOrders();

        setUpcomingRefills(refills.slice(0, 3));
        setRecentOrders(orders.reverse().slice(0, 3));
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const getDaysColor = (days) => {
    if (days < 3) return '#E74C3C';
    if (days < 7) return '#F39C12';
    return '#27AE60';
  };

  const urgentRefills = upcomingRefills.filter(r => r.daysRemaining < 3);

  return (
    <div className="page">
      {/* Header */}
      <div className="header">
        <h1>Hi {patient?.name?.split(' ')[0]}! 👋</h1>
        <p className="header-subtitle">
          {store ? `Welcome to ${store.name}` : 'Your trusted pharmacy companion'}
        </p>
      </div>

      {/* Urgent Refills Alert */}
      {urgentRefills.length > 0 && (
        <div style={{
          background: '#FEF3CD',
          border: '1px solid #FFC107',
          borderRadius: '8px',
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'flex-start'
        }}>
          <AlertCircle size={20} color="#FFC107" style={{ marginTop: '0.25rem', flexShrink: 0 }} />
          <div>
            <p style={{ margin: '0 0 0.25rem 0', fontWeight: '600', fontSize: '0.9rem', color: '#856404' }}>
              {urgentRefills.length} refill{urgentRefills.length > 1 ? 's' : ''} due soon!
            </p>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#856404' }}>
              Reorder now to avoid running out of medicine
            </p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="quick-actions">
        <Link to="/upload" className="card action-card">
          <Plus size={24} />
          <p>Upload Rx</p>
        </Link>
        <Link to="/order" className="card action-card">
          <ShoppingCart size={24} />
          <p>Order Medicines</p>
        </Link>
        <Link to="/orders" className="card action-card">
          <ClipboardList size={24} />
          <p>My Orders</p>
        </Link>
        <Link to="/refills" className="card action-card">
          <Pill size={24} />
          <p>Refills</p>
        </Link>
      </div>

      {/* Upcoming Refills */}
      {upcomingRefills.length > 0 && (
        <>
          <div className="section-title">Upcoming Refills</div>
          {upcomingRefills.map(refill => (
            <div key={refill.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <p className="card-title">{refill.medicineName}</p>
                  <p className="card-subtitle">{refill.dosage}</p>
                </div>
                <div style={{
                  background: getDaysColor(refill.daysRemaining),
                  color: 'white',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: '600'
                }}>
                  {refill.daysRemaining} days
                </div>
              </div>
              <p style={{ color: 'var(--text-light)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                Due on {new Date(refill.refillDueDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
              </p>
              <Link to="/refills" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                Reorder Now
              </Link>
            </div>
          ))}
        </>
      )}

      {/* Recent Orders */}
      {recentOrders.length > 0 && (
        <>
          <div className="section-title">Recent Orders</div>
          {recentOrders.map(order => (
            <Link key={order.id} to={`/orders/${order.id}`} className="card card-clickable">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <p className="card-title">{order.id}</p>
                  <p className="card-subtitle">
                    {order.medicines.length} medicine{order.medicines.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <StatusBadge status={order.status} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p className="card-meta">
                  {new Date(order.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: '2-digit' })}
                </p>
                <p style={{ fontWeight: '700', color: 'var(--primary)' }}>
                  ₹{order.total}
                </p>
              </div>
            </Link>
          ))}
          <Link to="/orders" className="btn btn-secondary btn-block" style={{ textAlign: 'center', marginTop: '1rem' }}>
            View All Orders
          </Link>
        </>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
          <p>Loading...</p>
        </div>
      )}
    </div>
  );
};

export default HomePage;
