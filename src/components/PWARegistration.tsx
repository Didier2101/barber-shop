'use client';
import { useEffect } from 'react';

export default function PWARegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const registerSW = async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('SW registered:', registration);
        } catch (error) {
          console.error('SW registration failed:', error);
        }
      };
      registerSW();
    }
  }, []);

  return null;
}
