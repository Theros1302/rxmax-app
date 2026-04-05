import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Pill, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

function LoginPage({ onLogin }) {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('9876543200');
  const [password, setPassword] = useState('demo123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.login(phone, password);
      onLogin();
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px' }}>
          <Pill size={40} color="var(--primary)" />
        </div>

        <h1 className="auth-title">RxMax Store</h1>
        <p className="auth-subtitle">Store Owner Dashboard Login</p>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '24px' }}>
            <AlertCircle className="alert-icon" />
            <div className="alert-content">
              <p>{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input
              type="tel"
              className="form-input"
              placeholder="10-digit mobile number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength="10"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', marginTop: '24px', fontSize: '15px', fontWeight: '600' }}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account?
          <Link to="/register" className="auth-link">Create Store Account</Link>
        </p>

        <div style={{ marginTop: '32px', padding: '16px', backgroundColor: 'var(--light-gray)', borderRadius: '8px' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-light)', marginBottom: '8px' }}>Demo Credentials:</p>
          <p style={{ fontSize: '13px', color: 'var(--text-dark)', fontWeight: '600' }}>Phone: 9876543200</p>
          <p style={{ fontSize: '13px', color: 'var(--text-dark)', fontWeight: '600' }}>Password: demo123</p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
