import React, { useState, useEffect } from 'react';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { api } from '../services/api';

function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPatients = async () => {
      const data = await api.getAllPatients();
      setPatients(data);
      setLoading(false);
    };
    loadPatients();
  }, []);

  if (loading) {
    return <div className="app-header"><h1>Loading...</h1></div>;
  }

  const riskLevels = [...new Set(patients.map(p => p.riskLevel))];

  const columns = [
    { key: 'name', label: 'Patient Name' },
    { key: 'phone', label: 'Phone' },
    { key: 'storeName', label: 'Connected Store' },
    {
      key: 'orders',
      label: 'Orders',
      render: (value) => <span>{value}</span>,
    },
    {
      key: 'lifetime',
      label: 'Lifetime Value (₹)',
      render: (value) => <span>{value.toLocaleString('en-IN')}</span>,
    },
    {
      key: 'riskLevel',
      label: 'Risk Level',
      render: (value) => {
        let type = 'low';
        if (value === 'Medium') type = 'pending';
        if (value === 'High') type = 'danger';
        return (
          <StatusBadge type={type} text={value} />
        );
      },
    },
    { key: 'lastActive', label: 'Last Active' },
  ];

  return (
    <div>
      <div className="app-header">
        <h1>Patients Management</h1>
      </div>

      <div className="app-content">
        <DataTable
          title={`Total Patients: ${patients.length}`}
          data={patients}
          columns={columns}
          searchableFields={['name', 'phone', 'storeName']}
          filterField="riskLevel"
          filterOptions={riskLevels}
        />
      </div>
    </div>
  );
}

export default PatientsPage;
