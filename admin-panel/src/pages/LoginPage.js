import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { api } from '../services/api';

function LoginPage({ onLogin }) {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await api.login(phone, password);

      if (result.success) {
        onLogin(result.user);
        navigate('/');
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <div className="login-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Heart size={28} style={{ color: '#1B4F72' }} />
            RxMax Admin
          </div>
          <p className="login-subtitle">Platform Management Dashboard</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input
              type="tel"
              className="form-input"
              placeholder="Enter your phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={loading}
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
              disabled={loading}
              required
            />
          </div>

          {error && (
            <div style={{ color: '#EC7063', fontSize: '13px', marginBottom: '16px', padding: '10px', backgroundColor: 'rgba(231, 76, 60, 0.1)', borderRadius: '6px', borderLeft: '2px solid #EC7063' }}>
              {error}
            </div>
          )}

          <button type="submit" className="form-button" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="login-hint">
          <span className="hint-label">Demo Credentials:</span>
          <div className="hint-text">
            <div><strong>Phone:</strong> 9999999999</div>
            <div><strong>Password:</strong> rxmaxadmin2026</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
