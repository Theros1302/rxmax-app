import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../components/DataTable';
import { api } from '../services/api';

function PatientsPage() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [riskFilter, setRiskFilter] = useState('all');
  const [loading, setLoading] = useState(true);

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
      setLoading(false);
    } catch (error) {
      console.error('Error loading patients:', error);
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = patients;
    if (riskFilter !== 'all') {
      filtered = filtered.filter(p => p.riskLevel === riskFilter);
    }
    setFilteredPatients(filtered);
  };

  const getRiskColor = (level) => {
    const colors = {
      low: 'success',
      medium: 'warning',
      high: 'danger'
    };
    return colors[level] || 'primary';
  };

  const patientTableColumns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'phone', label: 'Phone', sortable: true },
    {
      key: 'conditions',
      label: 'Conditions',
      sortable: false,
      render: (conditions) => conditions.slice(0, 2).join(', ')
    },
    {
      key: 'adherenceScore',
      label: 'Adherence',
      sortable: true,
      render: (score) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '60px',
            height: '8px',
            borderRadius: '4px',
            backgroundColor: 'var(--border-gray)',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${score}%`,
              height: '100%',
              backgroundColor: score >= 80 ? 'var(--success)' : score >= 60 ? 'var(--warning)' : 'var(--danger)'
            }} />
          </div>
          <span style={{ fontSize: '12px', fontWeight: '600' }}>{score}%</span>
        </div>
      )
    },
    {
      key: 'lifetimeValue',
      label: 'Lifetime Value',
      sortable: true,
      render: (val) => `₹${val.toLocaleString('en-IN')}`
    },
    {
      key: 'riskLevel',
      label: 'Risk Level',
      sortable: true,
      render: (level) => (
        <span className={`badge badge-${getRiskColor(level)}`}>
          {level.charAt(0).toUpperCase() + level.slice(1)}
        </span>
      )
    },
    {
      key: 'lastOrderDate',
      label: 'Last Order',
      sortable: true,
      render: (date) => new Date(date).toLocaleDateString('en-IN')
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
      <div className="page-header">
        <h1 className="page-title">Patients</h1>
        <p className="page-subtitle">Manage your patient database and CRM</p>
      </div>

      <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {['all', 'low', 'medium', 'high'].map(level => (
          <button
            key={level}
            className={`btn ${riskFilter === level ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setRiskFilter(level)}
            style={{ fontSize: '13px' }}
          >
            {level === 'all' ? 'All Patients' : `${level.charAt(0).toUpperCase() + level.slice(1)} Risk`}
            {' '}
            ({patients.filter(p => level === 'all' || p.riskLevel === level).length})
          </button>
        ))}
      </div>

      <DataTable
        columns={patientTableColumns}
        data={filteredPatients}
        searchField="name"
        onRowClick={(row) => navigate(`/patients/${row.id}`)}
      />
    </div>
  );
}

export default PatientsPage;
