import React, { useState, useEffect } from 'react';
import DataTable from '../components/DataTable';
import { api } from '../services/api';
import { Plus, Upload, AlertTriangle, X } from 'lucide-react';
import { notify } from '../components/Toast';

function InventoryPage() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expiryAlerts, setExpiryAlerts] = useState([]);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newItem, setNewItem] = useState({
    medicine_name: '', quantity_in_stock: '', selling_price: '', mrp: '',
    discount_percent: '0', batch_number: '', expiry_date: '',
  });
  const [bulkText, setBulkText] = useState('Medicine,Quantity,Selling Price,MRP,Batch,Expiry (YYYY-MM-DD)\n');

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      const data = await api.getInventory();
      setInventory(data);
      const today = new Date();
      const alerts = data.filter(item => {
        const expiry = new Date(item.expiry || item.expiry_date);
        const days = Math.floor((expiry - today) / (1000 * 60 * 60 * 24));
        return days <= 30 && days >= 0;
      });
      setExpiryAlerts(alerts);
      setLowStockAlerts(data.filter(item => (item.stock ?? item.quantity_in_stock ?? 0) <= 100));
    } catch (error) {
      notify.error(`Couldn't load inventory: ${error.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItem.medicine_name || !newItem.quantity_in_stock || !newItem.selling_price) {
      notify.error('Medicine name, stock and selling price are required');
      return;
    }
    setSaving(true);
    try {
      await api.addInventoryItem({
        medicine_name: newItem.medicine_name,
        quantity_in_stock: parseInt(newItem.quantity_in_stock, 10),
        selling_price: parseFloat(newItem.selling_price),
        mrp: parseFloat(newItem.mrp || newItem.selling_price),
        discount_percent: parseFloat(newItem.discount_percent || 0),
        batch_number: newItem.batch_number || null,
        expiry_date: newItem.expiry_date || null,
      });
      notify.success(`Added ${newItem.medicine_name}`);
      setShowAddModal(false);
      setNewItem({ medicine_name: '', quantity_in_stock: '', selling_price: '', mrp: '', discount_percent: '0', batch_number: '', expiry_date: '' });
      loadInventory();
    } catch (err) {
      notify.error(`Couldn't add item: ${err.message || err}`);
    } finally {
      setSaving(false);
    }
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    const lines = bulkText.split('\n').map(l => l.trim()).filter(l => l && !l.toLowerCase().startsWith('medicine,'));
    if (lines.length === 0) {
      notify.error('Paste at least one row of data (besides the header)');
      return;
    }
    const items = lines.map(line => {
      const [name, qty, price, mrp, batch, expiry] = line.split(',').map(s => s.trim());
      return {
        medicine_name: name,
        quantity_in_stock: parseInt(qty, 10) || 0,
        selling_price: parseFloat(price) || 0,
        mrp: parseFloat(mrp) || parseFloat(price) || 0,
        batch_number: batch || null,
        expiry_date: expiry || null,
      };
    }).filter(i => i.medicine_name && i.quantity_in_stock > 0);

    if (items.length === 0) {
      notify.error('No valid rows found');
      return;
    }

    setSaving(true);
    try {
      const res = await api.bulkUploadInventory(items);
      const added = res?.added || items.length;
      const failed = res?.failed || 0;
      notify.success(`Bulk upload: ${added} added${failed ? `, ${failed} failed` : ''}`);
      setShowBulkModal(false);
      loadInventory();
    } catch (err) {
      notify.error(`Bulk upload failed: ${err.message || err}`);
    } finally {
      setSaving(false);
    }
  };

  const getStockStatus = (stock) => {
    if (stock > 200) return 'good';
    if (stock > 100) return 'low';
    return 'critical';
  };

  const getExpiryDays = (expiryDate) => {
    if (!expiryDate) return null;
    const today = new Date();
    const expiry = new Date(expiryDate);
    return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  };

  const inventoryColumns = [
    { key: 'name', label: 'Medicine', sortable: true, render: (n, r) => n || r.medicine_name || '—' },
    {
      key: 'stock',
      label: 'Stock',
      sortable: true,
      render: (stock, row) => {
        const s = stock ?? row.quantity_in_stock ?? 0;
        const status = getStockStatus(s);
        const colors = { good: 'success', low: 'warning', critical: 'danger' };
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: `var(--${colors[status]})` }} />
            {s}
          </div>
        );
      }
    },
    { key: 'sellingPrice', label: 'Selling Price', sortable: true, render: (p, r) => `₹${p ?? r.selling_price ?? 0}` },
    { key: 'mrp', label: 'MRP', sortable: true, render: (m) => m ? `₹${m}` : '—' },
    { key: 'discount', label: 'Discount %', sortable: true, render: (d, r) => `${d ?? r.discount_percent ?? 0}%` },
    {
      key: 'expiry',
      label: 'Expiry',
      sortable: true,
      render: (exp, row) => {
        const e = exp || row.expiry_date;
        if (!e) return '—';
        const days = getExpiryDays(e);
        const color = days > 60 ? 'success' : days > 30 ? 'warning' : 'danger';
        return (
          <span style={{ color: `var(--${color})`, fontWeight: '600' }}>
            {new Date(e).toLocaleDateString('en-IN')} ({days}d)
          </span>
        );
      }
    },
  ];

  if (loading) {
    return <div className="page-container"><p style={{ textAlign: 'center', padding: '40px' }}>Loading inventory...</p></div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Inventory</h1>
        <p className="page-subtitle">Manage your medicine stock and expiry dates</p>
      </div>

      <div className="grid grid-2" style={{ marginBottom: '32px' }}>
        {expiryAlerts.length > 0 && (
          <div className="alert alert-warning">
            <AlertTriangle className="alert-icon" />
            <div className="alert-content">
              <h4>{expiryAlerts.length} items expiring soon</h4>
              <p style={{ fontSize: '12px', marginTop: '4px' }}>Items expiring within 30 days. Review and take action.</p>
            </div>
          </div>
        )}
        {lowStockAlerts.length > 0 && (
          <div className="alert alert-danger">
            <AlertTriangle className="alert-icon" />
            <div className="alert-content">
              <h4>{lowStockAlerts.length} items with low stock</h4>
              <p style={{ fontSize: '12px', marginTop: '4px' }}>Replenish inventory to avoid stockouts.</p>
            </div>
          </div>
        )}
      </div>

      <div style={{ marginBottom: '24px', display: 'flex', gap: '12px' }}>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={16} /> Add Medicine
        </button>
        <button className="btn btn-secondary" onClick={() => setShowBulkModal(true)}>
          <Upload size={16} /> Bulk Upload
        </button>
      </div>

      <DataTable columns={inventoryColumns} data={inventory} searchField="name" />

      {showAddModal && (
        <Modal onClose={() => setShowAddModal(false)} title="Add medicine to inventory">
          <form onSubmit={handleAddItem} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Field label="Medicine name *">
              <input value={newItem.medicine_name} onChange={e => setNewItem({ ...newItem, medicine_name: e.target.value })} required placeholder="e.g. Metformin 500mg" />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Stock quantity *">
                <input type="number" min="0" value={newItem.quantity_in_stock} onChange={e => setNewItem({ ...newItem, quantity_in_stock: e.target.value })} required />
              </Field>
              <Field label="Batch number">
                <input value={newItem.batch_number} onChange={e => setNewItem({ ...newItem, batch_number: e.target.value })} />
              </Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <Field label="Selling price (₹) *">
                <input type="number" step="0.01" value={newItem.selling_price} onChange={e => setNewItem({ ...newItem, selling_price: e.target.value })} required />
              </Field>
              <Field label="MRP (₹)">
                <input type="number" step="0.01" value={newItem.mrp} onChange={e => setNewItem({ ...newItem, mrp: e.target.value })} />
              </Field>
              <Field label="Discount %">
                <input type="number" min="0" max="100" value={newItem.discount_percent} onChange={e => setNewItem({ ...newItem, discount_percent: e.target.value })} />
              </Field>
            </div>
            <Field label="Expiry date">
              <input type="date" value={newItem.expiry_date} onChange={e => setNewItem({ ...newItem, expiry_date: e.target.value })} />
            </Field>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Add'}</button>
            </div>
          </form>
        </Modal>
      )}

      {showBulkModal && (
        <Modal onClose={() => setShowBulkModal(false)} title="Bulk upload (CSV format)">
          <form onSubmit={handleBulkUpload} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: 13, color: '#6b7280' }}>
              One medicine per line. Format: <code>Medicine, Quantity, Selling Price, MRP, Batch, Expiry (YYYY-MM-DD)</code>
            </p>
            <textarea value={bulkText} onChange={e => setBulkText(e.target.value)} rows={10}
              style={{ fontFamily: 'monospace', fontSize: 13, padding: 8, border: '1px solid #e5e7eb', borderRadius: 4 }} />
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowBulkModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Uploading…' : 'Upload'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

const Modal = ({ onClose, title, children }) => (
  <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
    <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 8, width: 'min(640px, 92vw)', maxHeight: '90vh', overflowY: 'auto' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>{title}</h2>
        <button onClick={onClose} style={{ background: 'none', border: 0, cursor: 'pointer' }}><X size={20} /></button>
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  </div>
);

const Field = ({ label, children }) => (
  <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: '#374151' }}>
    <span>{label}</span>
    {children}
  </label>
);

export default InventoryPage;
