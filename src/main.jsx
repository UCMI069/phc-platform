import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  window.dispatchEvent(new CustomEvent('phc:pwa-ready'));
});

window.installPHCApp = async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    return outcome;
  }
  return 'not-available';
};

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/favicon/sw.js').then((registration) => {
      registration.addEventListener('updatefound', () => {
        if (registration.installing) {
          registration.installing.addEventListener('statechange', () => {
            if (registration.installing?.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                window.dispatchEvent(new CustomEvent('phc:sw-updated'));
              }
            }
          });
        }
      });
    }).catch((err) => {
      console.error('Service worker registration failed:', err);
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
