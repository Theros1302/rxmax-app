import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Heart, ShoppingCart, Pill, User } from 'lucide-react';

const BottomNav = () => {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div className="bottom-nav">
      <Link
        to="/"
        className={`nav-item ${isActive('/') ? 'active' : ''}`}
      >
        <Home size={24} />
        <span>Home</span>
      </Link>
      <Link
        to="/upload"
        className={`nav-item ${isActive('/upload') ? 'active' : ''}`}
      >
        <Heart size={24} />
        <span>Rx</span>
      </Link>
      <Link
        to="/order"
        className={`nav-item ${isActive('/order') ? 'active' : ''}`}
      >
        <ShoppingCart size={24} />
        <span>Order</span>
      </Link>
      <Link
        to="/refills"
        className={`nav-item ${isActive('/refills') ? 'active' : ''}`}
      >
        <Pill size={24} />
        <span>Refills</span>
      </Link>
      <Link
        to="/profile"
        className={`nav-item ${isActive('/profile') ? 'active' : ''}`}
      >
        <User size={24} />
        <span>Profile</span>
      </Link>
    </div>
  );
};

export default BottomNav;
