import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../components/DataTable';
import { api } from '../services/api';
import { CheckCircle, Package, Truck } from 'lucide-react';

function OrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await api.getOrders();
      setOrders(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading orders:', error);
      setLoading(false);
    }
  };

  const getFilteredOrders = () => {
    if (activeTab === 'all') return orders;
    return orders.filter(o => o.status === activeTab);
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    await api.updateOrderStatus(orderId, newStatus);
    const updated = orders.map(o =>
      o.id === orderId ? { ...o, status: newStatus } : o
    );
    setOrders(updated);
  };

  const orderTableColumns = [
    { key: 'id', label: 'Order ID', sortable: true },
    { key: 'patientName', label: 'Patient', sortable: true },
    {
      key: 'items',
      label: 'Items',
      sortable: false,
      render: (items) => items.length
    },
    {
      key: 'totalAmount',
      label: 'Total',
      sortable: true,
      render: (val) => `₹${val.toLocaleString('en-IN')}`
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (status) => {
        const colors = {
          pending: 'badge-warning',
          confirmed: 'badge-info',
          preparing: 'badge-info',
          ready: 'badge-success',
          delivered: 'badge-success'
        };
        return (
          <span className={`badge ${colors[status] || 'badge-primary'}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
      }
    },
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (date) => new Date(date).toLocaleDateString('en-IN')
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
                handleStatusUpdate(row.id, 'confirmed');
              }}
            >
              Confirm
            </button>
          )}
          {row.status === 'confirmed' && (
            <button
              className="btn btn-small btn-secondary"
              onClick={(e) => {
                e.stopPropagation();
                handleStatusUpdate(row.id, 'preparing');
              }}
            >
              <Package size={14} /> Prepare
            </button>
          )}
          {row.status === 'preparing' && (
            <button
              className="btn btn-small btn-success"
              onClick={(e) => {
                e.stopPropagation();
                handleStatusUpdate(row.id, 'ready');
              }}
            >
              <CheckCircle size={14} /> Ready
            </button>
          )}
          {row.status === 'ready' && (
            <button
              className="btn btn-small btn-primary"
              onClick={(e) => {
                e.stopPropagation();
                handleStatusUpdate(row.id, 'delivered');
              }}
            >
              <Truck size={14} /> Deliver
            </button>
          )}
        </div>
      )
    }
  ];

  const filteredOrders = getFilteredOrders();
  const statusCounts = {
    all: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length,
    delivered: orders.filter(o => o.status === 'delivered').length
  };

  if (loading) {
    return (
      <div className="page-container">
        <p style={{ textAlign: 'center', padding: '40px' }}>Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Orders</h1>
        <p className="page-subtitle">Manage and track all orders from customers</p>
      </div>

      <div className="tabs">
        {['all', 'pending', 'confirmed', 'preparing', 'ready', 'delivered'].map(tab => (
          <button
            key={tab}
            className={`tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            <span style={{ marginLeft: '8px', fontSize: '12px', opacity: 0.7 }}>
              ({statusCounts[tab]})
            </span>
          </button>
        ))}
      </div>

      <DataTable
        columns={orderTableColumns}
        data={filteredOrders}
        searchField="patientName"
        onRowClick={(row) => navigate(`/orders/${row.id}`)}
      />
    </div>
  );
}

export default OrdersPage;
