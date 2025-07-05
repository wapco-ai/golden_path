import { debugLog } from './utils/debug.js';
// main.jsx  
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import IntlProviderWrapper from './IntlProviderWrapper.jsx';
import './index.css';

// Check URL parameters for QR code location and store in session
const params = new URLSearchParams(window.location.search);
const lat = params.get('lat');
const lng = params.get('lng');
if (lat && lng) {
  sessionStorage.setItem('qrLat', lat);
  sessionStorage.setItem('qrLng', lng);
}

import { registerSW } from 'virtual:pwa-register';

// Use the plugin's registration method instead of manual registration
const updateSW = registerSW({
  onNeedRefresh() {
    debugLog('New content is available; please refresh.');
    // You can show a UI prompt to refresh here
  },
  onOfflineReady() {
    debugLog('Content is cached for offline use.');
    // You can show a "ready for offline use" message here
  }
}); 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <IntlProviderWrapper>
      <App />
    </IntlProviderWrapper>
  </React.StrictMode>,
);
