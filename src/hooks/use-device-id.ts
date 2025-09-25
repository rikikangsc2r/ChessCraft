"use client";

import { useEffect, useState } from 'react';

const generateUniqueId = () => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

export function useDeviceId(): string {
  const [deviceId, setDeviceId] = useState<string>('');

  useEffect(() => {
    let storedId = window.localStorage.getItem('chess-deviceId');
    if (!storedId) {
      storedId = generateUniqueId();
      window.localStorage.setItem('chess-deviceId', storedId);
    }
    setDeviceId(storedId);
  }, []);

  return deviceId;
}
