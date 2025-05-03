import React from 'react';
// import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';  
import { HomePage } from './pages/HomePage';
import MapPage from './pages/MapPage';
import Profile from './pages/Profile';
import { QRScanPage } from './pages/QRScanPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import LoginPage from './pages/LoginPage';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import './App.css';

const AppContent = () => {
  const location = useLocation();
  const hideHeaderFooter = location.pathname === '/login' || location.pathname === '/Profile';

  return (
    <div className="app">
      {!hideHeaderFooter && <Header />}
      <main className={`main-content ${hideHeaderFooter ? 'no-header-footer-layout' : ''}`}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/qr-scan" element={<QRScanPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/404" element={<NotFoundPage />} />
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