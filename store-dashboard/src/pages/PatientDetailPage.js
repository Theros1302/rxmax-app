import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Send, FileText } from 'lucide-react';
import StatCard from '../components/StatCard';
import { api } from '../services/api';

function PatientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    loadPatient();
  }, [id]);

  const loadPatient = async () => {
    try {
      const data = await api.getPatientById(id);
      setPatient(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading patient:', error);
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    try {
      await api.addPatientNote(patient.id, newNote);
      setPatient({
        ...patient,
        notes: [...patient.notes, { date: new Date().toISOString().split('T')[0], text: newNote }]
      });
      setNewNote('');
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <p style={{ textAlign: 'center', padding: '40px' }}>Loading patient...</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="page-container">
        <p style={{ textAlign: 'center', padding: '40px' }}>Patient not found</p>
      </div>
    );
  }

  const getRiskColor = (level) => {
    const colors = { low: 'success', medium: 'warning', high: 'danger' };
    return colors[level] || 'primary';
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <button className="btn btn-outline btn-small" onClick={() => navigate('/patients')}>
          <ChevronLeft size={16} /> Back
        </button>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>{patient.name}</h1>
          <p className="page-subtitle" style={{ margin: 0 }}>{patient.phone}</p>
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-4" style={{ marginBottom: '32px' }}>
        <StatCard
          icon={() => <span style={{ fontSize: '24px' }}>📊</span>}
          label="Adherence Score"
          value={`${patient.adherenceScore}%`}
        />
        <StatCard
          icon={() => <span style={{ fontSize: '24px' }}>💰</span>}
          label="Lifetime Value"
          value={`₹${patient.lifetimeValue.toLocaleString('en-IN')}`}
        />
        <StatCard
          icon={() => <span style={{ fontSize: '24px' }}>🛒</span>}
          label="Total Orders"
          value={patient.totalOrders}
        />
        <StatCard
          icon={() => <span style={{ fontSize: '24px' }}>⚠️</span>}
          label="Risk Level"
          value={patient.riskLevel.charAt(0).toUpperCase() + patient.riskLevel.slice(1)}
        />
      </div>

      {/* Patient Info */}
      <div className="grid grid-2" style={{ marginBottom: '32px' }}>
        <div className="card">
          <h3 className="card-title">Personal Information</h3>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <p style={{ fontSize: '12px', color: 'var(--text-light)', marginBottom: '4px' }}>Email</p>
              <p style={{ fontSize: '14px', color: 'var(--text-dark)' }}>{patient.email}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: 'var(--text-light)', marginBottom: '4px' }}>Date of Birth</p>
              <p style={{ fontSize: '14px', color: 'var(--text-dark)' }}>
                {new Date(patient.dateOfBirth).toLocaleDateString('en-IN')}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: 'var(--text-light)', marginBottom: '4px' }}>Gender</p>
              <p style={{ fontSize: '14px', color: 'var(--text-dark)' }}>{patient.gender}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: 'var(--text-light)', marginBottom: '4px' }}>Member Since</p>
              <p style={{ fontSize: '14px', color: 'var(--text-dark)' }}>
                {new Date(patient.memberSince).toLocaleDateString('en-IN')}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Medical Information</h3>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <p style={{ fontSize: '12px', color: 'var(--text-light)', marginBottom: '8px' }}>Conditions</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {patient.conditions.map((condition, idx) => (
                  <span key={idx} className="badge badge-info">{condition}</span>
                ))}
              </div>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: 'var(--text-light)', marginBottom: '8px' }}>Allergies</p>
              {patient.allergies.length > 0 ? (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {patient.allergies.map((allergy, idx) => (
                    <span key={idx} className="badge badge-danger">{allergy}</span>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '14px', color: 'var(--text-dark)' }}>No known allergies</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Medications */}
      {patient.medications && patient.medications.length > 0 && (
        <div className="card" style={{ marginBottom: '32px' }}>
          <h3 className="card-title">Current Medications</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Medicine</th>
                  <th style={{ textAlign: 'right' }}>Quantity</th>
                  <th style={{ textAlign: 'right' }}>Refill Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {patient.medications.map((med, idx) => (
                  <tr key={idx}>
                    <td>{med.name}</td>
                    <td style={{ textAlign: 'right' }}>{med.quantity}</td>
                    <td style={{ textAlign: 'right' }}>{new Date(med.refillDate).toLocaleDateString('en-IN')}</td>
                    <td>
                      <span className={`badge badge-${med.status === 'active' ? 'success' : 'warning'}`}>
                        {med.status.charAt(0).toUpperCase() + med.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Private Notes */}
      <div className="card" style={{ marginBottom: '32px' }}>
        <h3 className="card-title">Private Notes</h3>

        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <textarea
              className="form-textarea"
              placeholder="Add a note about this patient..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              style={{ minHeight: '80px' }}
            />
          </div>
          <button
            className="btn btn-primary btn-small"
            onClick={handleAddNote}
            disabled={!newNote.trim()}
          >
            <Plus size={16} /> Add Note
          </button>
        </div>

        {patient.notes && patient.notes.length > 0 && (
          <div style={{ borderTop: '1px solid var(--border-gray)', paddingTop: '16px' }}>
            {patient.notes.map((note, idx) => (
              <div key={idx} style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--border-gray)' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-light)', marginBottom: '4px' }}>
                  {new Date(note.date).toLocaleDateString('en-IN')}
                </p>
                <p style={{ fontSize: '13px', color: 'var(--text-dark)' }}>{note.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="card-title">Quick Actions</h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary">
            <Send size={16} /> Send Reminder
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/orders')}>
            <FileText size={16} /> View Orders
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/prescriptions')}>
            <FileText size={16} /> View Prescriptions
          </button>
        </div>
      </div>
    </div>
  );
}

export default PatientDetailPage;
