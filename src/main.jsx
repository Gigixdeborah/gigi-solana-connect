import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/serviceWorker.js')
      .then(reg => console.log("✅ Service Worker registered!", reg))
      .catch(err => console.error("❌ SW registration failed:", err));
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
