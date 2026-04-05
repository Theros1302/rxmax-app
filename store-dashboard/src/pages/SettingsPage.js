import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, AlertTriangle, Clock } from 'lucide-react';
import { api } from '../services/api';

function SettingsPage() {
  const navigate = useNavigate();
  const [storeProfile, setStoreProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  const [formData, setFormData] = useState({
    storeName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    licenseNumber: '',
    gstNumber: '',
    operatingHours: {
      monday: '9:00-21:00',
      tuesday: '9:00-21:00',
      wednesday: '9:00-21:00',
      thursday: '9:00-21:00',
      friday: '9:00-21:00',
      saturday: '10:00-20:00',
      sunday: 'Closed'
    },
    deliveryRadius: 5,
    deliveryCharge: 50,
    freeDeliveryAbove: 500,
    autoNudge: true,
    nudgeTime: '09:00',
    reminderDays: 3,
    subscribedPlan: 'professional'
  });

  useEffect(() => {
    loadStoreProfile();
  }, []);

  const loadStoreProfile = async () => {
    try {
      const data = await api.getStoreProfile();
      setStoreProfile(data);
      setFormData({
        storeName: data.storeName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        licenseNumber: data.licenseNumber,
        gstNumber: data.gstNumber,
        operatingHours: data.operatingHours,
        deliveryRadius: data.deliverySettings.deliveryRadius,
        deliveryCharge: data.deliverySettings.deliveryCharge,
        freeDeliveryAbove: data.deliverySettings.freeDeliveryAbove,
        autoNudge: data.refillSettings.autoNudge,
        nudgeTime: data.refillSettings.nudgeTime,
        reminderDays: data.refillSettings.reminderDays,
        subscribedPlan: data.subscribedPlan
      });
      setLoading(false);
    } catch (error) {
      console.error('Error loading store profile:', error);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOperatingHoursChange = (day, value) => {
    setFormData(prev => ({
      ...prev,
      operatingHours: { ...prev.operatingHours, [day]: value }
    }));
  };

  const handleSave = async () => {
    try {
      await api.updateStoreProfile({
        storeName: formData.storeName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode
      });

      await api.updateOperatingHours(formData.operatingHours);

      await api.updateRefillSettings({
        autoNudge: formData.autoNudge,
        nudgeTime: formData.nudgeTime,
        reminderDays: formData.reminderDays
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleDeactivate = async () => {
    if (window.confirm('Are you sure you want to deactivate your store? This action cannot be undone.')) {
      try {
        await api.deactivateStore();
        // Clear auth and redirect to login
        localStorage.removeItem('rxmax_token');
        localStorage.removeItem('rxmax_store_id');
        navigate('/login');
      } catch (error) {
        console.error('Error deactivating store:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <p style={{ textAlign: 'center', padding: '40px' }}>Loading settings...</p>
      </div>
    );
  }

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your store profile and preferences</p>
      </div>

      {saved && (
        <div className="alert alert-success" style={{ marginBottom: '32px' }}>
          <span style={{ color: 'var(--success)', fontSize: '20px', marginRight: '12px' }}>✓</span>
          <div className="alert-content">
            <p>Settings saved successfully!</p>
          </div>
        </div>
      )}

      {/* Store Profile */}
      <div className="card" style={{ marginBottom: '32px' }}>
        <h3 className="card-title">Store Profile</h3>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Store Name</label>
            <input
              type="text"
              className="form-input"
              name="storeName"
              value={formData.storeName}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input
              type="tel"
              className="form-input"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label className="form-label">License Number</label>
            <input
              type="text"
              className="form-input"
              name="licenseNumber"
              value={formData.licenseNumber}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Address</label>
            <input
              type="text"
              className="form-input"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label className="form-label">City</label>
            <input
              type="text"
              className="form-input"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label className="form-label">State</label>
            <input
              type="text"
              className="form-input"
              name="state"
              value={formData.state}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Pincode</label>
            <input
              type="text"
              className="form-input"
              name="pincode"
              value={formData.pincode}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">GST Number</label>
          <input
            type="text"
            className="form-input"
            name="gstNumber"
            value={formData.gstNumber}
            onChange={handleInputChange}
          />
        </div>
      </div>

      {/* Operating Hours */}
      <div className="card" style={{ marginBottom: '32px' }}>
        <h3 className="card-title">Operating Hours</h3>
        <div style={{ display: 'grid', gap: '16px' }}>
          {days.map(day => (
            <div key={day} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label className="form-label" style={{ textTransform: 'capitalize' }}>
                  {day}
                </label>
              </div>
              <div>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., 9:00-21:00"
                  value={formData.operatingHours[day]}
                  onChange={(e) => handleOperatingHoursChange(day, e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delivery Settings */}
      <div className="card" style={{ marginBottom: '32px' }}>
        <h3 className="card-title">Delivery Settings</h3>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Delivery Radius (km)</label>
            <input
              type="number"
              className="form-input"
              name="deliveryRadius"
              value={formData.deliveryRadius}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Delivery Charge (₹)</label>
            <input
              type="number"
              className="form-input"
              name="deliveryCharge"
              value={formData.deliveryCharge}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Free Delivery Above (₹)</label>
            <input
              type="number"
              className="form-input"
              name="freeDeliveryAbove"
              value={formData.freeDeliveryAbove}
              onChange={handleInputChange}
            />
          </div>
        </div>
      </div>

      {/* Refill Notifications */}
      <div className="card" style={{ marginBottom: '32px' }}>
        <h3 className="card-title">Refill Notifications</h3>
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', backgroundColor: 'var(--light-gray)', borderRadius: '8px' }}>
            <input
              type="checkbox"
              id="autoNudge"
              checked={formData.autoNudge}
              onChange={(e) => setFormData(prev => ({ ...prev, autoNudge: e.target.checked }))}
            />
            <label htmlFor="autoNudge" style={{ cursor: 'pointer', margin: 0 }}>
              <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-dark)', margin: 0 }}>Enable Auto-Nudge</p>
              <p style={{ fontSize: '12px', color: 'var(--text-light)', margin: 0, marginTop: '4px' }}>
                Automatically send refill reminders to patients
              </p>
            </label>
          </div>
        </div>

        {formData.autoNudge && (
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Nudge Time</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} />
                <input
                  type="time"
                  className="form-input"
                  value={formData.nudgeTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, nudgeTime: e.target.value }))}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Days Before Refill Due</label>
              <input
                type="number"
                className="form-input"
                value={formData.reminderDays}
                onChange={(e) => setFormData(prev => ({ ...prev, reminderDays: parseInt(e.target.value) }))}
              />
            </div>
          </div>
        )}
      </div>

      {/* Subscription Plan */}
      <div className="card" style={{ marginBottom: '32px' }}>
        <h3 className="card-title">Subscription Plan</h3>
        <div style={{ padding: '16px', backgroundColor: 'var(--light-gray)', borderRadius: '8px' }}>
          <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-dark)', marginBottom: '8px' }}>
            Current Plan: <span style={{ color: 'var(--primary)' }}>{formData.subscribedPlan.toUpperCase()}</span>
          </p>
          <p style={{ fontSize: '12px', color: 'var(--text-light)', margin: 0 }}>
            You're on the {formData.subscribedPlan} plan with full features enabled.
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div style={{ marginBottom: '32px' }}>
        <button className="btn btn-primary" onClick={handleSave}>
          <Save size={16} /> Save Settings
        </button>
      </div>

      {/* Danger Zone */}
      <div className="card" style={{ borderLeftColor: 'var(--danger)', borderLeftWidth: '4px', borderLeftStyle: 'solid' }}>
        <h3 className="card-title" style={{ color: 'var(--danger)' }}>Danger Zone</h3>
        <p className="card-subtitle">Irreversible actions - proceed with caution</p>

        <div style={{ padding: '16px', backgroundColor: 'rgba(231, 76, 60, 0.05)', borderRadius: '8px', marginBottom: '16px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-dark)', margin: 0 }}>
            Deactivating your store will disable all patient access and stop accepting orders.
          </p>
        </div>

        <button className="btn btn-danger" onClick={handleDeactivate}>
          <AlertTriangle size={16} /> Deactivate Store
        </button>
      </div>
    </div>
  );
}

export default SettingsPage;
