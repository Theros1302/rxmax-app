import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import api from './services/api';

// Pages
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import UploadPrescriptionPage from './pages/UploadPrescriptionPage';
import PrescriptionsPage from './pages/PrescriptionsPage';
import OrderPage from './pages/OrderPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import RefillsPage from './pages/RefillsPage';
import ProfilePage from './pages/ProfilePage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';

// Components
import BottomNav from './components/BottomNav';

function StoreRouter() {
  const { slug } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (slug) {
      localStorage.setItem('storeSlug', slug);
      // Redirect to home after saving the store slug
      navigate('/', { replace: true });
    }
  }, [slug, navigate]);

  return null;
}

import { ToastHost } from './components/Toast';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Read slug from URL first (avoids race condition with StoreRouter)
        var pathMatch = window.location.pathname.match(/^\/store\/(.+)/);
        var slug;
        if (pathMatch) {
          slug = pathMatch[1];
          localStorage.setItem('storeSlug', slug);
        } else {
          slug = localStorage.getItem('storeSlug') || 'apollo';
        }

        const storeData = await api.getStoreBySlug(slug);
        setStore(storeData);

        const token = localStorage.getItem('authToken');
        if (token) {
          const profile = await api.getPatientProfile();
          setPatient(profile);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Initialization failed:', error);
        localStorage.removeItem('authToken');
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  const handleLogin = (patientData) => {
    setPatient(patientData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    api.logout();
    setIsAuthenticated(false);
    setPatient(null);
  };

  if (loading) {
    return (
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="text-center" style={{ paddingTop: '50vh' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="container">
        {!store ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '1rem' }}>
            <div style={{ textAlign: 'center' }}>
              <h2>Store Not Found</h2>
              <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>
                Please use your pharmacy's unique link to access this app.
              </p>
            </div>
          </div>
        ) : isAuthenticated ? (
          <>
            <Routes>
              <Route path="/" element={<HomePage patient={patient} store={store} />} />
              <Route path="/store/:slug" element={<><StoreRouter /></>} />
              <Route path="/prescriptions" element={<PrescriptionsPage />} />
              <Route path="/upload" element={<UploadPrescriptionPage />} />
              <Route path="/order" element={<OrderPage store={store} />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/orders/:id" element={<OrderDetailPage store={store} />} />
              <Route path="/refills" element={<RefillsPage />} />
              <Route path="/profile" element={<ProfilePage patient={patient} onLogout={handleLogout} store={store} />} />
              <Route path="/privacy" element={<PrivacyPolicyPage />} />
              <Route path="/login" element={<Navigate to="/" replace />} />
            </Routes>
            <BottomNav />
          </>
        ) : (
          <Routes>
            <Route path="/store/:slug" element={<><StoreRouter /><LoginPage onLoginSuccess={handleLogin} store={store} /></>} />
            <Route path="/login" element={<LoginPage onLoginSuccess={handleLogin} store={store} />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        )}
      </div>
    <ToastHost />
      </Router>
  );
}

export default App;
