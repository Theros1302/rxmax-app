import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Send, X } from 'lucide-react';
import DataTable from '../components/DataTable';
import { api } from '../services/api';
import { notify } from '../components/Toast';

function PatientsPage() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [riskFilter, setRiskFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sendingReminderFor, setSendingReminderFor] = useState(null);
  const [newPatient, setNewPatient] = useState({ phone: '', name: '', email: '', address: '', city: '', pincode: '' });

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [patients, riskFilter]);

  const loadPatients = async () => {
    try {
      const data = await api.getPatients();
      setPatients(data);
    } catch (error) {
      notify.error(`Couldn't load patients: ${error.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = patients;
    if (riskFilter !== 'all') {
      filtered = filtered.filter(p => p.riskLevel === riskFilter || p.risk_level === riskFilter);
    }
    setFilteredPatients(filtered);
  };

  const handleAddPatient = async (e) => {
    e.preventDefault();
    if (!newPatient.phone || !newPatient.name) {
      notify.error('Phone and name are required');
      return;
    }
    setSaving(true);
    try {
      await api.addPatient(newPatient);
      notify.success(`Added ${newPatient.name}`);
      setShowAddModal(false);
      setNewPatient({ phone: '', name: '', email: '', address: '', city: '', pincode: '' });
      const data = await api.getPatients();
      setPatients(data);
    } catch (err) {
      notify.error(`Couldn't add patient: ${err.message || err}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSendReminder = async (patient, e) => {
    if (e) e.stopPropagation();
    setSendingReminderFor(patient.id);
    try {
      const refills = await api.getRefills();
      const matching = (refills || []).find(r => r.patient_id === patient.patient_id || r.patient_id === patient.id);
      if (matching) {
        await api.sendRefillReminder(matching.id);
        notify.success(`Reminder sent to ${patient.name}`);
      } else {
        notify.info(`No active refill due for ${patient.name} — nothing to remind`);
      }
    } catch (err) {
      notify.error(`Reminder failed: ${err.message || err}`);
    } finally {
      setSendingReminderFor(null);
    }
  };

  const getRiskColor = (level) => ({ low: 'success', medium: 'warning', high: 'danger', normal: 'success', at_risk: 'warning', lapsed: 'danger' }[level] || 'primary');

  const patientTableColumns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'phone', label: 'Phone', sortable: true },
    {
      key: 'conditions',
      label: 'Conditions',
      sortable: false,
      render: (conditions) => Array.isArray(conditions) ? conditions.slice(0, 2).join(', ') : '—'
    },
    {
      key: 'adherenceScore',
      label: 'Adherence',
      sortable: true,
      render: (score, row) => {
        const s = score ?? row.adherence_score ?? 0;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '60px', height: '8px', borderRadius: '4px', backgroundColor: 'var(--border-gray)', overflow: 'hidden' }}>
              <div style={{ width: `${s}%`, height: '100%', backgroundColor: s >= 80 ? 'var(--success)' : s >= 60 ? 'var(--warning)' : 'var(--danger)' }} />
            </div>
            <span style={{ fontSize: '12px', fontWeight: '600' }}>{s}%</span>
          </div>
        );
      }
    },
    {
      key: 'lifetimeValue',
      label: 'Lifetime Value',
      sortable: true,
      render: (val, row) => `₹${(val ?? row.lifetime_value ?? 0).toLocaleString('en-IN')}`
    },
    {
      key: 'riskLevel',
      label: 'Risk Level',
      sortable: true,
      render: (level, row) => {
        const lvl = level || row.risk_level || 'normal';
        return (
          <span className={`badge badge-${getRiskColor(lvl)}`}>
            {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
          </span>
        );
      }
    },
    {
      key: 'lastOrderDate',
      label: 'Last Order',
      sortable: true,
      render: (date, row) => {
        const d = date || row.last_order_at;
        return d ? new Date(d).toLocaleDateString('en-IN') : '—';
      }
    },
    {
      key: 'id',
      label: 'Action',
      sortable: false,
      render: (_, row) => (
        <button
          className="btn btn-secondary"
          style={{ fontSize: 12, padding: '4px 10px' }}
          onClick={(e) => handleSendReminder(row, e)}
          disabled={sendingReminderFor === row.id}>
          <Send size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
          {sendingReminderFor === row.id ? 'Sending…' : 'Remind'}
        </button>
      )
    }
  ];

  if (loading) {
    return (
      <div className="page-container">
        <p style={{ textAlign: 'center', padding: '40px' }}>Loading patients...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <h1 className="page-title">Patients</h1>
          <p className="page-subtitle">Manage your patient database and CRM</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={16} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Add Patient
        </button>
      </div>

      <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {['all', 'low', 'medium', 'high'].map(level => (
          <button
            key={level}
            className={`btn ${riskFilter === level ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setRiskFilter(level)}
            style={{ fontSize: '13px' }}>
            {level === 'all' ? 'All Patients' : `${level.charAt(0).toUpperCase() + level.slice(1)} Risk`}
            {' '}
            ({patients.filter(p => level === 'all' || p.riskLevel === level || p.risk_level === level).length})
          </button>
        ))}
      </div>

      <DataTable
        columns={patientTableColumns}
        data={filteredPatients}
        searchField="name"
        onRowClick={(row) => navigate(`/patients/${row.id}`)}
      />

      {showAddModal && (
        <div onClick={() => setShowAddModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 8, width: 'min(560px, 92vw)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>Add a new patient</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 0, cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddPatient} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Field label="Phone (10-digit) *">
                <input value={newPatient.phone}
                  onChange={e => setNewPatient({ ...newPatient, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  placeholder="e.g. 9876543210" required />
              </Field>
              <Field label="Full name *">
                <input value={newPatient.name}
                  onChange={e => setNewPatient({ ...newPatient, name: e.target.value })}
                  placeholder="e.g. Rajesh Kumar" required />
              </Field>
              <Field label="Email">
                <input type="email" value={newPatient.email}
                  onChange={e => setNewPatient({ ...newPatient, email: e.target.value })} />
              </Field>
              <Field label="Address">
                <input value={newPatient.address}
                  onChange={e => setNewPatient({ ...newPatient, address: e.target.value })} />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                <Field label="City">
                  <input value={newPatient.city}
                    onChange={e => setNewPatient({ ...newPatient, city: e.target.value })} />
                </Field>
                <Field label="Pincode">
                  <input value={newPatient.pincode}
                    onChange={e => setNewPatient({ ...newPatient, pincode: e.target.value })} maxLength={6} />
                </Field>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Add patient'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const Field = ({ label, children }) => (
  <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: '#374151' }}>
    <span>{label}</span>
    {children}
  </label>
);

export default PatientsPage;
