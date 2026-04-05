import React, { useState, useEffect } from 'react';
import DataTable from '../components/DataTable';
import { api } from '../services/api';
import { CheckCircle, Clock, Eye } from 'lucide-react';

function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPrescriptions();
  }, []);

  const loadPrescriptions = async () => {
    try {
      const data = await api.getPrescriptions();
      setPrescriptions(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading prescriptions:', error);
      setLoading(false);
    }
  };

  const getFilteredPrescriptions = () => {
    if (activeTab === 'all') return prescriptions;
    return prescriptions.filter(p => p.status === activeTab);
  };

  const handleReview = async (rxId) => {
    await api.reviewPrescription(rxId);
    setPrescriptions(prescriptions.map(p =>
      p.id === rxId ? { ...p, status: 'reviewed' } : p
    ));
  };

  const prescriptionColumns = [
    { key: 'id', label: 'Rx ID', sortable: true },
    { key: 'patientName', label: 'Patient', sortable: true },
    {
      key: 'medicines',
      label: 'Medicines',
      sortable: false,
      render: (medicines) => medicines.slice(0, 2).join(', ') + (medicines.length > 2 ? '...' : '')
    },
    {
      key: 'submittedDate',
      label: 'Submitted',
      sortable: true,
      render: (date) => new Date(date).toLocaleDateString('en-IN')
    },
    { key: 'doctorName', label: 'Doctor', sortable: true },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (status) => (
        <span className={`badge badge-${status === 'reviewed' ? 'success' : 'warning'}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      )
    },
    {
      key: 'id',
      label: 'Actions',
      sortable: false,
      render: (val, row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          {row.status === 'pending' && (
            <button
              className="btn btn-small btn-success"
              onClick={(e) => {
                e.stopPropagation();
                handleReview(row.id);
              }}
            >
              <CheckCircle size={14} /> Review
            </button>
          )}
          <button className="btn btn-small btn-outline">
            <Eye size={14} /> View
          </button>
        </div>
      )
    }
  ];

  const filteredPrescriptions = getFilteredPrescriptions();
  const statusCounts = {
    all: prescriptions.length,
    pending: prescriptions.filter(p => p.status === 'pending').length,
    reviewed: prescriptions.filter(p => p.status === 'reviewed').length
  };

  if (loading) {
    return (
      <div className="page-container">
        <p style={{ textAlign: 'center', padding: '40px' }}>Loading prescriptions...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Prescriptions</h1>
        <p className="page-subtitle">Manage and review patient prescriptions</p>
      </div>

      <div className="tabs">
        {['all', 'pending', 'reviewed'].map(tab => (
          <button
            key={tab}
            className={`tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            <span style={{ marginLeft: '8px', fontSize: '12px', opacity: 0.7 }}>
              ({statusCounts[tab]})
            </span>
          </button>
        ))}
      </div>

      <DataTable
        columns={prescriptionColumns}
        data={filteredPrescriptions}
        searchField="patientName"
      />
    </div>
  );
}

export default PrescriptionsPage;
