
// --- CRITICAL BROWSER SHIMS (MUST BE FIRST) ---
if (typeof (window as any).process === 'undefined') {
  (window as any).process = { env: {} };
}

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Global Error Catcher for easier debugging on Vercel
window.addEventListener('error', (event) => {
  console.error('[RUNTIME ERROR]', event.error);
  // Re-display on screen if it's blank
  const root = document.getElementById('root');
  if (root && root.innerHTML === '') {
    root.innerHTML = `<div style="padding: 20px; color: white; background: #900; font-family: monospace;">
      <h1>System Error</h1>
      <p>${event.error?.message || 'Unknown Error'}</p>
      <pre>${event.error?.stack || ''}</pre>
    </div>`;
  }
});

console.log('[SYSTEM] Initializing App...');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("[SYSTEM] CRITICAL: Could not find root element to mount to!");
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log('[SYSTEM] App Rendered Successfully.');
} catch (error) {
  console.error('[SYSTEM] CRITICAL Error during render:', error);
}
