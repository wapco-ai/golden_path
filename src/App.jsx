import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import MapPage from './pages/MapPage';
import Profile from './pages/Profile';
import LangPage from './pages/LangPage';
import { QRScanPage } from './pages/QRScanPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import LoginPage from './pages/LoginPage';
import Location from './pages/Location';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import './App.css';

const AppContent = () => {
  const location = useLocation();
  const hideHeaderFooter = location.pathname === '/login' || location.pathname === '/Profile' || location.pathname === '/lang' 
    || location.pathname === '/location' || location.pathname === '/';

  // --- PWA Install Prompt State ---
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Cleanup on unmount
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.finally(() => {
        setDeferredPrompt(null);
        setShowInstall(false);
      });
    }
  };
  // --- END PWA Install Prompt State ---

  return (
    <div className="app">
      {!hideHeaderFooter && <Header />}
      <main className={`main-content ${hideHeaderFooter ? 'no-header-footer-layout' : ''}`}>
        {/* PWA Install Button (you can style this better!) */}
        {showInstall && (
          <div style={{ position: 'fixed', zIndex: 1000, top: 10, right: 10 }}>
            <button onClick={handleInstallClick} style={{ padding: '10px 20px', fontSize: '16px' }}>
              نصب اپلیکیشن
            </button>
          </div>
        )}
        <Routes>
          <Route path="/home" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/qr-scan" element={<QRScanPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/" element={<LangPage />} />
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="/location" element={<Location />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </main>
      {!hideHeaderFooter && <Footer />}
    </div>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;