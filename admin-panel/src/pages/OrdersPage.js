import React, { useState, useEffect } from 'react';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { api } from '../services/api';

function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      const data = await api.getAllOrders();
      setOrders(data);
      setLoading(false);
    };
    loadOrders();
  }, []);

  if (loading) {
    return <div className="app-header"><h1>Loading...</h1></div>;
  }

  const statuses = [...new Set(orders.map(o => o.status))];

  const columns = [
    { key: 'id', label: 'Order ID' },
    { key: 'storeName', label: 'Store' },
    { key: 'patientName', label: 'Patient' },
    {
      key: 'amount',
      label: 'Amount (₹)',
      render: (value) => <span>{value}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <StatusBadge type={value.toLowerCase()} text={value} />
      ),
    },
    { key: 'date', label: 'Date' },
  ];

  return (
    <div>
      <div className="app-header">
        <h1>Orders Management</h1>
      </div>

      <div className="app-content">
        <DataTable
          title={`Total Orders: ${orders.length}`}
          data={orders}
          columns={columns}
          searchableFields={['id', 'storeName', 'patientName']}
          filterField="status"
          filterOptions={statuses}
        />
      </div>
    </div>
  );
}

export default OrdersPage;
