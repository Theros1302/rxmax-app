import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { api } from '../services/api';

function StoresPage() {
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStores = async () => {
      const data = await api.getAllStores();
      setStores(data);
      setLoading(false);
    };
    loadStores();
  }, []);

  if (loading) {
    return <div className="app-header"><h1>Loading...</h1></div>;
  }

  const cities = [...new Set(stores.map(s => s.city))];
  const plans = [...new Set(stores.map(s => s.plan))];

  const columns = [
    { key: 'name', label: 'Store Name' },
    { key: 'owner', label: 'Owner' },
    { key: 'city', label: 'City' },
    {
      key: 'plan',
      label: 'Plan',
      render: (value) => (
        <span className={`plan-badge plan-${value.toLowerCase()}`}>{value}</span>
      ),
    },
    {
      key: 'patients',
      label: 'Patients',
      render: (value) => <span>{value.toLocaleString('en-IN')}</span>,
    },
    {
      key: 'orders',
      label: 'Orders',
      render: (value) => <span>{value.toLocaleString('en-IN')}</span>,
    },
    {
      key: 'revenue',
      label: 'Revenue (₹L)',
      render: (value) => <span>{value.toFixed(1)}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <StatusBadge type={value.toLowerCase()} text={value} />
      ),
    },
    {
      key: 'verified',
      label: 'Verified',
      render: (value) => (
        <StatusBadge type={value ? 'verified' : 'unverified'} text={value ? 'Yes' : 'No'} />
      ),
    },
  ];

  return (
    <div>
      <div className="app-header">
        <h1>Stores Management</h1>
        <button className="btn btn-primary">
          <Plus size={18} />
          Add Store
        </button>
      </div>

      <div className="app-content">
        <DataTable
          title={`Total Stores: ${stores.length}`}
          data={stores}
          columns={columns}
          onRowClick={(row) => navigate(`/stores/${row.id}`)}
          searchableFields={['name', 'owner', 'city']}
          filterField="city"
          filterOptions={cities}
        />
      </div>
    </div>
  );
}

export default StoresPage;
