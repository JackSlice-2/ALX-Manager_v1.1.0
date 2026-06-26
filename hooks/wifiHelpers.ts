// File: app/utils/wifiHelpers.ts
import * as Location from 'expo-location';
import { PermissionsAndroid, Platform } from 'react-native';
import WifiManager from 'react-native-wifi-reborn';

export type NetworkType = {
  ssid: string;
  bssid?: string;
  level?: number;
  hidden?: boolean;
};

// --------------------------- Permissions ---------------------------
export const ensureLocationPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;
  try {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Permissão de Localização',
        message: 'A localização é necessária para escanear e conectar redes Wi-Fi.',
        buttonPositive: 'OK',
      }
    );
    return result === PermissionsAndroid.RESULTS.GRANTED;
  } catch (e) {
    console.warn('WIFI: Permission error', e);
    return false;
  }
};

export const isSystemLocationEnabled = async (): Promise<boolean> => {
  try { return await Location.hasServicesEnabledAsync(); }
  catch { return true; }
};

// --------------------------- Normalize Wi-Fi ---------------------------
export const normalizeWifiResults = (rawResults: any[] | null): NetworkType[] => {
  if (!rawResults) return [];
  return rawResults
    .map(r => ({
      ssid: r.SSID ?? r.ssid ?? '',
      bssid: r.BSSID ?? r.bssid,
      level: r.level ?? r.signalLevel ?? r.levelInDb,
    }))
    .filter(n => n.ssid && n.ssid !== '<unknown ssid>');
};

// --------------------------- Verify Connection ---------------------------
export const verifyConnection = async (timeoutMs = 7000): Promise<boolean> => {
  const url = 'http://192.168.4.1/req_info_datalogger';
  
  try {
    // 1. Force Android to use Wi-Fi for all network requests in this app session
    if (Platform.OS === 'android') {
      await WifiManager.forceWifiUsageWithOptions(true, { noInternet: false });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    // 2. Perform the fetch
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    return res.status === 200;
  } catch (err) {
    console.warn('[VerifyConnection] Failed:', err);
    
    // 3. Optional: release the force if it fails, or keep it true until disconnect
    // if (Platform.OS === 'android') await WifiManager.forceWifiUsage(false);
    
    return false;
  }
};