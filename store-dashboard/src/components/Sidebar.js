import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BarChart3,
  ShoppingCart,
  Users,
  Pill,
  RotateCw,
  TrendingUp,
  Settings,
  LogOut,
  FileText
} from 'lucide-react';
import { api } from '../services/api';

function Sidebar({ onLogout }) {
  const location = useLocation();
  const [pendingRefills, setPendingRefills] = useState(0);
  const [atRiskOrders, setAtRiskOrders] = useState(0);

  useEffect(() => {
    loadBadgeData();
  }, []);

  const loadBadgeData = async () => {
    try {
      const [orders, refills] = await Promise.all([
        api.getOrders(),
        api.getRefills()
      ]);

      const pending = refills.filter(r => r.status === 'pending').length;
      setPendingRefills(pending);

      const atRisk = orders.filter(o => o.status === 'pending').length;
      setAtRiskOrders(atRisk);
    } catch (error) {
      console.error('Error loading badge data:', error);
    }
  };

  const isActive = (path) => location.pathname === path ? 'active' : '';

  const navItems = [
    { path: '/dashboard', icon: BarChart3, label: 'Dashboard', badge: null },
    { path: '/orders', icon: ShoppingCart, label: 'Orders', badge: atRiskOrders > 0 ? atRiskOrders : null },
    { path: '/patients', icon: Users, label: 'Patients', badge: null },
    { path: '/prescriptions', icon: FileText, label: 'Prescriptions', badge: null },
    { path: '/inventory', icon: Pill, label: 'Inventory', badge: null },
    { path: '/refills', icon: RotateCw, label: 'Refills', badge: pendingRefills > 0 ? pendingRefills : null },
    { path: '/analytics', icon: TrendingUp, label: 'Analytics', badge: null },
    { path: '/settings', icon: Settings, label: 'Settings', badge: null }
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <Pill size={28} />
          <span>RxMax</span>
        </div>
        <div className="sidebar-tagline">Store Dashboard</div>
      </div>

      <ul className="sidebar-nav">
        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <li key={item.path}>
              <Link to={item.path} className={`${isActive(item.path)}`}>
                <Icon size={20} />
                <span>{item.label}</span>
                {item.badge && <span className="nav-badge">{item.badge}</span>}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={onLogout}>
          <LogOut size={16} style={{ marginRight: '8px' }} />
          Logout
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
