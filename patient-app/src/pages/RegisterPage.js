import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { notify } from '../components/Toast';

/**
 * Patient profile completion screen.
 * Shown immediately after OTP verify if `patient.name` is empty (i.e. fresh signup).
 * Captures name, DOB, gender, address — fields the OTP-only login could not.
 */
const RegisterPage = ({ store, patient, onComplete }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: patient?.name || '',
    email: patient?.email || '',
    date_of_birth: patient?.date_of_birth || '',
    gender: patient?.gender || '',
    blood_group: patient?.blood_group || '',
    address: patient?.address || '',
    city: patient?.city || '',
    pincode: patient?.pincode || '',
    allergies: '',
    conditions: '',
  });
  const [saving, setSaving] = useState(false);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');

  const set = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) return setError('Please enter your full name');
    if (!form.address.trim() || !form.city.trim() || !form.pincode.trim()) {
      return setError('Address, city and pincode are required for delivery');
    }
    if (form.pincode && !/^\d{6}$/.test(form.pincode)) {
      return setError('Pincode must be 6 digits');
    }
    if (!consent) return setError('Please confirm consent to continue');

    setSaving(true);
    try {
      const updates = {
        name: form.name.trim(),
        email: form.email.trim() || null,
        date_of_birth: form.date_of_birth || null,
        gender: form.gender || null,
        blood_group: form.blood_group || null,
        address: form.address.trim(),
        city: form.city.trim(),
        pincode: form.pincode.trim(),
        allergies: form.allergies.split(',').map((s) => s.trim()).filter(Boolean),
        conditions: form.conditions.split(',').map((s) => s.trim()).filter(Boolean),
      };
      const result = await api.completePatientProfile(updates);
      notify.success(`Welcome, ${form.name.split(' ')[0]}!`);
      if (typeof onComplete === 'function') onComplete(result?.patient || result);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Could not save your details');
      notify.error(err.message || 'Could not save your details');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '20px 16px 100px', maxWidth: 520, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1B4F72', marginBottom: 4 }}>
          Welcome to {store?.name || 'RxMax'}
        </h1>
        <p style={{ color: '#6b7280', fontSize: 14 }}>
          A few details to set up your account. Takes about 60 seconds.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', padding: 10, borderRadius: 6, fontSize: 14 }}>
            {error}
          </div>
        )}

        <Field label="Full name *">
          <input type="text" value={form.name} onChange={set('name')} required placeholder="As on your prescription" />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Date of birth">
            <input type="date" value={form.date_of_birth} onChange={set('date_of_birth')} />
          </Field>
          <Field label="Gender">
            <select value={form.gender} onChange={set('gender')}>
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Email">
            <input type="email" value={form.email} onChange={set('email')} placeholder="optional" />
          </Field>
          <Field label="Blood group">
            <select value={form.blood_group} onChange={set('blood_group')}>
              <option value="">Select</option>
              {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map((bg) => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Address *">
          <textarea value={form.address} onChange={set('address')} required rows={2}
            placeholder="House/Flat, Street, Area" />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
          <Field label="City *">
            <input type="text" value={form.city} onChange={set('city')} required placeholder="e.g. Hyderabad" />
          </Field>
          <Field label="Pincode *">
            <input type="text" value={form.pincode} onChange={set('pincode')} required placeholder="6 digits"
              maxLength={6} pattern="\d{6}" />
          </Field>
        </div>

        <Field label="Allergies (optional, comma-separated)">
          <input type="text" value={form.allergies} onChange={set('allergies')}
            placeholder="e.g. Penicillin, Shellfish" />
        </Field>

        <Field label="Existing conditions (optional, comma-separated)">
          <input type="text" value={form.conditions} onChange={set('conditions')}
            placeholder="e.g. Diabetes, Hypertension" />
        </Field>

        <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 12, color: '#374151', padding: '12px', background: '#f9fafb', borderRadius: 6, cursor: 'pointer' }}>
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)}
            style={{ marginTop: 2, flexShrink: 0 }} />
          <span>
            I agree to share my personal and health information with {store?.name || 'this pharmacy'} for the purpose of medicine fulfilment and refill reminders. I understand my data is processed under India's Digital Personal Data Protection Act, 2023, and I can request its deletion at any time by contacting the pharmacy.
          </span>
        </label>

        <button type="submit" disabled={saving}
          style={{
            background: '#1B4F72', color: 'white', border: 'none', padding: '14px 16px',
            borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: saving ? 'wait' : 'pointer',
            opacity: saving ? 0.7 : 1, marginTop: 8,
          }}>
          {saving ? 'Saving…' : 'Complete registration'}
        </button>

        <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', marginTop: 4 }}>
          Your details are shared only with {store?.name || 'your pharmacy'}.
        </p>
      </form>
    </div>
  );
};

const Field = ({ label, children }) => (
  <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: '#374151' }}>
    <span>{label}</span>
    {children}
  </label>
);

export default RegisterPage;
