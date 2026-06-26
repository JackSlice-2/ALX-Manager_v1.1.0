// File: src/hooks/usePermissionsAndStatus.ts

import * as Location from 'expo-location';
import { useCallback, useState } from 'react';
import { Linking, PermissionsAndroid, Platform } from 'react-native';
import WifiManager from 'react-native-wifi-reborn';

/**
 * Custom hook to manage location and Wi-Fi system status and permissions.
 */
export function usePermissionsAndStatus() {
  const [wifiDisabled, setWifiDisabled] = useState(false);
  const [locationDisabled, setLocationDisabled] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const ensureLocationPermission = useCallback(async (): Promise<boolean> => {
    setErrorMessage('');
    console.log('📡 WIFI: Checking location permission...');
    
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
      
      const granted = result === PermissionsAndroid.RESULTS.GRANTED;
      console.log('📡 WIFI: Location permission result:', granted ? 'GRANTED' : 'DENIED');
      
      if (!granted) {
          setErrorMessage('Permissão de localização é necessária para escanear redes.');
      }
      return granted;
      
    } catch (e) {
      console.warn('📡 WIFI: ensureLocationPermission error', e);
      setErrorMessage('Erro ao solicitar permissão de localização.');
      return false;
    }
  }, []);

  const isSystemLocationEnabled = useCallback(async (): Promise<boolean> => {
    console.log('📡 WIFI: Checking if system location (GPS) is enabled...');
    try {
      const enabled = await Location.hasServicesEnabledAsync();
      console.log('📡 WIFI: GPS enabled:', enabled);
      if (!enabled) {
          setErrorMessage('Ative a localização do sistema (GPS) para escanear redes.');
      }
      return enabled;
    } catch (e) {
      // Be permissive so we don't block scanning if API fails
      console.warn('📡 WIFI: isSystemLocationEnabled check error', e);
      return true;
    }
  }, []);

  const isWifiEnabled = useCallback(async (): Promise<boolean> => {
    try {
        const enabled = await WifiManager.isEnabled();
        console.log('📡 WIFI: isEnabled ->', enabled);
        if (!enabled) {
            setErrorMessage('Wi-Fi está desativado.');
        }
        return enabled;
    } catch (err) {
        console.warn('📡 WIFI: isWifiEnabled check error', err);
        return false;
    }
  }, []);


  const checkAllStatus = useCallback(async (): Promise<boolean> => {
    setWifiDisabled(false);
    setLocationDisabled(false);
    setErrorMessage('');
    
    // 1. Check Location Permission (Android only)
    const permissionGranted = await ensureLocationPermission();
    if (!permissionGranted) {
      setLocationDisabled(true);
      return false;
    }

    // 2. Check System Location (GPS) Enabled
    const gpsEnabled = await isSystemLocationEnabled();
    if (!gpsEnabled) {
      setLocationDisabled(true);
      return false;
    }

    // 3. Check Wi-Fi Enabled
    const wifiEnabled = await isWifiEnabled();
    if (!wifiEnabled) {
      setWifiDisabled(true);
      return false;
    }
    
    setErrorMessage('');
    return true;

  }, [ensureLocationPermission, isSystemLocationEnabled, isWifiEnabled]);


  const openWifiSettings = useCallback(() => {
    console.log('📡 WIFI: Opening Wi-Fi settings');
    if (Platform.OS === 'android') {
      // Use sendIntent for better reliability on Android
      if ((Linking as any).sendIntent) (Linking as any).sendIntent('android.settings.WIFI_SETTINGS');
      else Linking.openSettings();
    } else {
      Linking.openSettings();
    }
  }, []);

  const openLocationSettings = useCallback(() => {
    console.log('📡 WIFI: Opening Location settings');
    if (Platform.OS === 'android') {
      // Use sendIntent for better reliability on Android
      if ((Linking as any).sendIntent) (Linking as any).sendIntent('android.settings.LOCATION_SOURCE_SETTINGS');
      else Linking.openSettings();
    } else {
      Linking.openSettings();
    }
  }, []);

  return {
    wifiDisabled,
    locationDisabled,
    errorMessage,
    setErrorMessage,
    checkAllStatus,
    openWifiSettings,
    openLocationSettings,
  };
}