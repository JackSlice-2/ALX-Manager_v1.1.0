import { router, useFocusEffect } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  AppState,
  BackHandler,
  Linking,
  Platform,
  TouchableOpacity,
  Text,
  View,
} from 'react-native';

import WifiManager from 'react-native-wifi-reborn';
import BleManager from 'react-native-ble-manager';
import {
  BleManager as BlePlxManager,
  Device,
} from 'react-native-ble-plx';

import { openWifiSettings } from '@/utils/constants';

import useCheckAppUpdate from '@/hooks/useCheckAppUpdate';
import useCheckDrivers from '@/hooks/useCheckDrivers';
import useCheckUpdate from '@/hooks/useCheckUpdate';
import useWifiPassword from '@/hooks/useWifiPassword';

import {
  ensureLocationPermission,
  isSystemLocationEnabled,
  NetworkType,
  normalizeWifiResults,
  verifyConnection,
} from '@/hooks/wifiHelpers';

import {
  ensureBluetoothPermission,
  isBluetoothEnabled,
} from '@/hooks/bluetoothHelpers';

import IndexClient from '@/components/bluetooth/login/IndexClient';

/* ============================================================
 * BLE CONFIG
 * ========================================================== */

const BLE_DEVICE = {
  name: 'ALX-5DLG',
  address: 'F8:24:0E:B1:0A:F2',
  password: '123456',
};

const BLE_SERVICE_UUID =
  '12345678-1234-5678-1234-56789abcdef7';

const BLE_TX_UUID =
  '12345678-1234-5678-1234-56789abcdef8';

const BLE_RX_UUID =
  '12345678-1234-5678-1234-56789abcdef9';

const BLE_RX2_UUID =
  '12345678-1234-5678-1234-56789abcdefa';

const STATUS_COMMAND = [
  0xA5,
  0x00,
  0x01,
  0x00,
  0x00,
  0x00,
  0x00,
  0xD3,
  0xCA,
];

/*
 * react-native-ble-plx uses Base64 for characteristic values.
 */
const bytesToBase64 = (bytes: number[]) => {
  const binary = bytes
    .map(byte => String.fromCharCode(byte))
    .join('');

  return btoa(binary);
};

/* ============================================================
 * BLE PLX MANAGER
 * ========================================================== */

const blePlxManager = new BlePlxManager();

/* ============================================================
 * COMPONENT
 * ========================================================== */

export default function BluetoothConnect() {
  /* ==========================================================
   * WIFI STATE
   * ======================================================== */

  const [networks, setNetworks] =
    useState<NetworkType[]>([]);

  const [availableGateways, setAvailableGateways] =
    useState<string[]>([]);

  const [selectedNetwork, setSelectedNetwork] =
    useState<NetworkType | null>(null);

  const [isConnecting, setIsConnecting] =
    useState(false);

  const [showQRScanner, setShowQRScanner] =
    useState(false);

  const [wifiDisabled, setWifiDisabled] =
    useState(false);

  const [locationDisabled, setLocationDisabled] =
    useState(false);

  const [scanning, setScanning] =
    useState(false);

  const [isModalVisible, setIsModalVisible] =
    useState(false);

  const [password, setPassword] =
    useState('');

  const [errorMessage, setErrorMessage] =
    useState('');

  /* ==========================================================
   * BLE STATE
   * ======================================================== */

  const [bleStatus, setBleStatus] =
    useState('Idle');

  const [bleDeviceFound, setBleDeviceFound] =
    useState(false);

  const [bleDeviceInfo, setBleDeviceInfo] =
    useState<any>(null);

  const [bleTestRunning, setBleTestRunning] =
    useState(false);

  const [bleTestType, setBleTestType] =
    useState<'manager' | 'plx' | null>(null);

  /* ==========================================================
   * REFS
   * ======================================================== */

  const isMounted = useRef(true);

  const urlParams = {
    codigo: 'alx4gs',
    versao: '0.0.0',
    serial: '00000005',
  };

  const { savePassword } =
    useWifiPassword(
      selectedNetwork?.ssid || ''
    );

  const lastSSIDRef =
    useRef<string | null>(null);

  const connectedDeviceRef =
    useRef<string | null>(null);

  const openedWifiPanelRef =
    useRef(false);

  /* ==========================================================
   * BLUETOOTH INITIALIZATION
   * ======================================================== */

  useEffect(() => {
    const initBluetooth = async () => {
      try {
        console.log(
          '[Bluetooth] Starting react-native-ble-manager...'
        );

        await BleManager.start({
          showAlert: false,
        });

        console.log(
          '[Bluetooth] react-native-ble-manager started'
        );

        console.log(
          '[Bluetooth] Requesting permissions...'
        );

        const granted =
          await ensureBluetoothPermission();

        if (!granted) {
          console.log(
            '[Bluetooth] Permissions denied'
          );

          return;
        }

        console.log(
          '[Bluetooth] Permissions granted'
        );

        const enabled =
          await isBluetoothEnabled();

        console.log(
          '[Bluetooth] Bluetooth enabled:',
          enabled
        );
      } catch (error) {
        console.error(
          '[Bluetooth] Initialization error:',
          error
        );
      }
    };

    initBluetooth();
  }, []);

  /* ==========================================================
   * HOOKS
   * ======================================================== */

  useCheckUpdate(urlParams);
  useCheckDrivers();
  useCheckAppUpdate(urlParams);

  useFocusEffect(() => {
    const subscription =
      BackHandler.addEventListener(
        'hardwareBackPress',
        () => true
      );

    return () =>
      subscription.remove();
  });

  useEffect(() => {
    refreshPage();
  }, []);

  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
    };
  }, []);

  /* ==========================================================
   * WIFI PANEL RETURN
   * ======================================================== */

  useEffect(() => {
    const handleAppStateChange =
      async (state: string) => {
        if (
          state !== 'active' ||
          !openedWifiPanelRef.current
        ) {
          return;
        }

        console.log(
          '[WiFi Panel] User returned'
        );

        openedWifiPanelRef.current = false;

        try {
          let ssid =
            await WifiManager.getCurrentWifiSSID();

          if (
            !ssid ||
            ssid.toLowerCase().includes('unknown')
          ) {
            console.log(
              '[WiFi Panel] No valid SSID → do nothing'
            );

            return;
          }

          ssid =
            ssid.replace(/"/g, '').trim();

          if (!ssid.startsWith('ALX_4GS')) {
            console.log(
              '[WiFi Panel] Not an ALX network → ignore'
            );

            return;
          }

          console.log(
            '[WiFi Panel] Valid ALX network → opening modal'
          );

          setAvailableGateways([ssid]);
          setIsModalVisible(true);
        } catch (e) {
          console.log(
            '[WiFi Panel] Error reading SSID',
            e
          );
        }
      };

    const subscription =
      AppState.addEventListener(
        'change',
        handleAppStateChange
      );

    return () =>
      subscription.remove();
  }, []);

  /* ==========================================================
   * WIFI LISTENER
   * ======================================================== */

  useEffect(() => {
    let interval: any;

    const getCleanSSID = async () => {
      try {
        let ssid =
          await WifiManager.getCurrentWifiSSID();

        if (
          !ssid ||
          ssid.toLowerCase().includes('unknown')
        ) {
          return null;
        }

        return ssid
          .replace(/"/g, '')
          .trim();
      } catch {
        return null;
      }
    };

    const checkConnection = async () => {
      const ssid =
        await getCleanSSID();

      if (
        ssid === lastSSIDRef.current
      ) {
        return;
      }

      console.log(
        '[WiFi Listener] SSID changed:',
        ssid
      );

      lastSSIDRef.current = ssid;

      if (
        ssid &&
        ssid.startsWith('ALX_4GS')
      ) {
        console.log(
          '[WiFi Listener] Connected to ALX → opening modal'
        );

        setAvailableGateways([ssid]);
        setIsModalVisible(true);
      }
    };

    checkConnection();

    interval =
      setInterval(
        checkConnection,
        1500
      );

    return () =>
      clearInterval(interval);
  }, []);

  /* ==========================================================
   * WIFI SCAN
   * ======================================================== */

  const logScanResults =
    (rawResults: any[]) => {
      rawResults.forEach(() => {
        // Scan debugging intentionally disabled.
      });
    };

  const refreshPage =
    async () => {
      if (!isMounted.current) {
        return;
      }

      setWifiDisabled(false);
      setLocationDisabled(false);
      setNetworks([]);
      setScanning(true);
      setErrorMessage('');

      try {
        await WifiManager
          .disconnect()
          .catch(() => {});
      } catch {}

      await new Promise(
        resolve =>
          setTimeout(resolve, 800)
      );

      const granted =
        await ensureLocationPermission();

      if (!granted) {
        setLocationDisabled(true);
        setScanning(false);
        return;
      }

      const gps =
        await isSystemLocationEnabled();

      if (!gps) {
        setLocationDisabled(true);
        setScanning(false);
        return;
      }

      try {
        if (!(await WifiManager.isEnabled())) {
          setWifiDisabled(true);
          return;
        }

        const rawResults =
          await WifiManager.loadWifiList();

        if (isMounted.current) {
          logScanResults(rawResults);

          setNetworks(
            normalizeWifiResults(
              rawResults
            )
          );
        }
      } catch (e) {
        console.error(
          '[Scan] loadWifiList failed:',
          e
        );

        setLocationDisabled(true);
      } finally {
        setScanning(false);
      }
    };

  /* ==========================================================
   * QR
   * ======================================================== */

  const handleQRScan =
    (data: string) => {
      try {
        const parsed =
          JSON.parse(data);

        if (
          !parsed.ssid ||
          !parsed.password
        ) {
          setErrorMessage(
            'QR Code inválido: faltando ssid/senha.'
          );

          return;
        }

        const matched =
          networks.find(
            n =>
              n.ssid ===
              parsed.ssid
          );

        if (!matched) {
          setErrorMessage(
            `Rede não encontrada: ${parsed.ssid}`
          );

          return;
        }

        const networkWithHidden:
          NetworkType = {
          ...matched,
          hidden: !!parsed.hidden,
        };

        setSelectedNetwork(
          networkWithHidden
        );

        setPassword(
          parsed.password
        );

        setShowQRScanner(false);

        setTimeout(
          () =>
            handleConnect(
              networkWithHidden,
              parsed.password
            ),
          300
        );
      } catch {
        setErrorMessage(
          'QR Code inválido.'
        );
      }
    };

  /* ==========================================================
   * WIFI CONNECT
   * ======================================================== */

  const handleConnect =
    async (
      networkArg?: NetworkType,
      pwdArg?: string
    ) => {
      const network =
        networkArg ??
        selectedNetwork;

      const pwd =
        (pwdArg ?? password)
          ?.trim();

      const getCleanSSID =
        async () => {
          try {
            let ssid =
              await WifiManager
                .getCurrentWifiSSID();

            if (
              !ssid ||
              ssid
                .toLowerCase()
                .includes('unknown')
            ) {
              return null;
            }

            return ssid
              .replace(/"/g, '')
              .trim();
          } catch {
            return null;
          }
        };

      const currentSSID =
        await getCleanSSID();

      if (!network?.ssid) {
        return;
      }

      setIsConnecting(true);
      setErrorMessage('');

      try {
        const isAlreadyOnSsid =
          currentSSID ===
          network.ssid;

        if (isAlreadyOnSsid) {
          console.log(
            '[WiFi] Already connected → bypassing connect'
          );

          const reachable =
            await verifyConnection(
              8000
            );

          if (!reachable) {
            Alert.alert(
              'Ação necessária',
              "O Android pode bloquear redes sem internet.\n\nApós conectar, verifique a notificação e toque em:\n'Usar esta rede mesmo sem internet'."
            );

            return;
          }

          router.replace(
            './(bluetooth)/status'
          );

          return;
        }

        if (!pwd) {
          setErrorMessage(
            'SSID e Senha são necessários.'
          );

          return;
        }

        const rawResults =
          await WifiManager
            .loadWifiList()
            .catch(() => []);

        const stillVisible =
          rawResults.some(
            (n: any) =>
              n.SSID ===
              network.ssid
          );

        console.log(
          `Target still visible before connect: ${stillVisible}`
        );

        await WifiManager
          .connectToProtectedWifiSSID({
            ssid: network.ssid,
            password: pwd,
            isWEP: false,
            isHidden: false,
            timeout: 30000,
          });

        const reachable =
          await verifyConnection(
            8000
          );

        if (!reachable) {
          Alert.alert(
            'Ação necessária',
            "O Android pode bloquear redes sem internet.\n\nApós conectar, verifique a notificação e toque em: 'Usar esta rede mesmo sem internet'."
          );

          return;
        }

        savePassword(pwd);

        router.replace(
          './(bluetooth)/status'
        );
      } catch (err: any) {
        console.error(
          '[WiFi] Error:',
          err.code ||
            err.message,
          err
        );

        let msg =
          'Erro ao conectar. Tente novamente.';

        if (
          err.code ===
          'didNotFindNetwork'
        ) {
          msg =
            'Rede não encontrada para conexão automática.';
        } else if (
          err.code ===
          'authenticationError'
        ) {
          msg =
            'Senha incorreta.';
        } else if (
          err.message ===
          'TIMEOUT'
        ) {
          msg =
            'Tempo esgotado.';
        } else if (
          err.message ===
          'NOT_REACHABLE'
        ) {
          msg =
            'Conectado, mas sem resposta do dispositivo.';
        }

        setErrorMessage(msg);
      } finally {
        setIsConnecting(false);
      }
    };

  /* ==========================================================
   * WIFI MODAL
   * ======================================================== */

  const openNetworkModal =
    async () => {
      setSelectedNetwork(null);
      setPassword('');
      setErrorMessage('');

      if (Platform.OS === 'android') {
        try {
          openedWifiPanelRef.current =
            true;

          await Linking.sendIntent(
            'android.settings.panel.action.WIFI'
          );
        } catch (e) {
          console.log(
            'Panel not supported, falling back...',
            e
          );

          try {
            openedWifiPanelRef.current =
              true;

            await Linking.sendIntent(
              'android.settings.WIFI_SETTINGS'
            );
          } catch {
            openWifiSettings();
          }
        }
      } else {
        Alert.alert(
          'Conectar ao Wi-Fi',
          'O iOS não permite abrir a lista dentro do app. Deseja ir para os ajustes?',
          [
            {
              text: 'Cancelar',
              style: 'cancel',
            },
            {
              text: 'Ir para Ajustes',
              onPress: () =>
                openWifiSettings(),
            },
          ]
        );
      }
    };

  /* ==========================================================
   * BLE MANAGER TEST
   *
   * TEST ORDER:
   *
   * SCAN
   *   ↓
   * CONNECT
   *   ↓
   * GATT DISCOVERY
   *   ↓
   * TX WRITE
   *   ↓
   * RX NOTIFICATION
   *
   * This deliberately puts TX before notification so we can
   * determine exactly which operation causes Android security.
   * ======================================================== */

  const connectToALX =
    async () => {
      const address =
        BLE_DEVICE.address;

      let targetFound =
        false;

      let connected =
        false;

      setBleTestRunning(true);
      setBleTestType('manager');

      setIsConnecting(true);
      setErrorMessage('');

      setBleDeviceFound(false);
      setBleDeviceInfo(null);

      setBleStatus(
        'Starting BLE Manager...'
      );

      console.log('');
      console.log(
        '========================================'
      );
      console.log(
        '[BLE Manager] SCAN → CONNECT TEST'
      );
      console.log(
        '========================================'
      );

      let discoverSubscription:
        any = null;

      let stopSubscription:
        any = null;

      try {
        /* ----------------------------------------------------
         * PERMISSIONS
         * -------------------------------------------------- */

        console.log(
          '[BLE Manager] Checking permissions...'
        );

        const granted =
          await ensureBluetoothPermission();

        if (!granted) {
          console.log(
            '[BLE Manager] ❌ Permissions denied'
          );

          setBleStatus(
            'BLUETOOTH PERMISSION DENIED'
          );

          return;
        }

        const enabled =
          await isBluetoothEnabled();

        console.log(
          '[BLE Manager] Bluetooth enabled:',
          enabled
        );

        if (!enabled) {
          setBleStatus(
            'BLUETOOTH DISABLED'
          );

          return;
        }

        /* ----------------------------------------------------
         * 1. SCAN
         * -------------------------------------------------- */

        setBleStatus(
          'SCANNING FOR ALX-5DLG...'
        );

        console.log('');
        console.log(
          '[BLE Manager] STEP 1: SCAN'
        );

        const discovered:
          any[] = [];

        discoverSubscription =
          BleManager.onDiscoverPeripheral(
            (device: any) => {
              discovered.push(device);

              console.log(
                '[BLE Manager] DEVICE FOUND:',
                device.name,
                device.id,
                'RSSI:',
                device.rssi
              );

              const isTarget =
                device.id?.toUpperCase() ===
                  address.toUpperCase() ||
                device.name ===
                  BLE_DEVICE.name;

              if (!isTarget) {
                return;
              }

              targetFound = true;

              setBleDeviceFound(true);

              setBleDeviceInfo({
                name: device.name,
                id: device.id,
                rssi: device.rssi,
                advertising:
                  device.advertising,
              });

              setBleStatus(
                `✓ FOUND ${device.name || BLE_DEVICE.name}`
              );

              console.log('');
              console.log(
                '[BLE Manager] 🎯 TARGET FOUND'
              );

              console.log(
                '[BLE Manager] Name:',
                device.name
              );

              console.log(
                '[BLE Manager] ID:',
                device.id
              );

              console.log(
                '[BLE Manager] RSSI:',
                device.rssi
              );

              console.log(
                '[BLE Manager] Advertisement:',
                JSON.stringify(
                  device.advertising,
                  null,
                  2
                )
              );
            }
          );

        stopSubscription =
          BleManager.onStopScan(
            () => {
              console.log(
                '[BLE Manager] Scan finished.'
              );

              console.log(
                '[BLE Manager] Devices discovered:',
                discovered.length
              );

              console.log(
                '[BLE Manager] Target found:',
                targetFound
              );
            }
          );

        console.log(
          '[BLE Manager] Starting BLE scan...'
        );

        await BleManager.scan({
          serviceUUIDs: [],
          seconds: 6,
          allowDuplicates: true,
        });

        await new Promise(
          resolve =>
            setTimeout(
              resolve,
              1000
            )
        );

        if (!targetFound) {
          console.log(
            '[BLE Manager] ❌ TARGET NOT FOUND'
          );

          setBleStatus(
            'ALX-5DLG NOT FOUND'
          );

          return;
        }

        console.log(
          '[BLE Manager] ✓ TARGET FOUND'
        );

        /* ----------------------------------------------------
         * 2. CONNECT
         * -------------------------------------------------- */

        setBleStatus(
          'CONNECTING TO ALX-5DLG...'
        );

        console.log('');
        console.log(
          '[BLE Manager] STEP 2: CONNECT'
        );

        console.log(
          '[BLE Manager] Address:',
          address
        );

        try {
          await BleManager.disconnect(
            address
          );
        } catch {
          // No existing connection.
        }

        await BleManager.connect(
          address
        );

        connected = true;

        connectedDeviceRef.current =
          address;

        console.log(
          '[BLE Manager] ✓ CONNECTED'
        );

        setBleStatus(
          '✓ CONNECTED'
        );

        /* ----------------------------------------------------
         * 3. GATT DISCOVERY
         * -------------------------------------------------- */

        setBleStatus(
          'DISCOVERING GATT SERVICES...'
        );

        console.log('');
        console.log(
          '[BLE Manager] STEP 3: GATT DISCOVERY'
        );

        const services =
          await BleManager.retrieveServices(
            address
          );

        console.log(
          '[BLE Manager] ✓ SERVICES DISCOVERED'
        );

        console.log(
          '[BLE Manager] GATT:',
          JSON.stringify(
            services,
            null,
            2
          )
        );

        setBleStatus(
          '✓ GATT SERVICES FOUND'
        );

        /* ----------------------------------------------------
         * 4. TX WRITE
         * -------------------------------------------------- */

        setBleStatus(
          'TESTING TX WRITE...'
        );

        console.log('');
        console.log(
          '[BLE Manager] STEP 4: TX WRITE'
        );

        console.log(
          '[BLE Manager] STATUS:',
          STATUS_COMMAND
            .map(
              byte =>
                byte
                  .toString(16)
                  .padStart(
                    2,
                    '0'
                  )
                  .toUpperCase()
            )
            .join(' ')
        );

        console.log(
          '[BLE Manager] Writing STATUS BEFORE RX NOTIFICATION...'
        );

        await BleManager.write(
          address,
          BLE_SERVICE_UUID,
          BLE_TX_UUID,
          STATUS_COMMAND
        );

        console.log(
          '[BLE Manager] ✓ TX WRITE SUCCESS'
        );

        setBleStatus(
          '✓ TX WRITE SUCCESS'
        );

        /* ----------------------------------------------------
         * 5. RX NOTIFICATION
         * -------------------------------------------------- */

        setBleStatus(
          'ENABLING RX NOTIFICATION...'
        );

        console.log('');
        console.log(
          '[BLE Manager] STEP 5: RX NOTIFICATION'
        );

        console.log(
          '[BLE Manager] RX:',
          BLE_RX_UUID
        );

        console.log(
          '[BLE Manager] Starting RX notification...'
        );

        await BleManager.startNotification(
          address,
          BLE_SERVICE_UUID,
          BLE_RX_UUID
        );

        console.log(
          '[BLE Manager] ✓ RX NOTIFICATION ENABLED'
        );

        setBleStatus(
          '✓ RX NOTIFICATION ENABLED'
        );

        console.log('');
        console.log(
          '========================================'
        );

        console.log(
          '[BLE Manager] TEST COMPLETE'
        );

        console.log(
          '========================================'
        );

        setBleStatus(
          'BLE MANAGER TEST COMPLETE'
        );
      } catch (error: any) {
        console.error('');
        console.error(
          '========================================'
        );

        console.error(
          '[BLE Manager] ❌ TEST FAILED'
        );

        console.error(
          '========================================'
        );

        console.error(
          '[BLE Manager] Error:',
          error
        );

        console.error(
          '[BLE Manager] Error code:',
          error?.code
        );

        console.error(
          '[BLE Manager] Error message:',
          error?.message
        );

        console.error(
          '[BLE Manager] Target found:',
          targetFound
        );

        console.error(
          '[BLE Manager] Connected:',
          connected
        );

        setBleStatus(
          'BLE MANAGER ERROR'
        );

        let message =
          'Erro no teste BLE Manager.';

        const errorText =
          `${error?.message || ''}`
            .toLowerCase();

        if (
          errorText.includes(
            'connect'
          )
        ) {
          message =
            'Não foi possível conectar ao ALX-5DLG.';
        }

        if (
          errorText.includes(
            'notification'
          )
        ) {
          message =
            'Falha ao habilitar notificações BLE.';
        }

        if (
          errorText.includes(
            'write'
          )
        ) {
          message =
            'Falha ao escrever no TX BLE.';
        }

        setErrorMessage(message);
      } finally {
        if (
          discoverSubscription
        ) {
          discoverSubscription.remove();
        }

        if (
          stopSubscription
        ) {
          stopSubscription.remove();
        }

        if (connected) {
          try {
            console.log(
              '[BLE Manager] Disconnecting...'
            );

            await BleManager.disconnect(
              address
            );

            console.log(
              '[BLE Manager] Disconnected'
            );
          } catch (error) {
            console.log(
              '[BLE Manager] Disconnect error:',
              error
            );
          }
        }

        connectedDeviceRef.current =
          null;

        setIsConnecting(false);
        setBleTestRunning(false);
        setBleTestType(null);
      }
    };

  /* ==========================================================
   * BLE PLX TEST
   *
   * TEST ORDER:
   *
   * SCAN
   *   ↓
   * CONNECT
   *   ↓
   * GATT DISCOVERY
   *   ↓
   * TX WRITE
   *   ↓
   * RX MONITOR
   *
   * IMPORTANT:
   * PLX does not implement Windows-style BLE pairing.
   * This test is specifically checking what happens when
   * Android attempts the first secured GATT operation.
   * ======================================================== */

  const testBlePlx =
    async () => {
      const address =
        BLE_DEVICE.address;

      let target:
        Device | null = null;

      let connected =
        false;

      let rxSubscription:
        any = null;

      setBleTestRunning(true);
      setBleTestType('plx');

      setIsConnecting(true);
      setErrorMessage('');

      setBleDeviceFound(false);
      setBleDeviceInfo(null);

      setBleStatus(
        'Starting BLE PLX...'
      );

      console.log('');
      console.log(
        '========================================'
      );
      console.log(
        '[BLE PLX] SCAN → CONNECT TEST'
      );
      console.log(
        '========================================'
      );

      try {
        /* ----------------------------------------------------
         * 1. BLUETOOTH STATE
         * -------------------------------------------------- */

        console.log(
          '[BLE PLX] Checking Bluetooth state...'
        );

        const state =
          await blePlxManager.state();

        console.log(
          '[BLE PLX] Bluetooth state:',
          state
        );

        if (state !== 'PoweredOn') {
          console.log(
            '[BLE PLX] ❌ Bluetooth is not powered on'
          );

          setBleStatus(
            `BLUETOOTH: ${state}`
          );

          return;
        }

        /* ----------------------------------------------------
         * 2. PERMISSIONS
         * -------------------------------------------------- */

        const granted =
          await ensureBluetoothPermission();

        if (!granted) {
          console.log(
            '[BLE PLX] ❌ Permissions denied'
          );

          setBleStatus(
            'BLUETOOTH PERMISSION DENIED'
          );

          return;
        }

        /* ----------------------------------------------------
         * 3. SCAN
         * -------------------------------------------------- */

        console.log('');
        console.log(
          '[BLE PLX] STEP 1: SCAN'
        );

        setBleStatus(
          'SCANNING FOR ALX-5DLG...'
        );

        await new Promise<void>(
          (resolve, reject) => {
            let finished =
              false;

            const finish =
              () => {
                if (finished) {
                  return;
                }

                finished = true;

                try {
                  blePlxManager
                    .stopDeviceScan();
                } catch {}

                resolve();
              };

            const timeout =
              setTimeout(
                () => {
                  console.log(
                    '[BLE PLX] Scan timeout'
                  );

                  finish();
                },
                10000
              );

            try {
              blePlxManager
                .startDeviceScan(
                  null,
                  {
                    allowDuplicates: false,
                  },
                  (
                    error,
                    device
                  ) => {
                    if (error) {
                      console.log(
                        '[BLE PLX] Scan error:',
                        error
                      );

                      clearTimeout(
                        timeout
                      );

                      if (!finished) {
                        finished = true;

                        try {
                          blePlxManager
                            .stopDeviceScan();
                        } catch {}

                        reject(error);
                      }

                      return;
                    }

                    if (!device) {
                      return;
                    }

                    console.log(
                      '[BLE PLX] DEVICE FOUND:',
                      device.name,
                      device.id,
                      'RSSI:',
                      device.rssi
                    );

                    const isTarget =
                      device.id?.toUpperCase() ===
                        address.toUpperCase() ||
                      device.name ===
                        BLE_DEVICE.name;

                    if (!isTarget) {
                      return;
                    }

                    target = device;

                    console.log('');
                    console.log(
                      '[BLE PLX] 🎯 TARGET FOUND'
                    );

                    console.log(
                      '[BLE PLX] Name:',
                      device.name
                    );

                    console.log(
                      '[BLE PLX] ID:',
                      device.id
                    );

                    console.log(
                      '[BLE PLX] RSSI:',
                      device.rssi
                    );

                    setBleDeviceFound(
                      true
                    );

                    setBleDeviceInfo({
                      name:
                        device.name,
                      id:
                        device.id,
                      rssi:
                        device.rssi,
                    });

                    setBleStatus(
                      `✓ FOUND ${device.name || BLE_DEVICE.name}`
                    );

                    clearTimeout(
                      timeout
                    );

                    finish();
                  }
                );
            } catch (error) {
              clearTimeout(
                timeout
              );

              if (!finished) {
                finished = true;

                try {
                  blePlxManager
                    .stopDeviceScan();
                } catch {}

                reject(error);
              }
            }
          }
        );

        if (!target) {
          console.log(
            '[BLE PLX] ❌ TARGET NOT FOUND'
          );

          setBleStatus(
            'ALX-5DLG NOT FOUND'
          );

          return;
        }

        /*
         * IMPORTANT:
         *
         * TypeScript cannot reliably narrow a variable that
         * was assigned from inside an asynchronous callback.
         *
         * Copy it into a const after the null check.
         */
        const foundDevice: Device =
          target;

        console.log(
          '[BLE PLX] ✓ TARGET FOUND'
        );

        /* ----------------------------------------------------
         * 4. CONNECT
         * -------------------------------------------------- */

        console.log('');
        console.log(
          '[BLE PLX] STEP 2: CONNECT'
        );

        setBleStatus(
          'CONNECTING TO ALX-5DLG...'
        );

        console.log(
          '[BLE PLX] Connecting:',
          foundDevice.id
        );

        const device =
          await foundDevice.connect({
            timeout: 10000,
          });

        connected = true;

        console.log(
          '[BLE PLX] ✓ CONNECTED'
        );

        console.log(
          '[BLE PLX] Device:',
          device.name,
          device.id
        );

        setBleStatus(
          '✓ CONNECTED'
        );

        /* ----------------------------------------------------
         * 5. GATT DISCOVERY
         * -------------------------------------------------- */

        console.log('');
        console.log(
          '[BLE PLX] STEP 3: GATT DISCOVERY'
        );

        setBleStatus(
          'DISCOVERING GATT SERVICES...'
        );

        const discoveredDevice =
          await device
            .discoverAllServicesAndCharacteristics();

        console.log(
          '[BLE PLX] ✓ GATT DISCOVERY COMPLETE'
        );

        const services =
          await discoveredDevice.services();

        console.log(
          '[BLE PLX] SERVICES:',
          services.map(
            service =>
              service.uuid
          )
        );

        const alxService =
          services.find(
            service =>
              service.uuid
                .toLowerCase() ===
              BLE_SERVICE_UUID
                .toLowerCase()
          );

        if (!alxService) {
          console.log(
            '[BLE PLX] ❌ ALX SERVICE NOT FOUND'
          );

          setBleStatus(
            'ALX SERVICE NOT FOUND'
          );

          return;
        }

        console.log(
          '[BLE PLX] ✓ ALX SERVICE FOUND:',
          alxService.uuid
        );

        const characteristics =
          await alxService
            .characteristics();

        console.log(
          '[BLE PLX] CHARACTERISTICS:'
        );

        console.log(
          JSON.stringify(
            characteristics.map(
              characteristic => ({
                uuid:
                  characteristic.uuid,

                isReadable:
                  characteristic
                    .isReadable,

                isWritableWithResponse:
                  characteristic
                    .isWritableWithResponse,

                isWritableWithoutResponse:
                  characteristic
                    .isWritableWithoutResponse,

                isNotifiable:
                  characteristic
                    .isNotifiable,

                isIndicatable:
                  characteristic
                    .isIndicatable,
              })
            ),
            null,
            2
          )
        );

        setBleStatus(
          '✓ GATT SERVICES FOUND'
        );

        /* ----------------------------------------------------
         * 6. FIND TX/RX
         * -------------------------------------------------- */

        const tx =
          characteristics.find(
            characteristic =>
              characteristic.uuid
                .toLowerCase() ===
              BLE_TX_UUID
                .toLowerCase()
          );

        const rx =
          characteristics.find(
            characteristic =>
              characteristic.uuid
                .toLowerCase() ===
              BLE_RX_UUID
                .toLowerCase()
          );

        if (!tx) {
          console.log(
            '[BLE PLX] ❌ TX NOT FOUND'
          );

          setBleStatus(
            'TX CHARACTERISTIC NOT FOUND'
          );

          return;
        }

        if (!rx) {
          console.log(
            '[BLE PLX] ❌ RX NOT FOUND'
          );

          setBleStatus(
            'RX CHARACTERISTIC NOT FOUND'
          );

          return;
        }

        console.log(
          '[BLE PLX] ✓ TX:',
          tx.uuid
        );

        console.log(
          '[BLE PLX] ✓ RX:',
          rx.uuid
        );

        /* ----------------------------------------------------
         * 7. TX WRITE
         * -------------------------------------------------- */

        console.log('');
        console.log(
          '[BLE PLX] STEP 4: TX WRITE'
        );

        setBleStatus(
          'TESTING TX WRITE...'
        );

        const statusBase64 =
          bytesToBase64(
            STATUS_COMMAND
          );

        console.log(
          '[BLE PLX] STATUS HEX:',
          STATUS_COMMAND
            .map(
              byte =>
                byte
                  .toString(16)
                  .padStart(
                    2,
                    '0'
                  )
                  .toUpperCase()
            )
            .join(' ')
        );

        console.log(
          '[BLE PLX] STATUS BASE64:',
          statusBase64
        );

        if (
          tx.isWritableWithResponse
        ) {
          console.log(
            '[BLE PLX] Writing WITH response...'
          );

          await device
            .writeCharacteristicWithResponseForService(
              BLE_SERVICE_UUID,
              BLE_TX_UUID,
              statusBase64
            );

          console.log(
            '[BLE PLX] ✓ TX WRITE WITH RESPONSE SUCCESS'
          );
        } else if (
          tx.isWritableWithoutResponse
        ) {
          console.log(
            '[BLE PLX] Writing WITHOUT response...'
          );

          await device
            .writeCharacteristicWithoutResponseForService(
              BLE_SERVICE_UUID,
              BLE_TX_UUID,
              statusBase64
            );

          console.log(
            '[BLE PLX] ✓ TX WRITE WITHOUT RESPONSE SUCCESS'
          );
        } else {
          console.log(
            '[BLE PLX] ❌ TX IS NOT WRITABLE'
          );

          setBleStatus(
            'TX NOT WRITABLE'
          );

          return;
        }

        setBleStatus(
          '✓ TX WRITE SUCCESS'
        );

        /* ----------------------------------------------------
         * 8. RX MONITOR
         * -------------------------------------------------- */

        console.log('');
        console.log(
          '[BLE PLX] STEP 5: RX MONITOR'
        );

        setBleStatus(
          'ENABLING RX NOTIFICATION...'
        );

        console.log(
          '[BLE PLX] Starting RX monitor...'
        );

        rxSubscription =
          rx.monitor(
            (
              error: any,
              characteristic: any
            ) => {
              if (error) {
                console.log(
                  '[BLE PLX] RX ERROR:',
                  error
                );

                console.log(
                  '[BLE PLX] RX ERROR MESSAGE:',
                  error.message
                );

                setBleStatus(
                  'RX MONITOR ERROR'
                );

                return;
              }

              console.log(
                '[BLE PLX] RX DATA:',
                characteristic?.value
              );

              setBleStatus(
                '✓ RX DATA RECEIVED'
              );
            }
          );

        console.log(
          '[BLE PLX] ✓ RX MONITOR STARTED'
        );

        setBleStatus(
          'BLE PLX TEST COMPLETE'
        );

        console.log('');
        console.log(
          '========================================'
        );

        console.log(
          '[BLE PLX] TEST COMPLETE'
        );

        console.log(
          '========================================'
        );
      } catch (error: any) {
        console.error('');
        console.error(
          '========================================'
        );

        console.error(
          '[BLE PLX] ❌ TEST FAILED'
        );

        console.error(
          '========================================'
        );

        console.error(
          '[BLE PLX] Error:',
          error
        );

        console.error(
          '[BLE PLX] Error code:',
          error?.errorCode
        );

        console.error(
          '[BLE PLX] Error message:',
          error?.message
        );

        console.error(
          '[BLE PLX] Connected:',
          connected
        );

        setBleStatus(
          'BLE PLX ERROR'
        );

        setErrorMessage(
          error?.message ||
            'Erro no teste BLE PLX.'
        );
      } finally {
        if (rxSubscription) {
          try {
            rxSubscription.remove();
          } catch {}
        }

        if (connected) {
          try {
            console.log(
              '[BLE PLX] Disconnecting...'
            );

            await blePlxManager
              .cancelDeviceConnection(
                address
              );

            console.log(
              '[BLE PLX] Disconnected'
            );
          } catch (error) {
            console.log(
              '[BLE PLX] Disconnect error:',
              error
            );
          }
        }

        setIsConnecting(false);
        setBleTestRunning(false);
        setBleTestType(null);
      }
    };

  /* ==========================================================
   * RENDER
   * ======================================================== */

  return (
    <>
      <IndexClient
        scanning={scanning}
        isConnecting={isConnecting}
        showQRScanner={showQRScanner}
        errorMessage={errorMessage}
        locationDisabled={locationDisabled}
        networks={networks}
        wifiDisabled={wifiDisabled}
        isModalVisible={isModalVisible}
        availableGateways={
          availableGateways
        }
        handleQRScan={
          handleQRScan
        }
        openNetworkModal={
          openNetworkModal
        }
        refreshPage={
          refreshPage
        }
        handleConnect={
          handleConnect
        }
        setIsModalVisible={
          setIsModalVisible
        }
        setShowQRScanner={
          setShowQRScanner
        }
        setWifiDisabled={
          setWifiDisabled
        }
        setLocationDisabled={
          setLocationDisabled
        }
        setErrorMessage={
          setErrorMessage
        }
      />

      {!showQRScanner && (
        <View
          style={{
            position: 'absolute',
            zIndex: 9999,
            elevation: 9999,
            bottom: 20,
            left: 20,
            right: 20,
          }}
        >
          {/* ==================================================
              BLE DEVICE INFO
          ================================================== */}

          {bleDeviceInfo && (
            <View
              style={{
                backgroundColor:
                  '#ffffff',
                borderRadius: 10,
                padding: 10,
                marginBottom: 8,
              }}
            >
              <Text
                style={{
                  color: '#222',
                  fontSize: 13,
                }}
              >
                FOUND:{' '}
                {
                  bleDeviceInfo.name ||
                  BLE_DEVICE.name
                }
                {'\n'}
                ID:{' '}
                {
                  bleDeviceInfo.id
                }
                {'\n'}
                RSSI:{' '}
                {
                  bleDeviceInfo.rssi
                }
                {'\n'}
                STATUS:{' '}
                {
                  bleStatus
                }
              </Text>
            </View>
          )}

          {/* ==================================================
              BLE MANAGER BUTTON
          ================================================== */}

          <TouchableOpacity
            onPress={
              connectToALX
            }
            disabled={
              bleTestRunning
            }
            style={{
              height: 55,
              borderRadius: 12,
              backgroundColor:
                bleTestRunning &&
                bleTestType ===
                  'manager'
                  ? '#777'
                  : '#007AFF',
              alignItems:
                'center',
              justifyContent:
                'center',
              marginBottom: 8,
            }}
          >
            <Text
              style={{
                color: '#fff',
                fontSize: 17,
                fontWeight:
                  'bold',
              }}
            >
              {bleTestRunning &&
              bleTestType ===
                'manager'
                ? bleStatus
                : 'CONECTAR BLE MANAGER'}
            </Text>
          </TouchableOpacity>

          {/* ==================================================
              BLE PLX BUTTON
          ================================================== */}

          <TouchableOpacity
            onPress={
              testBlePlx
            }
            disabled={
              bleTestRunning
            }
            style={{
              height: 55,
              borderRadius: 12,
              backgroundColor:
                bleTestRunning &&
                bleTestType ===
                  'plx'
                  ? '#777'
                  : '#34A853',
              alignItems:
                'center',
              justifyContent:
                'center',
            }}
          >
            <Text
              style={{
                color: '#fff',
                fontSize: 17,
                fontWeight:
                  'bold',
              }}
            >
              {bleTestRunning &&
              bleTestType ===
                'plx'
                ? bleStatus
                : 'CONECTAR BLE PLX'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
}