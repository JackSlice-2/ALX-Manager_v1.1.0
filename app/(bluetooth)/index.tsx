import { router, useFocusEffect } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, AppState, BackHandler, Linking, Platform } from 'react-native';
import WifiManager from 'react-native-wifi-reborn';
import { openWifiSettings } from '@/utils/constants';
import useCheckAppUpdate from '@/hooks/useCheckAppUpdate';
import useCheckDrivers from '@/hooks/useCheckDrivers';
import useCheckUpdate from '@/hooks/useCheckUpdate';
import useWifiPassword from '@/hooks/useWifiPassword';
import { ensureLocationPermission, isSystemLocationEnabled, NetworkType, normalizeWifiResults, verifyConnection } from '@/hooks/wifiHelpers';
import IndexClient from '@/components/bluetooth/login/IndexClient';

export default function WiFiConnect() {

  const [networks, setNetworks] = useState<NetworkType[]>([]);
  const [availableGateways, setAvailableGateways] = useState<string[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkType | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [wifiDisabled, setWifiDisabled] = useState(false);
  const [locationDisabled, setLocationDisabled] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const isMounted = useRef(true);
  const urlParams = { codigo: 'alx4gs', versao: '0.0.0', serial: '00000005' };
  const { savePassword } = useWifiPassword(selectedNetwork?.ssid || '');
  const lastSSIDRef = useRef<string | null>(null);

  const openedWifiPanelRef = useRef(false);
    useCheckUpdate(urlParams);
    useCheckDrivers();
    useCheckAppUpdate(urlParams);

  useFocusEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => subscription.remove();
  });

  useEffect(() => { refreshPage(); }, []);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    const handleAppStateChange = async (state: string) => {
      if (state !== 'active' || !openedWifiPanelRef.current) return;

      console.log('[WiFi Panel] User returned');

      openedWifiPanelRef.current = false;

      try {
        let ssid = await WifiManager.getCurrentWifiSSID();

        if (!ssid || ssid.toLowerCase().includes('unknown')) {
          console.log('[WiFi Panel] No valid SSID → do nothing');
          return;
        }

        ssid = ssid.replace(/"/g, '').trim();

        if (!ssid.startsWith('ALX_4GS')) {
          console.log('[WiFi Panel] Not an ALX network → ignore');
          return; 
        }

        console.log('[WiFi Panel] Valid ALX network → opening modal');

        setAvailableGateways([ssid]);
        setIsModalVisible(true);

      } catch (e) {
        console.log('[WiFi Panel] Error reading SSID', e);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    let interval: any;

    const getCleanSSID = async () => {
      try {
        let ssid = await WifiManager.getCurrentWifiSSID();

        if (!ssid || ssid.toLowerCase().includes("unknown")) return null;

        return ssid.replace(/"/g, '').trim();
      } catch {
        return null;
      }
    };

  const checkConnection = async () => {
    const ssid = await getCleanSSID();

    if (ssid === lastSSIDRef.current) return;
    console.log('[WiFi Listener] SSID changed:', ssid);
    lastSSIDRef.current = ssid;

    if (ssid && ssid.startsWith('ALX_4GS')) {
      console.log('[WiFi Listener] Connected to ALX → opening modal');
      setAvailableGateways([ssid]);
      setIsModalVisible(true);
    }
  };

    checkConnection();
    interval = setInterval(checkConnection, 1500);
    return () => clearInterval(interval);
  }, []);

  const logScanResults = (rawResults: any[]) => {
    //console.log(`[Scan Debug] Found ${rawResults.length} raw networks`);
    rawResults.forEach((net, i) => {
      //console.log(`[Scan Debug] ${i + 1}: SSID="${net.SSID || '(hidden)'}", BSSID=${net.BSSID}, RSSI=${net.level}, Freq=${net.frequency}MHz, Capabilities="${net.capabilities}"`);
    });
  };

  const refreshPage = async () => {
    if (!isMounted.current) return;

    setWifiDisabled(false);
    setLocationDisabled(false);
    setNetworks([]);
    setScanning(true);
    setErrorMessage('');

    try {
      await WifiManager.disconnect().catch(() => {});
    } catch {}

    await new Promise(res => setTimeout(res, 800));

    const granted = await ensureLocationPermission();
    if (!granted) { 
      setLocationDisabled(true); 
      setScanning(false); 
      return; 
    }

    const gps = await isSystemLocationEnabled();
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

      const rawResults = await WifiManager.loadWifiList();
      if (isMounted.current) {
        logScanResults(rawResults);  
        setNetworks(normalizeWifiResults(rawResults));
      }
    } catch (e) {
      console.error('[Scan] loadWifiList failed:', e);
      setLocationDisabled(true);
    } finally {
      setScanning(false);
    }
  };

  const handleQRScan = (data: string) => {
        try {
      const parsed = JSON.parse(data);
      if (!parsed.ssid || !parsed.password) {
        setErrorMessage('QR Code inválido: faltando ssid/senha.');
        return;
      }

      const matched = networks.find(n => n.ssid === parsed.ssid);
      if (!matched) {
        setErrorMessage(`Rede não encontrada: ${parsed.ssid}`);
        return;
      }

      const networkWithHidden: NetworkType = { ...matched, hidden: !!parsed.hidden };
      setSelectedNetwork(networkWithHidden);
      setPassword(parsed.password);
      setShowQRScanner(false);

      setTimeout(() => handleConnect(networkWithHidden, parsed.password), 300);
    } catch {
      setErrorMessage('QR Code inválido.');
    }
  };

 const handleConnect = async (networkArg?: NetworkType, pwdArg?: string) => {
  const network = networkArg ?? selectedNetwork;
  const pwd = (pwdArg ?? password)?.trim();

  const getCleanSSID = async () => {
    try {
      let ssid = await WifiManager.getCurrentWifiSSID();

      if (!ssid || ssid.toLowerCase().includes("unknown")) return null;

      return ssid.replace(/"/g, '').trim();
    } catch {
      return null;
    }
  };

  const currentSSID = await getCleanSSID();

  if (!network?.ssid) return;

  setIsConnecting(true);
  setErrorMessage('');

  try {
    const isAlreadyOnSsid = currentSSID === network.ssid;

    if (isAlreadyOnSsid) {
      console.log("[WiFi] Already connected → bypassing connect");

      const reachable = await verifyConnection(8000);

  if (!reachable) {
  Alert.alert(
    "Ação necessária",
    "O Android pode bloquear redes sem internet.\n\nApós conectar, verifique a notificação e toque em:\n'Usar esta rede mesmo sem internet'.",
  );
    return;
  }

  router.replace('./(bluetooth)/status');

      router.replace('./(bluetooth)/status');
      return;
    }

    if (!pwd) {
      setErrorMessage('SSID e Senha são necessários.');
      setIsConnecting(false);
      return;
    }

    const rawResults = await WifiManager.loadWifiList().catch(() => []);
    const stillVisible = rawResults.some((n: any) => n.SSID === network.ssid);

    console.log(`Target still visible before connect: ${stillVisible}`);

    await WifiManager.connectToProtectedWifiSSID({
      ssid: network.ssid,
      password: pwd,
      isWEP: false,
      isHidden: false,
      timeout: 30000,
    });

    const reachable = await verifyConnection(8000);
    if (!reachable) {
    Alert.alert(
      "Ação necessária",
      "O Android pode bloquear redes sem internet.\n\nApós conectar, verifique a notificação e toque em: 'Usar esta rede mesmo sem internet'.",
    );
    return;
  }

    router.replace('./(bluetooth)/status');
    savePassword(pwd);
    router.replace('./(bluetooth)/status');

  } catch (err: any) {
    console.error('[WiFi] Error:', err.code || err.message, err);

    let msg = 'Erro ao conectar. Tente novamente.';

    if (err.code === 'didNotFindNetwork') {
      msg = 'Rede não encontrada para conexão automática.';
    } else if (err.code === 'authenticationError') {
      msg = 'Senha incorreta.';
    } else if (err.message === 'TIMEOUT') {
      msg = 'Tempo esgotado.';
    } else if (err.message === 'NOT_REACHABLE') {
      msg = 'Conectado, mas sem resposta do dispositivo.';
    }

      setErrorMessage(msg);
    } finally {
      setIsConnecting(false);
    }
  };

  const openNetworkModal = async () => {
  setSelectedNetwork(null);
  setPassword('');
  setErrorMessage('');

  if (Platform.OS === 'android') {
    try {
      openedWifiPanelRef.current = true;

      await Linking.sendIntent('android.settings.panel.action.WIFI');

    } catch (e) {
      console.log('Panel not supported, falling back...', e);

      try {
        openedWifiPanelRef.current = true;

        await Linking.sendIntent('android.settings.WIFI_SETTINGS');
      } catch {
        openWifiSettings();
      }
    }
  } else {
    Alert.alert(
      'Conectar ao Wi-Fi',
      'O iOS não permite abrir a lista dentro do app. Deseja ir para os ajustes?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Ir para Ajustes', onPress: () => openWifiSettings() }
      ]
    );
  }
};

  return (
   <IndexClient
    scanning={scanning}
    isConnecting={isConnecting}
    showQRScanner={showQRScanner}
    errorMessage={errorMessage}
    locationDisabled={locationDisabled}
    networks={networks}
    wifiDisabled={wifiDisabled}
    isModalVisible={isModalVisible}
    availableGateways={availableGateways}
    handleQRScan={handleQRScan}
    openNetworkModal={openNetworkModal}
    refreshPage={refreshPage}
    handleConnect={handleConnect}
    setIsModalVisible={setIsModalVisible}
    setShowQRScanner={setShowQRScanner}
    setWifiDisabled={setWifiDisabled}
    setLocationDisabled={setLocationDisabled}
    setErrorMessage={setErrorMessage}
   />
  );
}
