import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle, Package, Truck, Clock } from 'lucide-react';
import StatCard from '../components/StatCard';
import { api } from '../services/api';

function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    try {
      const data = await api.getOrderById(id);
      setOrder(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading order:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <p style={{ textAlign: 'center', padding: '40px' }}>Loading order...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="page-container">
        <p style={{ textAlign: 'center', padding: '40px' }}>Order not found</p>
      </div>
    );
  }

  const statusSteps = ['pending', 'confirmed', 'preparing', 'ready', 'delivered'];
  const currentStepIndex = statusSteps.indexOf(order.status);

  const handleStatusUpdate = async (newStatus) => {
    await api.updateOrderStatus(order.id, newStatus);
    setOrder({ ...order, status: newStatus });
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <button className="btn btn-outline btn-small" onClick={() => navigate('/orders')}>
          <ChevronLeft size={16} /> Back
        </button>
        <h1 className="page-title" style={{ margin: 0 }}>Order {order.id}</h1>
      </div>

      {/* Timeline */}
      <div className="card" style={{ marginBottom: '32px' }}>
        <h3 className="card-title">Order Status Timeline</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0', margin: '32px 0' }}>
          {statusSteps.map((step, idx) => {
            const isCompleted = idx <= currentStepIndex;
            const isActive = idx === currentStepIndex;
            const icons = {
              pending: Clock,
              confirmed: CheckCircle,
              preparing: Package,
              ready: CheckCircle,
              delivered: Truck
            };
            const Icon = icons[step];

            return (
              <div key={step} style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: isCompleted ? (isActive ? 'var(--primary)' : 'var(--success)') : 'var(--border-gray)',
                    border: '3px solid white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isCompleted ? 'white' : 'var(--text-light)',
                    fontSize: '18px',
                    zIndex: 2,
                    position: 'relative'
                  }}
                >
                  <Icon size={20} />
                </div>
                {idx < statusSteps.length - 1 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '20px',
                      left: '50%',
                      right: '-50%',
                      height: '3px',
                      backgroundColor: isCompleted ? 'var(--success)' : 'var(--border-gray)',
                      zIndex: 1
                    }}
                  />
                )}
                <p style={{ fontSize: '12px', fontWeight: '500', marginTop: '12px', textAlign: 'center' }}>
                  {step.charAt(0).toUpperCase() + step.slice(1)}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Order Info Grid */}
      <div className="grid grid-2" style={{ marginBottom: '32px' }}>
        <div className="card">
          <h3 className="card-title">Patient Information</h3>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <p style={{ fontSize: '12px', color: 'var(--text-light)', marginBottom: '4px' }}>Name</p>
              <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-dark)' }}>{order.patientName}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: 'var(--text-light)', marginBottom: '4px' }}>Phone</p>
              <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-dark)' }}>{order.patientPhone}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: 'var(--text-light)', marginBottom: '4px' }}>Delivery Address</p>
              <p style={{ fontSize: '14px', color: 'var(--text-dark)' }}>{order.deliveryAddress}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Order Details</h3>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <p style={{ fontSize: '12px', color: 'var(--text-light)', marginBottom: '4px' }}>Order Date</p>
              <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-dark)' }}>
                {new Date(order.createdAt).toLocaleDateString('en-IN')}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: 'var(--text-light)', marginBottom: '4px' }}>Status</p>
              <span className={`badge badge-${order.status === 'delivered' ? 'success' : order.status === 'pending' ? 'warning' : 'info'}`}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: 'var(--text-light)', marginBottom: '4px' }}>Payment Status</p>
              <span className="badge badge-success">{order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="card" style={{ marginBottom: '32px' }}>
        <h3 className="card-title">Order Items</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Medicine</th>
                <th style={{ textAlign: 'right' }}>Quantity</th>
                <th style={{ textAlign: 'right' }}>Price</th>
                <th style={{ textAlign: 'right' }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.name}</td>
                  <td style={{ textAlign: 'right' }}>{item.quantity}</td>
                  <td style={{ textAlign: 'right' }}>₹{item.price}</td>
                  <td style={{ textAlign: 'right', fontWeight: '600' }}>₹{(item.quantity * item.price).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ borderTop: '2px solid var(--border-gray)', marginTop: '16px', paddingTop: '16px', textAlign: 'right' }}>
          <p style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-dark)' }}>
            Total: ₹{order.totalAmount.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      {order.status !== 'delivered' && (
        <div className="card">
          <h3 className="card-title">Actions</h3>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {order.status === 'pending' && (
              <button className="btn btn-success" onClick={() => handleStatusUpdate('confirmed')}>
                <CheckCircle size={16} /> Confirm Order
              </button>
            )}
            {order.status === 'confirmed' && (
              <button className="btn btn-secondary" onClick={() => handleStatusUpdate('preparing')}>
                <Package size={16} /> Start Preparation
              </button>
            )}
            {order.status === 'preparing' && (
              <button className="btn btn-success" onClick={() => handleStatusUpdate('ready')}>
                <CheckCircle size={16} /> Mark Ready
              </button>
            )}
            {order.status === 'ready' && (
              <button className="btn btn-primary" onClick={() => handleStatusUpdate('delivered')}>
                <Truck size={16} /> Deliver
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderDetailPage;
