import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, CheckCircle, ArrowRight, ShoppingCart } from 'lucide-react';
import api from '../services/api';

const UploadPrescriptionPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [step, setStep] = useState('choose'); // choose, preview, scanning, results
  const [preview, setPreview] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [doctorName, setDoctorName] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);

  const handleFileSelect = (file) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target.result);
        setStep('preview');
        setError('');
      };
      reader.readAsDataURL(file);
    } else {
      setError('Please select a valid image file');
    }
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleScanPrescription = async () => {
    if (!preview) return;

    setScanning(true);
    setError('');
    setStep('scanning');

    try {
      const result = await api.uploadPrescription(preview, doctorName, hospitalName);
      setMedicines(result.medicines || []);
      setStep('results');
    } catch (err) {
      setError(err.message || 'Failed to scan prescription');
      setStep('preview');
    } finally {
      setScanning(false);
    }
  };

  const handleOrderAll = () => {
    if (medicines.length === 0) return;
    // Store medicines for order page
    localStorage.setItem('cartMedicines', JSON.stringify(medicines));
    navigate('/order');
  };

  const handleBackToChoose = () => {
    setStep('choose');
    setPreview(null);
    setMedicines([]);
  };

  return (
    <div className="page">
      <div className="header">
        <h1>Upload Prescription</h1>
        <p className="header-subtitle">AI-powered prescription scanning</p>
      </div>

      {step === 'choose' && (
        <>
          <div className="section-title">Step 1: Choose Image</div>
          <div
            className={`upload-zone ${dragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleCameraClick}
          >
            <div className="upload-zone-icon">📸</div>
            <div className="upload-zone-text">
              <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Tap to take photo or drag image here</p>
              <p style={{ fontSize: '0.8rem', margin: 0 }}>Supported: JPG, PNG (max 5MB)</p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
            capture="environment"
          />

          {error && (
            <div style={{
              background: '#F8D7DA',
              border: '1px solid #F5C6CB',
              borderRadius: '8px',
              padding: '0.75rem',
              marginTop: '1rem',
              color: '#721C24',
              fontSize: '0.9rem'
            }}>
              {error}
            </div>
          )}
        </>
      )}

      {step === 'preview' && (
        <>
          <div className="section-title">Step 2: Preview Image</div>
          <div style={{
            background: 'var(--light-bg)',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            <img
              src={preview}
              alt="Prescription Preview"
              style={{
                maxWidth: '100%',
                maxHeight: '300px',
                borderRadius: '8px',
                marginBottom: '1rem'
              }}
            />
            <button
              onClick={handleCameraClick}
              className="btn btn-secondary"
              style={{ fontSize: '0.9rem' }}
            >
              <Camera size={18} />
              Retake Photo
            </button>
          </div>

          <div className="form-group">
            <label>Doctor Name (Optional)</label>
            <input
              type="text"
              placeholder="e.g., Dr. Rajesh Kumar"
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Hospital/Clinic Name (Optional)</label>
            <input
              type="text"
              placeholder="e.g., Apollo Hospital"
              value={hospitalName}
              onChange={(e) => setHospitalName(e.target.value)}
            />
          </div>

          <button
            onClick={handleScanPrescription}
            className="btn btn-primary btn-block"
            disabled={scanning}
          >
            {scanning ? (
              <>
                <span className="spinner"></span>
                Scanning Prescription...
              </>
            ) : (
              <>
                <ArrowRight size={18} />
                Scan Prescription
              </>
            )}
          </button>

          <button
            onClick={handleBackToChoose}
            className="btn btn-secondary btn-block"
            style={{ marginTop: '0.75rem' }}
          >
            Back
          </button>
        </>
      )}

      {step === 'scanning' && (
        <>
          <div className="section-title">Step 3: AI Scanning in Progress</div>
          <div style={{
            background: 'var(--light-bg)',
            borderRadius: '12px',
            padding: '2rem 1rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔍</div>
            <h3>Analyzing Prescription</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Our AI is reading your prescription and extracting medicine details...
            </p>
            <div className="scanning-progress">
              <div className="scanning-bar"></div>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
              This may take a moment
            </p>
          </div>
        </>
      )}

      {step === 'results' && (
        <>
          <div className="section-title">Step 4: Extracted Medicines</div>

          {medicines.length > 0 ? (
            <>
              <div style={{
                background: '#D4EDDA',
                border: '1px solid #C3E6CB',
                borderRadius: '8px',
                padding: '0.75rem',
                marginBottom: '1rem',
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'flex-start'
              }}>
                <CheckCircle size={20} color="#155724" style={{ marginTop: '0.25rem', flexShrink: 0 }} />
                <div>
                  <p style={{ margin: '0 0 0.25rem 0', fontWeight: '600', color: '#155724', fontSize: '0.9rem' }}>
                    {medicines.length} medicine{medicines.length > 1 ? 's' : ''} found
                  </p>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#155724' }}>
                    Review and add to cart to order
                  </p>
                </div>
              </div>

              {medicines.map(medicine => (
                <div key={medicine.id} className="card">
                  <div style={{ marginBottom: '0.75rem' }}>
                    <p className="card-title">{medicine.name}</p>
                    <p className="card-subtitle">{medicine.dosage}</p>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Qty: <strong>{medicine.quantity}</strong>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {medicine.instruction && <>Instruction: <strong>{medicine.instruction}</strong></>}
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={handleOrderAll}
                className="btn btn-primary btn-block"
                style={{ marginTop: '1.5rem' }}
              >
                <ShoppingCart size={18} />
                Add All to Cart
              </button>
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <h3>No medicines found</h3>
              <p>The AI couldn't extract medicines from the prescription. Please try again with a clearer image.</p>
              <button
                onClick={handleBackToChoose}
                className="btn btn-secondary"
              >
                Upload Again
              </button>
            </div>
          )}

          {!medicines.length && (
            <button
              onClick={handleBackToChoose}
              className="btn btn-secondary btn-block"
            >
              Back
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default UploadPrescriptionPage;
