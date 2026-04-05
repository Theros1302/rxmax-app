import React, { useState, useEffect } from 'react';
import { Copy, Eye, EyeOff } from 'lucide-react';
import { api } from '../services/api';

function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [revealedKeys, setRevealedKeys] = useState({});

  useEffect(() => {
    const loadSettings = async () => {
      const data = await api.getPlatformSettings();
      setSettings(data);
      setLoading(false);
    };
    loadSettings();
  }, []);

  const toggleKeyReveal = (keyId) => {
    setRevealedKeys({
      ...revealedKeys,
      [keyId]: !revealedKeys[keyId],
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return <div className="app-header"><h1>Loading...</h1></div>;
  }

  return (
    <div>
      <div className="app-header">
        <h1>Settings</h1>
      </div>

      <div className="app-content">
        {/* Admin Profile */}
        <div className="chart-container" style={{ marginBottom: '24px' }}>
          <div className="chart-header">
            <h2 className="chart-title">Admin Profile</h2>
            <p className="chart-subtitle">Your account information</p>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px',
            }}
          >
            <div className="profile-field">
              <label className="profile-label">Full Name</label>
              <div className="profile-value">Admin User</div>
            </div>
            <div className="profile-field">
              <label className="profile-label">Email</label>
              <div className="profile-value">admin@rxmax.com</div>
            </div>
            <div className="profile-field">
              <label className="profile-label">Phone</label>
              <div className="profile-value">9999999999</div>
            </div>
            <div className="profile-field">
              <label className="profile-label">Role</label>
              <div className="profile-value">Platform Admin</div>
            </div>
          </div>
        </div>

        {/* Platform Configuration */}
        <div className="chart-container" style={{ marginBottom: '24px' }}>
          <div className="chart-header">
            <h2 className="chart-title">Platform Configuration</h2>
            <p className="chart-subtitle">System settings</p>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px',
            }}
          >
            <div className="profile-field">
              <label className="profile-label">Platform Name</label>
              <div className="profile-value">{settings.platformName}</div>
            </div>
            <div className="profile-field">
              <label className="profile-label">Version</label>
              <div className="profile-value">{settings.version}</div>
            </div>
            <div className="profile-field">
              <label className="profile-label">Support Email</label>
              <div className="profile-value">{settings.supportEmail}</div>
            </div>
            <div className="profile-field">
              <label className="profile-label">Environment</label>
              <div className="profile-value">Production</div>
            </div>
          </div>
        </div>

        {/* Subscription Plans */}
        <div className="chart-container" style={{ marginBottom: '24px' }}>
          <div className="chart-header">
            <h2 className="chart-title">Subscription Plans</h2>
            <p className="chart-subtitle">Available pricing tiers</p>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px',
            }}
          >
            {settings.subscriptionPlans.map((plan) => (
              <div
                key={plan.name}
                style={{
                  border: '1px solid #2a3a4a',
                  borderRadius: '12px',
                  padding: '20px',
                  backgroundColor: '#151D28',
                }}
              >
                <div className="profile-field">
                  <label className="profile-label">Plan Name</label>
                  <div className="profile-value">{plan.name}</div>
                </div>
                <div className="profile-field">
                  <label className="profile-label">Monthly Price</label>
                  <div className="profile-value">
                    {plan.monthlyPrice === 0 ? 'Free' : `₹${plan.monthlyPrice}`}
                  </div>
                </div>
                <div className="profile-field">
                  <label className="profile-label">Features</label>
                  <ul style={{ color: '#B0BEC5', fontSize: '14px', paddingLeft: '20px' }}>
                    {plan.features.map((feature, idx) => (
                      <li key={idx}>{feature}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* API Key Management */}
        <div className="chart-container">
          <div className="chart-header">
            <h2 className="chart-title">API Key Management</h2>
            <p className="chart-subtitle">Manage your API credentials</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {settings.apiKeys.map((key) => (
              <div
                key={key.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  backgroundColor: '#151D28',
                  border: '1px solid #2a3a4a',
                  borderRadius: '8px',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div className="profile-label" style={{ marginBottom: '8px' }}>
                    {key.name}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontFamily: 'monospace',
                      fontSize: '14px',
                    }}
                  >
                    <span style={{ color: '#B0BEC5' }}>
                      {revealedKeys[key.id] ? key.masked : key.masked}
                    </span>
                    <button
                      onClick={() => toggleKeyReveal(key.id)}
                      className="btn btn-secondary"
                      style={{ padding: '6px', width: 'auto', minWidth: '40px' }}
                    >
                      {revealedKeys[key.id] ? (
                        <EyeOff size={14} />
                      ) : (
                        <Eye size={14} />
                      )}
                    </button>
                    <button
                      onClick={() => copyToClipboard(key.masked)}
                      className="btn btn-secondary"
                      style={{ padding: '6px', width: 'auto', minWidth: '40px' }}
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security */}
        <div className="chart-container" style={{ marginTop: '24px' }}>
          <div className="chart-header">
            <h2 className="chart-title">Security</h2>
            <p className="chart-subtitle">Account security settings</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button className="btn btn-secondary">Change Password</button>
            <button className="btn btn-secondary">Enable Two-Factor Authentication</button>
            <button className="btn btn-secondary">View Login Activity</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
