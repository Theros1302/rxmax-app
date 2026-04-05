import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit2, X, Plus, LogOut } from 'lucide-react';
import api from '../services/api';

const ProfilePage = ({ patient, onLogout }) => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: patient?.name || '',
    email: patient?.email || '',
    address: patient?.address || '',
    phone: patient?.phone || '',
    dateOfBirth: patient?.dateOfBirth || '',
    gender: patient?.gender || ''
  });
  const [allergies, setAllergies] = useState(patient?.allergies || []);
  const [healthConditions, setHealthConditions] = useState(patient?.healthConditions || []);
  const [newAllergy, setNewAllergy] = useState('');
  const [newCondition, setNewCondition] = useState('');
  const [saving, setSaving] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddAllergy = () => {
    if (newAllergy.trim() && !allergies.includes(newAllergy)) {
      setAllergies([...allergies, newAllergy]);
      setNewAllergy('');
    }
  };

  const handleRemoveAllergy = (allergy) => {
    setAllergies(allergies.filter(a => a !== allergy));
  };

  const handleAddCondition = () => {
    if (newCondition.trim() && !healthConditions.includes(newCondition)) {
      setHealthConditions([...healthConditions, newCondition]);
      setNewCondition('');
    }
  };

  const handleRemoveCondition = (condition) => {
    setHealthConditions(healthConditions.filter(c => c !== condition));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = {
        ...formData,
        allergies,
        healthConditions
      };
      await api.updatePatientProfile(updates);
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (error) {
      alert('Failed to update profile: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    onLogout();
    navigate('/login');
  };

  return (
    <div className="page">
      <div className="header">
        <h1>My Profile</h1>
        <p className="header-subtitle">Personal information and settings</p>
      </div>

      {/* Profile Info */}
      <div className="section-title">
        Personal Information
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            style={{
              float: 'right',
              background: 'none',
              border: 'none',
              color: 'var(--secondary)',
              cursor: 'pointer',
              padding: 0,
              fontSize: '1rem'
            }}
          >
            <Edit2 size={18} />
          </button>
        )}
      </div>

      {!isEditing ? (
        // View Mode
        <>
          <div className="card">
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', margin: 0 }}>Full Name</p>
              <p style={{ fontWeight: '600', marginTop: '0.25rem' }}>{patient?.name}</p>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', margin: 0 }}>Phone</p>
              <p style={{ fontWeight: '600', marginTop: '0.25rem' }}>{patient?.phone}</p>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', margin: 0 }}>Email</p>
              <p style={{ fontWeight: '600', marginTop: '0.25rem' }}>{patient?.email}</p>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', margin: 0 }}>Date of Birth</p>
              <p style={{ fontWeight: '600', marginTop: '0.25rem' }}>
                {patient?.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString('en-IN') : 'Not set'}
              </p>
            </div>

            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', margin: 0 }}>Address</p>
              <p style={{ fontWeight: '600', marginTop: '0.25rem' }}>{patient?.address}</p>
            </div>
          </div>

          {/* Allergies */}
          <div className="section-title">Allergies</div>
          {allergies.length > 0 ? (
            <div className="card">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {allergies.map(allergy => (
                  <span
                    key={allergy}
                    className="tag"
                    style={{
                      background: '#F8D7DA',
                      color: '#721C24',
                      border: '1px solid #F5C6CB'
                    }}
                  >
                    {allergy}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="card">
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>No allergies recorded</p>
            </div>
          )}

          {/* Health Conditions */}
          <div className="section-title">Health Conditions</div>
          {healthConditions.length > 0 ? (
            <div className="card">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {healthConditions.map(condition => (
                  <span
                    key={condition}
                    className="tag"
                    style={{
                      background: 'var(--light-bg)',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    {condition}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="card">
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>No health conditions recorded</p>
            </div>
          )}

          {/* Family Members */}
          <div className="section-title">Family Members</div>
          {patient?.familyMembers && patient.familyMembers.length > 0 ? (
            <>
              {patient.familyMembers.map(member => (
                <div key={member.id} className="card">
                  <p className="card-title">{member.name}</p>
                  <p className="card-subtitle">{member.relation}</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.5rem 0 0 0' }}>
                    {member.phone}
                  </p>
                </div>
              ))}
            </>
          ) : (
            <div className="card">
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>No family members added</p>
            </div>
          )}
        </>
      ) : (
        // Edit Mode
        <>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
            />
          </div>

          {/* Edit Allergies */}
          <div className="section-title">Allergies</div>
          <div className="card" style={{ marginBottom: '1rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              {allergies.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                  {allergies.map(allergy => (
                    <span
                      key={allergy}
                      className="tag tag-removable"
                      style={{
                        background: '#F8D7DA',
                        color: '#721C24',
                        border: '1px solid #F5C6CB'
                      }}
                    >
                      {allergy}
                      <button
                        className="tag-remove-btn"
                        onClick={() => handleRemoveAllergy(allergy)}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="Add allergy (e.g., Penicillin)"
                  value={newAllergy}
                  onChange={(e) => setNewAllergy(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddAllergy()}
                  style={{
                    flex: 1,
                    padding: '0.5rem 0.75rem',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    fontSize: '0.9rem'
                  }}
                />
                <button
                  onClick={handleAddAllergy}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.9rem' }}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Edit Health Conditions */}
          <div className="section-title">Health Conditions</div>
          <div className="card" style={{ marginBottom: '1rem' }}>
            <div>
              {healthConditions.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                  {healthConditions.map(condition => (
                    <span
                      key={condition}
                      className="tag tag-removable"
                      style={{
                        background: 'var(--light-bg)',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      {condition}
                      <button
                        className="tag-remove-btn"
                        onClick={() => handleRemoveCondition(condition)}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="Add condition (e.g., Diabetes)"
                  value={newCondition}
                  onChange={(e) => setNewCondition(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddCondition()}
                  style={{
                    flex: 1,
                    padding: '0.5rem 0.75rem',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    fontSize: '0.9rem'
                  }}
                />
                <button
                  onClick={handleAddCondition}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.9rem' }}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            className="btn btn-primary btn-block"
            disabled={saving}
          >
            {saving ? (
              <>
                <span className="spinner"></span>
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>

          <button
            onClick={() => setIsEditing(false)}
            className="btn btn-secondary btn-block"
            style={{ marginTop: '0.75rem' }}
          >
            Cancel
          </button>
        </>
      )}

      {/* Logout */}
      <div className="section-title" style={{ marginTop: '2rem' }}>Account</div>
      <button
        onClick={() => setShowLogoutConfirm(true)}
        className="btn btn-danger btn-block"
      >
        <LogOut size={18} />
        Logout
      </button>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="modal-overlay" onClick={() => setShowLogoutConfirm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirm Logout</h2>
              <button
                className="modal-close"
                onClick={() => setShowLogoutConfirm(false)}
              >
                <X size={24} />
              </button>
            </div>

            <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
              Are you sure you want to logout?
            </p>

            <button
              onClick={handleLogout}
              className="btn btn-danger btn-block"
            >
              Logout
            </button>

            <button
              onClick={() => setShowLogoutConfirm(false)}
              className="btn btn-secondary btn-block"
              style={{ marginTop: '0.75rem' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
