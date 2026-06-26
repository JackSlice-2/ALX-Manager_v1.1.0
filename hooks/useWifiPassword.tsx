// File: hooks/useWifiPassword.ts
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';

const PASSWORD_KEY_PREFIX = 'wifi_password_';

export default function useWifiPassword(ssid: string | null) {
  const [password, setPassword] = useState<string | null>(null);

  // Load password from secure storage
  useEffect(() => {
    if (!ssid) {
      setPassword(null);
      return;
    }

    const loadPassword = async () => {
      try {
        const stored = await SecureStore.getItemAsync(PASSWORD_KEY_PREFIX + ssid);
        if (stored) setPassword(stored);
      } catch (err) {
        console.warn('useWifiPassword: failed to load password', err);
      }
    };

    loadPassword();
  }, [ssid]);

  // Save password to secure storage
  const savePassword = async (newPassword: string) => {
    if (!ssid) return;

    try {
      await SecureStore.setItemAsync(PASSWORD_KEY_PREFIX + ssid, newPassword);
      setPassword(newPassword);
    } catch (err) {
      console.warn('useWifiPassword: failed to save password', err);
    }
  };

  // Remove password if needed
  const removePassword = async () => {
    if (!ssid) return;

    try {
      await SecureStore.deleteItemAsync(PASSWORD_KEY_PREFIX + ssid);
      setPassword(null);
    } catch (err) {
      console.warn('useWifiPassword: failed to remove password', err);
    }
  };

  return { password, savePassword, removePassword };
}
