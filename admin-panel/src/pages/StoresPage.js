import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X } from 'lucide-react';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { api } from '../services/api';

function StoresPage() {
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addError, setAddError] = useState('');
  const [createdStore, setCreatedStore] = useState(null);
  const [newStore, setNewStore] = useState({
    name: '', owner_name: '', phone: '', email: '',
    password: '', address: '', city: '', state: '', pincode: '',
    license_number: '', gst_number: '',
  });

  useEffect(() => {
    const loadStores = async () => {
      const data = await api.getAllStores();
      setStores(data);
      setLoading(false);
    };
    loadStores();
  }, []);

  const handleAddStore = async (e) => {
    e.preventDefault();
    setSaving(true);
    setAddError('');
    try {
      const result = await api.createStore(newStore);
      if (result.error) {
        setAddError(result.error);
      } else {
        setShowAddModal(false);
        setNewStore({ name: '', owner_name: '', phone: '', email: '', password: '', address: '', city: '', state: '', pincode: '', license_number: '', gst_number: '' });
        // Show success with store details
        setCreatedStore({
          id: result.id || result.store_id || 'N/A',
          name: result.name || newStore.name,
          slug: result.slug || '',
          patientLink: 'https://rxmax-patient-app.vercel.app/store/' + ((result.slug ? result.slug : result.id) || ''),
          storeLink: 'https://rxmax-store-dashboard.vercel.app',
        });
        // Reload stores
        const data = await api.getAllStores();
        setStores(data);
      }
    } catch (err) {
      setAddError(err.message || 'Failed to create store');
    }
    setSaving(false);
  };

  const handleInputChange = (field, value) => {
    setNewStore(prev => ({ ...prev, [field]: value }));
  };

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
      label: 'Revenue (â¹L)',
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
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
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

      {/* Add Store Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Store</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddStore}>
              {addError && <div className="alert alert-error">{addError}</div>}
              <div className="form-grid">
                <div className="form-group">
                  <label>Store Name *</label>
                  <input type="text" required value={newStore.name}
                    onChange={e => handleInputChange('name', e.target.value)}
                    placeholder="e.g. Apollo Pharmacy" />
                </div>
                <div className="form-group">
                  <label>Owner Name *</label>
                  <input type="text" required value={newStore.owner_name}
                    onChange={e => handleInputChange('owner_name', e.target.value)}
                    placeholder="e.g. Rajesh Kumar" />
                </div>
                <div className="form-group">
                  <label>Phone *</label>
                  <input type="tel" required value={newStore.phone}
                    onChange={e => handleInputChange('phone', e.target.value)}
                    placeholder="10-digit mobile number" />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={newStore.email}
                    onChange={e => handleInputChange('email', e.target.value)}
                    placeholder="store@example.com" />
                </div>
                <div className="form-group">
                  <label>Password *</label>
                  <input type="password" required minLength={8} value={newStore.password}
                    onChange={e => handleInputChange('password', e.target.value)}
                    placeholder="Min 8 characters" />
                </div>
                <div className="form-group">
                  <label>Address *</label>
                  <input type="text" required value={newStore.address}
                    onChange={e => handleInputChange('address', e.target.value)}
                    placeholder="Full address" />
                </div>
                <div className="form-group">
                  <label>City *</label>
                  <input type="text" required value={newStore.city}
                    onChange={e => handleInputChange('city', e.target.value)}
                    placeholder="e.g. Mumbai" />
                </div>
                <div className="form-group">
                  <label>State *</label>
                  <input type="text" required value={newStore.state}
                    onChange={e => handleInputChange('state', e.target.value)}
                    placeholder="e.g. Maharashtra" />
                </div>
                <div className="form-group">
                  <label>Pincode *</label>
                  <input type="text" required value={newStore.pincode}
                    onChange={e => handleInputChange('pincode', e.target.value)}
                    placeholder="6-digit pincode" />
                </div>
                <div className="form-group">
                  <label>Drug License Number</label>
                  <input type="text" value={newStore.license_number}
                    onChange={e => handleInputChange('license_number', e.target.value)}
                    placeholder="Optional" />
                </div>
                <div className="form-group">
                  <label>GST Number</label>
                  <input type="text" value={newStore.gst_number}
                    onChange={e => handleInputChange('gst_number', e.target.value)}
                    placeholder="Optional" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Creating...' : 'Create Store'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Store Created Success Modal */}
      {createdStore && (
        <div className="modal-overlay" onClick={() => setCreatedStore(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Store Created Successfully!</h2>
              <button className="modal-close" onClick={() => setCreatedStore(null)}>
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '24px' }}>
              <div className="alert alert-success">Store has been registered and is ready to use.</div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Store Name</label>
                <p style={{ color: '#f1f5f9', fontSize: '16px', fontWeight: 600, margin: '4px 0 0' }}>{createdStore.name}</p>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Store ID</label>
                <p style={{ color: '#f1f5f9', fontSize: '16px', fontWeight: 600, margin: '4px 0 0', fontFamily: 'monospace' }}>{createdStore.id}</p>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Patient App Link</label>
                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '12px', marginTop: '4px', wordBreak: 'break-all' }}>
                  <a href={createdStore.patientLink} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', textDecoration: 'none' }}>{createdStore.patientLink}</a>
                </div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Store Dashboard</label>
                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '12px', marginTop: '4px' }}>
                  <a href={createdStore.storeLink} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', textDecoration: 'none' }}>{createdStore.storeLink}</a>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-primary" onClick={() => setCreatedStore(null)}>Done</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StoresPage;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X } from 'lucide-react';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { api } from '../services/api';

function StoresPage() {
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addError, setAddError] = useState('');
  const [newStore, setNewStore] = useState({
    name: '', owner_name: '', phone: '', email: '',
    password: '', address: '', city: '', state: '', pincode: '',
    license_number: '', gst_number: '',
  });

  useEffect(() => {
    const loadStores = async () => {
      const data = await api.getAllStores();
      setStores(data);
      setLoading(false);
    };
    loadStores();
  }, []);

  const handleAddStore = async (e) => {
    e.preventDefault();
    setSaving(true);
    setAddError('');
    try {
      const result = await api.createStore(newStore);
      if (result.error) {
        setAddError(result.error);
      } else {
        setShowAddModal(false);
        setNewStore({ name: '', owner_name: '', phone: '', email: '', password: '', address: '', city: '', state: '', pincode: '', license_number: '', gst_number: '' });
        // Reload stores
        const data = await api.getAllStores();
        setStores(data);
      }
    } catch (err) {
      setAddError(err.message || 'Failed to create store');
    }
    setSaving(false);
  };

  const handleInputChange = (field, value) => {
    setNewStore(prev => ({ ...prev, [field]: value }));
  };

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
      label: 'Revenue (â¹L)',
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
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
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

      {/* Add Store Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Store</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddStore}>
              {addError && <div className="alert alert-error">{addError}</div>}
              <div className="form-grid">
                <div className="form-group">
                  <label>Store Name *</label>
                  <input type="text" required value={newStore.name}
                    onChange={e => handleInputChange('name', e.target.value)}
                    placeholder="e.g. Apollo Pharmacy" />
                </div>
                <div className="form-group">
                  <label>Owner Name *</label>
                  <input type="text" required value={newStore.owner_name}
                    onChange={e => handleInputChange('owner_name', e.target.value)}
                    placeholder="e.g. Rajesh Kumar" />
                </div>
                <div className="form-group">
                  <label>Phone *</label>
                  <input type="tel" required value={newStore.phone}
                    onChange={e => handleInputChange('phone', e.target.value)}
                    placeholder="10-digit mobile number" />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={newStore.email}
                    onChange={e => handleInputChange('email', e.target.value)}
                    placeholder="store@example.com" />
                </div>
                <div className="form-group">
                  <label>Password *</label>
                  <input type="password" required minLength={8} value={newStore.password}
                    onChange={e => handleInputChange('password', e.target.value)}
                    placeholder="Min 8 characters" />
                </div>
                <div className="form-group">
                  <label>Address *</label>
                  <input type="text" required value={newStore.address}
                    onChange={e => handleInputChange('address', e.target.value)}
                    placeholder="Full address" />
                </div>
                <div className="form-group">
                  <label>City *</label>
                  <input type="text" required value={newStore.city}
                    onChange={e => handleInputChange('city', e.target.value)}
                    placeholder="e.g. Mumbai" />
                </div>
                <div className="form-group">
                  <label>State *</label>
                  <input type="text" required value={newStore.state}
                    onChange={e => handleInputChange('state', e.target.value)}
                    placeholder="e.g. Maharashtra" />
                </div>
                <div className="form-group">
                  <label>Pincode *</label>
                  <input type="text" required value={newStore.pincode}
                    onChange={e => handleInputChange('pincode', e.target.value)}
                    placeholder="6-digit pincode" />
                </div>
                <div className="form-group">
                  <label>Drug License Number</label>
                  <input type="text" value={newStore.license_number}
                    onChange={e => handleInputChange('license_number', e.target.value)}
                    placeholder="Optional" />
                </div>
                <div className="form-group">
                  <label>GST Number</label>
                  <input type="text" value={newStore.gst_number}
                    onChange={e => handleInputChange('gst_number', e.target.value)}
                    placeholder="Optional" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Creating...' : 'Create Store'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default StoresPage;
