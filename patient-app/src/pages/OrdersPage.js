import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const data = await api.listOrders();
        setOrders(data.reverse());
      } catch (error) {
        console.error('Error loading orders:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  if (loading) {
    return (
      <div className="page">
        <div className="header">
          <h1>My Orders</h1>
          <p className="header-subtitle">Order history and status</p>
        </div>
        <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
          <p>Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="header">
        <h1>My Orders</h1>
        <p className="header-subtitle">Order history and status</p>
      </div>

      {orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📦</div>
          <h3>No orders yet</h3>
          <p>Start ordering medicines to see your orders here</p>
          <Link to="/order" className="btn btn-primary">
            Order Now
          </Link>
        </div>
      ) : (
        <>
          <div className="section-title">All Orders</div>
          {orders.map(order => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="card card-clickable"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <p className="card-title">{order.id}</p>
                  <p className="card-subtitle">
                    {order.medicines.length} medicine{order.medicines.length !== 1 ? 's' : ''} • ₹{order.total}
                  </p>
                </div>
                <StatusBadge status={order.status} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-light)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                <Calendar size={14} />
                {new Date(order.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {order.medicines.slice(0, 2).map(med => (
                  <span
                    key={med.id}
                    style={{
                      fontSize: '0.75rem',
                      background: 'var(--light-bg)',
                      color: 'var(--text-secondary)',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px'
                    }}
                  >
                    {med.name}
                  </span>
                ))}
                {order.medicines.length > 2 && (
                  <span style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-light)'
                  }}>
                    +{order.medicines.length - 2} more
                  </span>
                )}
              </div>
            </Link>
          ))}
        </>
      )}
    </div>
  );
};

export default OrdersPage;
