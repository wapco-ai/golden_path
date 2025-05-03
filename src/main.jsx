// main.jsx  
import React from 'react';  
import ReactDOM from 'react-dom/client';  
import App from './App.jsx';  
import './index.css';  

// Register service worker for PWA  
if ('serviceWorker' in navigator) {  
  window.addEventListener('load', async () => {  
    try {  
      const registration = await navigator.serviceWorker.register('/sw.js');  
      console.log('Service Worker registered with scope:', registration.scope);  
      
      // Add a listener for updates  
      registration.onupdatefound = () => {  
        const installingWorker = registration.installing;  
        if (installingWorker == null) {  
          return;  
        }  
        installingWorker.onstatechange = () => {  
          if (installingWorker.state === 'installed') {  
            if (navigator.serviceWorker.controller) {  
              console.log('New content is available; please refresh.');  
              // You can add notification here  
            } else {  
              console.log('Content is cached for offline use.');  
            }  
          }  
        };  
      };  
    } catch (error) {  
      console.error('Service Worker registration failed:', error);  
    }  
  });  
}  

ReactDOM.createRoot(document.getElementById('root')).render(  
  <React.StrictMode>  
    <App />  
  </React.StrictMode>,  
);  