import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Pill, AlertCircle, Copy } from 'lucide-react';
import { api } from '../services/api';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

function RegisterPage({ onRegisterSuccess }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);

  const [formData, setFormData] = useState({
    storeName: '',
    ownerName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: '',
    city: '',
    pincode: '',
    state: '',
    licenseNumber: '',
    gstNumber: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateStep1 = () => {
    if (!formData.storeName || !formData.ownerName || !formData.phone || !formData.email) {
      setError('Please fill all fields');
      return false;
    }
    if (!/^\d{10}$/.test(formData.phone)) {
      setError('Phone must be 10 digits');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Invalid email format');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.password || !formData.confirmPassword) {
      setError('Please enter password');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!formData.address || !formData.city || !formData.pincode || !formData.state) {
      setError('Please fill all address fields');
      return false;
    }
    if (!/^\d{6}$/.test(formData.pincode)) {
      setError('Pincode must be 6 digits');
      return false;
    }
    return true;
  };

  const validateStep4 = () => {
    if (!formData.licenseNumber || !formData.gstNumber) {
      setError('Please fill all fields');
      return false;
    }
    return true;
  };

  const handleNextStep = async () => {
    setError('');
    let isValid = false;

    if (step === 1) isValid = validateStep1();
    else if (step === 2) isValid = validateStep2();
    else if (step === 3) isValid = validateStep3();
    else if (step === 4) {
      isValid = validateStep4();
      if (isValid) {
        setLoading(true);
        try {
          const result = await api.register(formData);
          setSuccessData(result);
          setStep(5);
        } catch (err) {
          setError(err.message || 'Registration failed');
        } finally {
          setLoading(false);
        }
        return;
      }
    }

    if (isValid) {
      setStep(step + 1);
    }
  };

  if (step === 5 && successData) {
    return (
      <div className="auth-container">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div className="success-screen">
            <div className="success-icon">✓</div>
            <h2 className="success-title">Registration Successful!</h2>
            <p className="success-message">
              Your pharmacy store has been registered. Share the patient link below with your patients to download the app.
            </p>

            <div className="qr-section">
              <div className="qr-label">Patient App Link</div>
              <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                <p style={{ fontSize: '14px', color: 'var(--text-dark)', wordBreak: 'break-all', fontWeight: '500' }}>
                  {successData.patientLink}
                </p>
              </div>
              <button
                className="btn btn-primary btn-small"
                onClick={() => {
                  navigator.clipboard.writeText(successData.patientLink);
                  alert('Link copied to clipboard!');
                }}
              >
                <Copy size={16} /> Copy Link
              </button>
            </div>

            <div style={{ marginTop: '32px', padding: '16px', backgroundColor: 'var(--light-gray)', borderRadius: '8px' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-light)', marginBottom: '8px' }}>Store ID</p>
              <p style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-dark)', fontFamily: 'monospace' }}>
                {successData.storeId}
              </p>
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '32px', padding: '12px' }}
              onClick={() => {
                onRegisterSuccess();
                navigate('/dashboard');
              }}
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px' }}>
          <Pill size={40} color="var(--primary)" />
        </div>

        <h1 className="auth-title">Register Store</h1>
        <p className="auth-subtitle">Step {step} of 4</p>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '24px' }}>
            <AlertCircle className="alert-icon" />
            <div className="alert-content">
              <p>{error}</p>
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <div className="form-group">
              <label className="form-label">Store Name</label>
              <input
                type="text"
                className="form-input"
                name="storeName"
                placeholder="e.g., RxMax Central Pharmacy"
                value={formData.storeName}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Owner Name</label>
              <input
                type="text"
                className="form-input"
                name="ownerName"
                placeholder="Full name"
                value={formData.ownerName}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                className="form-input"
                name="phone"
                placeholder="10-digit number"
                maxLength="10"
                value={formData.phone}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                name="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                name="password"
                placeholder="Min 6 characters"
                value={formData.password}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                className="form-input"
                name="confirmPassword"
                placeholder="Re-enter password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <div className="form-group">
              <label className="form-label">Address</label>
              <input
                type="text"
                className="form-input"
                name="address"
                placeholder="Street address"
                value={formData.address}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">City</label>
                <input
                  type="text"
                  className="form-input"
                  name="city"
                  placeholder="City"
                  value={formData.city}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Pincode</label>
                <input
                  type="text"
                  className="form-input"
                  name="pincode"
                  placeholder="6-digit code"
                  maxLength="6"
                  value={formData.pincode}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">State</label>
              <select
                className="form-select"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
              >
                <option value="">Select State</option>
                {INDIAN_STATES.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <div className="form-group">
              <label className="form-label">Pharmacy License Number</label>
              <input
                type="text"
                className="form-input"
                name="licenseNumber"
                placeholder="License number"
                value={formData.licenseNumber}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">GST Number</label>
              <input
                type="text"
                className="form-input"
                name="gstNumber"
                placeholder="15-digit GST number"
                value={formData.gstNumber}
                onChange={handleInputChange}
              />
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
          {step > 1 && (
            <button
              type="button"
              className="btn btn-outline"
              style={{ flex: 1, padding: '12px' }}
              onClick={() => setStep(step - 1)}
              disabled={loading}
            >
              Previous
            </button>
          )}
          <button
            type="button"
            className="btn btn-primary"
            style={{ flex: 1, padding: '12px' }}
            onClick={handleNextStep}
            disabled={loading}
          >
            {loading ? 'Processing...' : step === 4 ? 'Register' : 'Next'}
          </button>
        </div>

        <p className="auth-footer">
          Already have an account?
          <Link to="/login" className="auth-link">Login here</Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
