import { NativeModules, PermissionsAndroid, Platform } from 'react-native';

// --------------------------- Permissions ---------------------------

export const ensureBluetoothPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;

  try {
    // Android 12+ (API 31+)
    if (Platform.Version >= 31) {
      const result = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ]);

      const scanGranted =
        result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] ===
        PermissionsAndroid.RESULTS.GRANTED;

      const connectGranted =
        result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] ===
        PermissionsAndroid.RESULTS.GRANTED;

      return scanGranted && connectGranted;
    }

    // Android 11 and below
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Permissão de Bluetooth',
        message:
          'A localização é necessária para encontrar dispositivos Bluetooth.',
        buttonPositive: 'OK',
      }
    );

    return result === PermissionsAndroid.RESULTS.GRANTED;
  } catch (e) {
    console.warn('[Bluetooth] Permission error:', e);
    return false;
  }
};

export const isBluetoothEnabled = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;

  try {
    return await NativeModules.BluetoothHelper.isBluetoothEnabled();
  } catch (e) {
    console.warn('[Bluetooth] Enabled check failed:', e);
    return false;
  }
};