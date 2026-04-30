import React, { useState, useEffect } from 'react';
import DataTable from '../components/DataTable';
import { api } from '../services/api';
import { CheckCircle, Eye, X } from 'lucide-react';
import { notify } from '../components/Toast';

function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [viewingRx, setViewingRx] = useState(null);

  useEffect(() => { loadPrescriptions(); }, []);

  const loadPrescriptions = async () => {
    try {
      const data = await api.getPrescriptions();
      setPrescriptions(data);
    } catch (error) {
      notify.error(`Couldn't load prescriptions: ${error.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredPrescriptions = () => {
    if (activeTab === 'all') return prescriptions;
    return prescriptions.filter(p => (p.status || p.ocr_status) === activeTab);
  };

  const handleReview = async (rxId, e) => {
    if (e) e.stopPropagation();
    try {
      await api.reviewPrescription(rxId);
      notify.success('Prescription reviewed');
      setPrescriptions(prescriptions.map(p => p.id === rxId ? { ...p, status: 'verified', ocr_status: 'verified' } : p));
      if (viewingRx?.id === rxId) setViewingRx({ ...viewingRx, status: 'verified' });
    } catch (err) {
      notify.error(`Review failed: ${err.message || err}`);
    }
  };

  const handleView = async (row, e) => {
    if (e) e.stopPropagation();
    try {
      // If we already have full details, use them; otherwise fetch
      const full = row.medicines ? row : await api.getPrescriptionById(row.id);
      setViewingRx(full);
    } catch (err) {
      notify.error(`Couldn't load Rx details: ${err.message || err}`);
    }
  };

  const prescriptionColumns = [
    { key: 'id', label: 'Rx ID', sortable: true, render: (id) => String(id).slice(0, 8) + '…' },
    { key: 'patientName', label: 'Patient', sortable: true, render: (n, r) => n || r.patient_name || '—' },
    {
      key: 'medicines',
      label: 'Medicines',
      sortable: false,
      render: (medicines, row) => {
        const list = Array.isArray(medicines) ? medicines : (row.items || []);
        const names = list.map(m => typeof m === 'string' ? m : (m.medicine_name || m.medicineName || m.name)).filter(Boolean);
        return names.slice(0, 2).join(', ') + (names.length > 2 ? '...' : '');
      }
    },
    {
      key: 'submittedDate',
      label: 'Submitted',
      sortable: true,
      render: (date, r) => {
        const d = date || r.created_at;
        return d ? new Date(d).toLocaleDateString('en-IN') : '—';
      }
    },
    { key: 'doctorName', label: 'Doctor', sortable: true, render: (n, r) => n || r.doctor_name || '—' },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (status, row) => {
        const s = status || row.ocr_status || 'pending';
        const cls = (s === 'reviewed' || s === 'verified' || s === 'completed') ? 'success' : 'warning';
        return <span className={`badge badge-${cls}`}>{s.charAt(0).toUpperCase() + s.slice(1)}</span>;
      }
    },
    {
      key: 'id',
      label: 'Actions',
      sortable: false,
      render: (_, row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          {(row.status === 'pending' || row.ocr_status === 'pending' || !row.status) && (
            <button className="btn btn-small btn-success" onClick={(e) => handleReview(row.id, e)}>
              <CheckCircle size={14} /> Review
            </button>
          )}
          <button className="btn btn-small btn-outline" onClick={(e) => handleView(row, e)}>
            <Eye size={14} /> View
          </button>
        </div>
      )
    }
  ];

  const filteredPrescriptions = getFilteredPrescriptions();
  const statusCounts = {
    all: prescriptions.length,
    pending: prescriptions.filter(p => (p.status || p.ocr_status) === 'pending' || !p.status).length,
    reviewed: prescriptions.filter(p => ['reviewed', 'verified', 'completed'].includes(p.status || p.ocr_status)).length
  };

  if (loading) {
    return <div className="page-container"><p style={{ textAlign: 'center', padding: '40px' }}>Loading prescriptions...</p></div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Prescriptions</h1>
        <p className="page-subtitle">Manage and review patient prescriptions</p>
      </div>

      <div className="tabs">
        {['all', 'pending', 'reviewed'].map(tab => (
          <button key={tab} className={`tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            <span style={{ marginLeft: '8px', fontSize: '12px', opacity: 0.7 }}>({statusCounts[tab]})</span>
          </button>
        ))}
      </div>

      <DataTable
        columns={prescriptionColumns}
        data={filteredPrescriptions}
        searchField="patientName"
        onRowClick={(row) => handleView(row)}
      />

      {viewingRx && (
        <div onClick={() => setViewingRx(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 8, width: 'min(720px, 100%)', maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>Prescription details</h2>
              <button onClick={() => setViewingRx(null)} style={{ background: 'none', border: 0, cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <KV label="Patient" value={viewingRx.patientName || viewingRx.patient_name || '—'} />
                <KV label="Doctor" value={viewingRx.doctorName || viewingRx.doctor_name || '—'} />
                <KV label="Hospital" value={viewingRx.hospitalName || viewingRx.hospital_name || '—'} />
                <KV label="Date" value={viewingRx.submittedDate || viewingRx.created_at ? new Date(viewingRx.submittedDate || viewingRx.created_at).toLocaleDateString('en-IN') : '—'} />
                <KV label="Diagnosis" value={viewingRx.diagnosis || '—'} />
                <KV label="Status" value={viewingRx.status || viewingRx.ocr_status || 'pending'} />
              </div>
              {(viewingRx.image_url || viewingRx.imageUrl) && (
                <div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>Prescription image</div>
                  <img src={viewingRx.image_url || viewingRx.imageUrl} alt="Prescription"
                    style={{ maxWidth: '100%', maxHeight: 400, borderRadius: 6, border: '1px solid #e5e7eb' }}
                    onError={(e) => { e.target.style.display = 'none'; }} />
                </div>
              )}
              <div>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>Medicines</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                      <th style={{ padding: 8 }}>Medicine</th>
                      <th style={{ padding: 8 }}>Dosage</th>
                      <th style={{ padding: 8 }}>Frequency</th>
                      <th style={{ padding: 8 }}>Duration</th>
                      <th style={{ padding: 8 }}>Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(viewingRx.medicines || viewingRx.items || []).map((m, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: 8 }}>{m.medicine_name || m.medicineName || m.name || (typeof m === 'string' ? m : '—')}</td>
                        <td style={{ padding: 8 }}>{m.dosage || '—'}</td>
                        <td style={{ padding: 8 }}>{m.frequency || '—'}</td>
                        <td style={{ padding: 8 }}>{m.duration_days ? `${m.duration_days}d` : (m.duration || '—')}</td>
                        <td style={{ padding: 8 }}>{m.quantity || '—'}</td>
                      </tr>
                    ))}
                    {(!viewingRx.medicines || viewingRx.medicines.length === 0) && (!viewingRx.items || viewingRx.items.length === 0) && (
                      <tr><td colSpan={5} style={{ padding: 12, textAlign: 'center', color: '#9ca3af' }}>No medicines extracted</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div style={{ padding: 16, borderTop: '1px solid #e5e7eb', display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              {(viewingRx.status === 'pending' || viewingRx.ocr_status === 'pending') && (
                <button className="btn btn-success" onClick={() => handleReview(viewingRx.id)}>
                  <CheckCircle size={16} /> Mark Reviewed
                </button>
              )}
              <button className="btn btn-secondary" onClick={() => setViewingRx(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const KV = ({ label, value }) => (
  <div>
    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>{label}</div>
    <div style={{ fontSize: 14, color: '#111827' }}>{value}</div>
  </div>
);

export default PrescriptionsPage;
