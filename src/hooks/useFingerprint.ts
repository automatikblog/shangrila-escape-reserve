import { useState, useEffect } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

export const useFingerprint = () => {
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getFingerprint = async () => {
      try {
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        setFingerprint(result.visitorId);
      } catch (error) {
        console.error('Error getting fingerprint:', error);
        // Fallback to a random ID stored in localStorage
        const storedId = localStorage.getItem('device_fingerprint');
        if (storedId) {
          setFingerprint(storedId);
        } else {
          const newId = `fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          localStorage.setItem('device_fingerprint', newId);
          setFingerprint(newId);
        }
      } finally {
        setIsLoading(false);
      }
    };

    getFingerprint();
  }, []);

  return { fingerprint, isLoading };
};
