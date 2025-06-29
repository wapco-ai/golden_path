// main.jsx  
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import IntlProviderWrapper from './IntlProviderWrapper.jsx';
import './index.css';

import { registerSW } from 'virtual:pwa-register';

// Use the plugin's registration method instead of manual registration
const updateSW = registerSW({
  onNeedRefresh() {
    console.log('New content is available; please refresh.');
    // You can show a UI prompt to refresh here
  },
  onOfflineReady() {
    console.log('Content is cached for offline use.');
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
