import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Heart,
  Home,
  Store,
  Users,
  ShoppingCart,
  BarChart3,
  RefreshCw,
  Settings,
  LogOut,
} from 'lucide-react';

function AdminSidebar({ user, onLogout }) {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <Link to="/">
          <Heart size={28} />
          RxMax Admin
        </Link>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <div className="nav-section-label">Main</div>
          <Link
            to="/"
            className={`nav-link ${isActive('/dashboard') || location.pathname === '/' ? 'active' : ''}`}
          >
            <Home size={20} />
            Dashboard
          </Link>
        </div>

        <div className="nav-section">
          <div className="nav-section-label">Management</div>
          <Link
            to="/stores"
            className={`nav-link ${isActive('/stores') ? 'active' : ''}`}
          >
            <Store size={20} />
            Stores
            {false && <span className="nav-badge">3</span>}
          </Link>
          <Link
            to="/patients"
            className={`nav-link ${isActive('/patients') ? 'active' : ''}`}
          >
            <Users size={20} />
            Patients
          </Link>
          <Link
            to="/orders"
            className={`nav-link ${isActive('/orders') ? 'active' : ''}`}
          >
            <ShoppingCart size={20} />
            Orders
          </Link>
        </div>

        <div className="nav-section">
          <div className="nav-section-label">Insights</div>
          <Link
            to="/analytics"
            className={`nav-link ${isActive('/analytics') ? 'active' : ''}`}
          >
            <BarChart3 size={20} />
            Analytics
          </Link>
          <Link
            to="/refills"
            className={`nav-link ${isActive('/refills') ? 'active' : ''}`}
          >
            <RefreshCw size={20} />
            Refills
            <span className="nav-badge">12</span>
          </Link>
        </div>

        <div className="nav-section">
          <div className="nav-section-label">Configuration</div>
          <Link
            to="/settings"
            className={`nav-link ${isActive('/settings') ? 'active' : ''}`}
          >
            <Settings size={20} />
            Settings
          </Link>
        </div>
      </nav>

      <div className="sidebar-user">
        <div className="user-info">
          <div className="user-avatar">
            {user?.name?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div className="user-details">
            <div className="user-name">{user?.name || 'Admin'}</div>
            <div className="user-email">{user?.email || 'admin@rxmax.com'}</div>
          </div>
        </div>
        <button className="logout-btn" onClick={onLogout}>
          <LogOut size={14} style={{ marginRight: '4px' }} />
          Logout
        </button>
      </div>
    </div>
  );
}

export default AdminSidebar;
