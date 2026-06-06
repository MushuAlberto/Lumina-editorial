import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register Service Worker for PWA capabilities
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('Lumina Service Worker registrado con éxito:', reg.scope);
      })
      .catch((err) => {
        console.error('Error al registrar el Service Worker de Lumina:', err);
      });
  });
} else if ('serviceWorker' in navigator) {
  // Register also in dev mode to make installation testing fully accessible
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('Lumina Service Worker (Dev Mode) registrado con éxito:', reg.scope);
      })
      .catch((err) => {
        console.error('Error al registrar el Service Worker de Lumina en Dev:', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

