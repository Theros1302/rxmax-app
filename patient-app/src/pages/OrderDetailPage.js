import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, Calendar, Package } from 'lucide-react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';

const OrderDetailPage = ({ store }) => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reordering, setReordering] = useState(false);

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const data = await api.getOrder(id);
        setOrder(data);
      } catch (error) {
        console.error('Error loading order:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [id]);

  const getStatusTimeline = () => {
    const statuses = ['processing', 'ready', 'delivered'];
    const currentIndex = statuses.indexOf(order?.status || 'processing');

    return [
      { label: 'Order Placed', status: 'completed', date: order?.date },
      { label: 'Confirmed', status: currentIndex >= 0 ? 'completed' : 'pending', date: order?.date },
      { label: 'Preparing', status: currentIndex >= 1 ? 'completed' : 'pending' },
      { label: 'Ready for Pickup', status: currentIndex >= 1 ? 'completed' : 'pending' },
      { label: 'Delivered', status: currentIndex >= 2 ? 'completed' : 'pending', date: order?.deliveryDate }
    ];
  };

  const handleReorder = async () => {
    setReordering(true);
    try {
      const newOrder = await api.reorder(id);
      window.location.href = `/orders/${newOrder.id}`;
    } catch (error) {
      alert('Failed to reorder: ' + error.message);
      setReordering(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="header">
          <h1>Order Details</h1>
        </div>
        <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
          <p>Loading order...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="page">
        <div className="header">
          <h1>Order Not Found</h1>
        </div>
        <div className="empty-state">
          <h3>Order not found</h3>
        </div>
      </div>
    );
  }

  const timeline = getStatusTimeline();

  return (
    <div className="page">
      <div className="header">
        <h1>{order.id}</h1>
        <p className="header-subtitle">Order details and tracking</p>
      </div>

      {/* Status Badge */}
      <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        <StatusBadge status={order.status} />
      </div>

      {/* Timeline */}
      <div className="section-title">Status Timeline</div>
      <div className="timeline">
        {timeline.map((item, index) => (
          <div key={index} className="timeline-item">
            <div className={`timeline-dot ${item.status === 'completed' ? 'completed' : 'active'}`}>
              {item.status === 'completed' ? '✓' : ''}
            </div>
            <div className="timeline-title">{item.label}</div>
            {item.date && (
              <div className="timeline-date">
                {new Date(item.date).toLocaleDateString('en-IN')}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Medicines */}
      <div className="section-title">Medicines</div>
      {order.medicines.map(medicine => (
        <div key={medicine.id} className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <div>
              <p className="card-title">{medicine.name}</p>
              <p className="card-subtitle">{medicine.dosage}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontWeight: '600', color: 'var(--primary)', marginBottom: '0.25rem' }}>
                ₹{medicine.price}
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                Qty: {medicine.quantity}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>Subtotal</span>
            <span style={{ fontWeight: '600', color: 'var(--primary)' }}>₹{medicine.price * medicine.quantity}</span>
          </div>
        </div>
      ))}

      {/* Delivery/Pickup Info */}
      <div className="section-title">
        {order.deliveryType === 'home' ? 'Delivery Information' : 'Pickup Information'}
      </div>
      <div className="card">
        {order.deliveryType === 'home' ? (
          <>
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
              <MapPin size={20} color="var(--secondary)" style={{ flexShrink: 0 }} />
              <div>
                <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Delivery Address</p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                  {order.deliveryAddress || 'Address will be confirmed'}
                </p>
              </div>
            </div>
            {order.deliveryDate && (
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <Calendar size={20} color="var(--secondary)" style={{ flexShrink: 0 }} />
                <div>
                  <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Delivery Date</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                    {new Date(order.deliveryDate).toLocaleDateString('en-IN')}
                  </p>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
              <Package size={20} color="var(--secondary)" style={{ flexShrink: 0 }} />
              <div>
                <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Pickup Location</p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                  {store?.address || 'Pharmacy location'}
                </p>
              </div>
            </div>
            {order.pickupTime && (
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <Calendar size={20} color="var(--secondary)" style={{ flexShrink: 0 }} />
                <div>
                  <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Pickup Time</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                    {order.pickupTime}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bill Summary */}
      <div className="section-title">Bill Summary</div>
      <div className="card">
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
            <span>₹{order.subtotal}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              {order.deliveryType === 'home' ? 'Delivery Charge' : 'Pickup Charge'}
            </span>
            <span>₹{order.delivery}</span>
          </div>
          <div className="divider"></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '1.125rem' }}>
            <span>Total Amount</span>
            <span className="currency-large">₹{order.total}</span>
          </div>
        </div>
      </div>

      {/* Reorder Button */}
      {order.status === 'delivered' && (
        <button
          onClick={handleReorder}
          className="btn btn-primary btn-block"
          style={{ marginTop: '1.5rem' }}
          disabled={reordering}
        >
          {reordering ? (
            <>
              <span className="spinner"></span>
              Creating Order...
            </>
          ) : (
            'Reorder Same Medicines'
          )}
        </button>
      )}
    </div>
  );
};

export default OrderDetailPage;
