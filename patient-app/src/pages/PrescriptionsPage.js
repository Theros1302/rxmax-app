import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FileText, X } from 'lucide-react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';

const PrescriptionsPage = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  useEffect(() => {
    const loadPrescriptions = async () => {
      try {
        const data = await api.listPrescriptions();
        setPrescriptions(data.reverse());
      } catch (error) {
        console.error('Error loading prescriptions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPrescriptions();
  }, []);

  if (loading) {
    return (
      <div className="page">
        <div className="header">
          <h1>My Prescriptions</h1>
          <p className="header-subtitle">Prescription history</p>
        </div>
        <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
          <p>Loading prescriptions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="header">
        <h1>My Prescriptions</h1>
        <p className="header-subtitle">Prescription history</p>
      </div>

      {prescriptions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h3>No prescriptions yet</h3>
          <p>Upload your first prescription to get started</p>
          <Link to="/upload" className="btn btn-primary">
            <Plus size={18} />
            Upload Prescription
          </Link>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '1.5rem' }}>
            <Link
              to="/upload"
              className="btn btn-primary btn-block"
              style={{ textAlign: 'center' }}
            >
              <Plus size={18} />
              Upload New Prescription
            </Link>
          </div>

          <div className="section-title">All Prescriptions</div>
          {prescriptions.map(prescription => (
            <div
              key={prescription.id}
              className="card card-clickable"
              onClick={() => setSelectedPrescription(prescription)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div style={{ flex: 1 }}>
                  <p className="card-title" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <FileText size={18} />
                    {prescription.doctorName}
                  </p>
                  <p className="card-subtitle">{prescription.hospitalName}</p>
                </div>
                <StatusBadge status={prescription.status} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <span>{prescription.medicines.length} medicine{prescription.medicines.length !== 1 ? 's' : ''}</span>
                <span>{new Date(prescription.date).toLocaleDateString('en-IN')}</span>
              </div>
            </div>
          ))}
        </>
      )}

      {/* Prescription Detail Modal */}
      {selectedPrescription && (
        <div className="modal-overlay" onClick={() => setSelectedPrescription(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Prescription Details</h2>
              <button
                className="modal-close"
                onClick={() => setSelectedPrescription(null)}
              >
                <X size={24} />
              </button>
            </div>

            {selectedPrescription.imageUrl && (
              <div style={{
                marginBottom: '1.5rem',
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                <img
                  src={selectedPrescription.imageUrl}
                  alt="Prescription"
                  style={{
                    maxWidth: '100%',
                    display: 'block'
                  }}
                />
              </div>
            )}

            <div className="section-title">Prescription Info</div>
            <div className="card">
              <div style={{ marginBottom: '0.75rem' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', margin: 0 }}>Doctor</p>
                <p style={{ fontWeight: '600', margin: '0.25rem 0 0.75rem 0' }}>
                  {selectedPrescription.doctorName}
                </p>
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', margin: 0 }}>Hospital</p>
                <p style={{ fontWeight: '600', margin: '0.25rem 0 0.75rem 0' }}>
                  {selectedPrescription.hospitalName}
                </p>
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', margin: 0 }}>Date</p>
                <p style={{ fontWeight: '600', margin: '0.25rem 0 0.75rem 0' }}>
                  {new Date(selectedPrescription.date).toLocaleDateString('en-IN')}
                </p>
              </div>

              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', margin: 0 }}>Status</p>
                <div style={{ marginTop: '0.25rem' }}>
                  <StatusBadge status={selectedPrescription.status} />
                </div>
              </div>
            </div>

            <div className="section-title">Medicines</div>
            {selectedPrescription.medicines.map(medicine => (
              <div key={medicine.id} className="card">
                <p className="card-title">{medicine.name}</p>
                <p className="card-subtitle">{medicine.dosage}</p>
                <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong>Quantity:</strong> {medicine.quantity}
                  </div>
                  <div>
                    <strong>Instruction:</strong> {medicine.instruction}
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={() => setSelectedPrescription(null)}
              className="btn btn-secondary btn-block"
              style={{ marginTop: '1.5rem' }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrescriptionsPage;
