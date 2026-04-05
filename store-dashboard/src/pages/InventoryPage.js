import React, { useState, useEffect } from 'react';
import DataTable from '../components/DataTable';
import { api } from '../services/api';
import { Plus, Upload, AlertTriangle } from 'lucide-react';

function InventoryPage() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expiryAlerts, setExpiryAlerts] = useState([]);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      const data = await api.getInventory();
      setInventory(data);

      // Calculate alerts
      const today = new Date();
      const alerts = data.filter(item => {
        const expiry = new Date(item.expiry);
        const daysUntilExpiry = Math.floor((expiry - today) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
      });
      setExpiryAlerts(alerts);

      const lowStock = data.filter(item => item.stock <= 100);
      setLowStockAlerts(lowStock);

      setLoading(false);
    } catch (error) {
      console.error('Error loading inventory:', error);
      setLoading(false);
    }
  };

  const getStockStatus = (stock) => {
    if (stock > 200) return 'good';
    if (stock > 100) return 'low';
    return 'critical';
  };

  const getExpiryDays = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  };

  const inventoryColumns = [
    { key: 'name', label: 'Medicine', sortable: true },
    {
      key: 'stock',
      label: 'Stock',
      sortable: true,
      render: (stock, row) => {
        const status = getStockStatus(stock);
        const colors = { good: 'success', low: 'warning', critical: 'danger' };
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: `var(--${colors[status]})`
            }} />
            {stock}
          </div>
        );
      }
    },
    {
      key: 'sellingPrice',
      label: 'Selling Price',
      sortable: true,
      render: (price) => `₹${price}`
    },
    {
      key: 'mrp',
      label: 'MRP',
      sortable: true,
      render: (mrp) => `₹${mrp}`
    },
    {
      key: 'discount',
      label: 'Discount %',
      sortable: true,
      render: (discount) => `${discount}%`
    },
    {
      key: 'expiry',
      label: 'Expiry',
      sortable: true,
      render: (expiry) => {
        const days = getExpiryDays(expiry);
        const color = days > 60 ? 'success' : days > 30 ? 'warning' : 'danger';
        return (
          <span style={{ color: `var(--${color})`, fontWeight: '600' }}>
            {new Date(expiry).toLocaleDateString('en-IN')} ({days}d)
          </span>
        );
      }
    },
    {
      key: 'status',
      label: 'Status',
      sortable: false,
      render: (status, row) => {
        const stock = getStockStatus(row.stock);
        const colors = { good: 'success', low: 'warning', critical: 'danger' };
        return (
          <span className={`badge badge-${colors[stock]}`}>
            {stock.charAt(0).toUpperCase() + stock.slice(1)}
          </span>
        );
      }
    }
  ];

  if (loading) {
    return (
      <div className="page-container">
        <p style={{ textAlign: 'center', padding: '40px' }}>Loading inventory...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Inventory</h1>
        <p className="page-subtitle">Manage your medicine stock and expiry dates</p>
      </div>

      {/* Alerts */}
      <div className="grid grid-2" style={{ marginBottom: '32px' }}>
        {expiryAlerts.length > 0 && (
          <div className="alert alert-warning">
            <AlertTriangle className="alert-icon" />
            <div className="alert-content">
              <h4>{expiryAlerts.length} items expiring soon</h4>
              <p style={{ fontSize: '12px', marginTop: '4px' }}>
                Items expiring within 30 days. Review and take action.
              </p>
            </div>
          </div>
        )}

        {lowStockAlerts.length > 0 && (
          <div className="alert alert-danger">
            <AlertTriangle className="alert-icon" />
            <div className="alert-content">
              <h4>{lowStockAlerts.length} items with low stock</h4>
              <p style={{ fontSize: '12px', marginTop: '4px' }}>
                Replenish inventory to avoid stockouts.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ marginBottom: '24px', display: 'flex', gap: '12px' }}>
        <button className="btn btn-primary">
          <Plus size={16} /> Add Medicine
        </button>
        <button className="btn btn-secondary">
          <Upload size={16} /> Bulk Upload
        </button>
      </div>

      {/* Inventory Table */}
      <DataTable
        columns={inventoryColumns}
        data={inventory}
        searchField="name"
      />
    </div>
  );
}

export default InventoryPage;
