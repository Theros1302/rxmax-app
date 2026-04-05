import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { RotateCw, AlertTriangle, Clock, Calendar } from 'lucide-react';
import api from '../services/api';

const RefillsPage = () => {
  const [refills, setRefills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    const loadRefills = async () => {
      try {
        const data = await api.getUpcomingRefills();
        setRefills(data);
      } catch (error) {
        console.error('Error loading refills:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRefills();
  }, []);

  const handleReorder = async (refillId) => {
    setProcessing(refillId);
    try {
      const order = await api.respondToRefill(refillId, 'reorder');
      window.location.href = `/orders/${order.id}`;
    } catch (error) {
      alert('Failed to reorder: ' + error.message);
      setProcessing(null);
    }
  };

  const handleSnooze = (refillId) => {
    // Remove from display
    setRefills(refills.filter(r => r.id !== refillId));
  };

  const groupedRefills = {
    urgent: refills.filter(r => r.daysRemaining < 3),
    soon: refills.filter(r => r.daysRemaining >= 3 && r.daysRemaining < 7),
    upcoming: refills.filter(r => r.daysRemaining >= 7)
  };

  const getDaysColor = (days) => {
    if (days < 3) return '#E74C3C';
    if (days < 7) return '#F39C12';
    return '#27AE60';
  };

  const getDaysIcon = (days) => {
    if (days < 3) return <AlertTriangle size={18} />;
    if (days < 7) return <Clock size={18} />;
    return <Calendar size={18} />;
  };

  if (loading) {
    return (
      <div className="page">
        <div className="header">
          <h1>Medicine Refills</h1>
          <p className="header-subtitle">Upcoming refill reminders</p>
        </div>
        <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
          <p>Loading refills...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="header">
        <h1>Medicine Refills</h1>
        <p className="header-subtitle">Upcoming refill reminders</p>
      </div>

      {refills.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">💊</div>
          <h3>No refills scheduled</h3>
          <p>All your medicines are stocked up!</p>
          <Link to="/order" className="btn btn-primary">
            Order Medicines
          </Link>
        </div>
      ) : (
        <>
          {groupedRefills.urgent.length > 0 && (
            <>
              <div className="section-title" style={{ color: 'var(--danger)' }}>
                Urgent (Within 3 days)
              </div>
              {groupedRefills.urgent.map(refill => (
                <div key={refill.id} className="card" style={{ borderLeft: `4px solid var(--danger)` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div style={{ flex: 1 }}>
                      <p className="card-title">{refill.medicineName}</p>
                      <p className="card-subtitle">{refill.dosage}</p>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      background: getDaysColor(refill.daysRemaining),
                      color: 'white',
                      padding: '0.35rem 0.75rem',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      whiteSpace: 'nowrap'
                    }}>
                      {getDaysIcon(refill.daysRemaining)}
                      {refill.daysRemaining} days
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Qty: <strong>{refill.quantity}</strong> • Price: <strong>₹{refill.price}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleReorder(refill.id)}
                      className="btn btn-primary"
                      style={{ flex: 1, fontSize: '0.85rem', padding: '0.5rem' }}
                      disabled={processing === refill.id}
                    >
                      {processing === refill.id ? (
                        <>
                          <span className="spinner"></span>
                          Ordering...
                        </>
                      ) : (
                        <>
                          <RotateCw size={16} />
                          Reorder
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleSnooze(refill.id)}
                      className="btn btn-secondary"
                      style={{ flex: 1, fontSize: '0.85rem', padding: '0.5rem' }}
                    >
                      Snooze
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}

          {groupedRefills.soon.length > 0 && (
            <>
              <div className="section-title" style={{ color: 'var(--warning)' }}>
                Soon (3-7 days)
              </div>
              {groupedRefills.soon.map(refill => (
                <div key={refill.id} className="card" style={{ borderLeft: `4px solid var(--warning)` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div style={{ flex: 1 }}>
                      <p className="card-title">{refill.medicineName}</p>
                      <p className="card-subtitle">{refill.dosage}</p>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      background: getDaysColor(refill.daysRemaining),
                      color: 'white',
                      padding: '0.35rem 0.75rem',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      whiteSpace: 'nowrap'
                    }}>
                      {getDaysIcon(refill.daysRemaining)}
                      {refill.daysRemaining} days
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Qty: <strong>{refill.quantity}</strong> • Price: <strong>₹{refill.price}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleReorder(refill.id)}
                      className="btn btn-secondary"
                      style={{ flex: 1, fontSize: '0.85rem', padding: '0.5rem' }}
                      disabled={processing === refill.id}
                    >
                      {processing === refill.id ? (
                        <>
                          <span className="spinner"></span>
                          Ordering...
                        </>
                      ) : (
                        <>
                          <RotateCw size={16} />
                          Reorder
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleSnooze(refill.id)}
                      className="btn btn-secondary"
                      style={{ flex: 1, fontSize: '0.85rem', padding: '0.5rem' }}
                    >
                      Snooze
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}

          {groupedRefills.upcoming.length > 0 && (
            <>
              <div className="section-title" style={{ color: 'var(--success)' }}>
                Upcoming (7+ days)
              </div>
              {groupedRefills.upcoming.map(refill => (
                <div key={refill.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div style={{ flex: 1 }}>
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

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Qty: <strong>{refill.quantity}</strong> • Price: <strong>₹{refill.price}</strong>
                    </div>
                  </div>

                  <button
                    onClick={() => handleReorder(refill.id)}
                    className="btn btn-secondary"
                    style={{ width: '100%', fontSize: '0.85rem', padding: '0.5rem' }}
                    disabled={processing === refill.id}
                  >
                    {processing === refill.id ? (
                      <>
                        <span className="spinner"></span>
                        Ordering...
                      </>
                    ) : (
                      <>
                        <RotateCw size={16} />
                        Reorder
                      </>
                    )}
                  </button>
                </div>
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default RefillsPage;
