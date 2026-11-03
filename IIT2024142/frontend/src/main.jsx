import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

// Global error handling for unhandled promise rejections
// This helps catch errors from Stripe or other third-party scripts that might reject with 'undefined'
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason === undefined) {
    console.warn('Caught unhandled promise rejection with "undefined" reason. This is often caused by blocked third-party scripts (like Stripe beacons).');
    event.preventDefault(); // Prevent noise in the console for known harmless cases
  } else {
    console.error('Unhandled promise rejection:', event.reason);
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ToastProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ToastProvider>
  </StrictMode>,
);

