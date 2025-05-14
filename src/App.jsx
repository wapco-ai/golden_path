import React from 'react';
// import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
<<<<<<< Updated upstream
  const hideHeaderFooter = location.pathname === '/login' || location.pathname === '/Profile' || location.pathname === '/lang' 
  || location.pathname === '/location' || location.pathname === '/Routing' || location.pathname === '/';
=======
  const hideHeaderFooter = location.pathname === '/login' || location.pathname === '/Profile' || location.pathname === '/lang' || location.pathname === '/location';
>>>>>>> Stashed changes

  return (
    <div className="app">
      {!hideHeaderFooter && <Header />}
      <main className={`main-content ${hideHeaderFooter ? 'no-header-footer-layout' : ''}`}>
        <Routes>
          {/* <Route path="/" element={
            <RequireAuth>
              <HomePage />
            </RequireAuth>
          } /> */}
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

// const RequireAuth = ({ children }) => {  
//   // Check if user is logged in (from local storage or context)  
//   const isLoggedIn = localStorage.getItem('user') !== null;  
  
//   if (!isLoggedIn) {  
//     // Redirect to login if not logged in  
//     return <Navigate to="/login" replace />;  
//   }  
  
//   return children;  
// };  

export default App;