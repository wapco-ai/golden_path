import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Profile from './pages/Profile';
import FinalSearch from './pages/FinalSearch';
import LangPage from './pages/LangPage';
import LoginPage from './pages/LoginPage';
import MapRouting from './pages/MapRouting';
import Routing from './pages/Routing';
import RouteOverview from './pages/RouteOverview';
import Location from './pages/Location';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import './App.css';

const AppContent = () => {
  const location = useLocation();
  const hideHeaderFooter = location.pathname === '/login' || location.pathname === '/Profile' || location.pathname === '/lang'
    || location.pathname === '/location' || location.pathname === '/' || location.pathname === '/mpr'|| location.pathname === '/fs'
    || location.pathname === '/rop' || location.pathname === '/rng';

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
  const handleClosePrompt = () => {
    setShowInstall(false);
  };
  // --- END PWA Install Prompt State ---

  return (
    <div className="app">
      {!hideHeaderFooter && <Header />}
      <main className={`main-content ${hideHeaderFooter ? 'no-header-footer-layout' : ''}`}>
        {/* Stylish PWA Install Modal Prompt */}
        {showInstall && (
          <div className="pwa-install-overlay">
            <div className="pwa-install-dialog" dir="ltr">
              <h3>Install App</h3>
              <p>For quick access, install the app on your device.</p>
              <button className="pwa-install-btn" onClick={handleInstallClick}>
                Install
              </button>
              <br />
              <button className="pwa-install-close" onClick={handleClosePrompt}>
                Close
              </button>
            </div>
          </div>
        )}
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/fs" element={<FinalSearch />} />
          <Route path="/rop" element={<RouteOverview />} />
          <Route path="/" element={<LangPage />} />
          <Route path="/mpr" element={<MapRouting/>} />
          <Route path="/rng" element={<Routing/>} />
          <Route path="/location" element={<Location />} />
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