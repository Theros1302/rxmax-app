import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Heart } from 'lucide-react';
import api from '../services/api';

const LoginPage = ({ onLoginSuccess, store }) => {
  const navigate = useNavigate();
  const { slug } = useParams();
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requestId, setRequestId] = useState('');
  const otpRefs = useRef([]);

  useEffect(() => {
    if (slug) {
      localStorage.setItem('storeSlug', slug);
    }
  }, [slug]);

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 10) {
      setPhone(value);
      setError('');
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (phone.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    try {
      const result = await api.sendOtp('+91' + phone);
      setRequestId(result.requestId);
      setStep('otp');
      setError('');
      otpRefs.current[0]?.focus();
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otpValue = otp.join('');

    if (otpValue.length !== 6) {
      setError('Please enter a complete 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const result = await api.verifyOtp('+91' + phone, otpValue, requestId);
      onLoginSuccess(result.patient);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToPhone = () => {
    setStep('phone');
    setOtp(['', '', '', '', '', '']);
    setError('');
  };

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div className="header" style={{ marginBottom: '2rem' }}>
        <div className="flex-center" style={{ gap: '0.75rem', marginBottom: '1rem' }}>
          <Heart size={32} fill="white" stroke="white" />
          <h1 style={{ margin: 0 }}>RxMax</h1>
        </div>
        {store && (
          <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '600' }}>
            Welcome to {store.name}
          </p>
        )}
        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', opacity: 0.9 }}>Your trusted pharmacy companion</p>
      </div>

      <div style={{ flex: 1, padding: '0 1rem' }}>
        {step === 'phone' ? (
          <form onSubmit={handleSendOtp}>
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ marginBottom: '0.5rem' }}>Welcome Back!</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                Enter your phone number to get started
              </p>

              <div className="form-group">
                <label>Phone Number</label>
                <div className="input-group">
                  <div className="input-group-prefix">+91</div>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={phone}
                    onChange={handlePhoneChange}
                    disabled={loading}
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <p style={{ color: 'var(--danger)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading || phone.length !== 10}
              style={{ marginTop: '2rem' }}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Sending OTP...
                </>
              ) : (
                'Send OTP'
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <div style={{ marginBottom: '2rem' }}>
              <button
                type="button"
                onClick={handleBackToPhone}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--secondary)',
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  marginBottom: '1rem'
                }}
              >
                ← Change Number
              </button>

              <h2 style={{ marginBottom: '0.5rem' }}>Enter OTP</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                We've sent a 6-digit code to +91 {phone}
              </p>

              <div className="otp-inputs">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (otpRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength="1"
                    className={`otp-input ${digit ? 'filled' : ''}`}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    disabled={loading}
                  />
                ))}
              </div>

              {error && (
                <p style={{ color: 'var(--danger)', fontSize: '0.875rem', marginTop: '1.5rem', textAlign: 'center' }}>
                  {error}
                </p>
              )}

              <p style={{ color: 'var(--text-light)', fontSize: '0.8rem', marginTop: '1.5rem', textAlign: 'center' }}>
                Didn't receive? <button
                  type="button"
                  onClick={handleSendOtp}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--secondary)',
                    cursor: 'pointer',
                    padding: 0,
                    fontSize: 'inherit',
                    fontWeight: '600'
                  }}
                >
                  Resend OTP
                </button>
              </p>

              <div style={{
                background: 'var(--light-bg)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '0.75rem',
                marginTop: '2rem',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                textAlign: 'center'
              }}>
                Demo: Use OTP <strong>123456</strong> to login
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading || otp.some(d => !d)}
              style={{ marginTop: '2rem' }}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Verifying...
                </>
              ) : (
                'Verify & Continue'
              )}
            </button>
          </form>
        )}
      </div>

      <div style={{
        padding: '1.5rem 1rem',
        textAlign: 'center',
        borderTop: '1px solid var(--border)',
        marginTop: 'auto'
      }}>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', margin: '0 0 0.75rem 0' }}>
          By continuing, you agree to our Terms and Privacy Policy
        </p>
        <a href="/privacy" style={{
          fontSize: '0.8rem',
          color: 'var(--secondary)',
          textDecoration: 'none',
          fontWeight: '600'
        }}>
          Privacy Policy
        </a>
      </div>
    </div>
  );
};

export default LoginPage;
