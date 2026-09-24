import { router, useFocusEffect } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, BackHandler, Dimensions, Image, Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import WifiManager from 'react-native-wifi-reborn';
import Loader from '../../../components/Loader';
import RobotoText from '../../../components/RobotoText';
import useDataloggerFetch from '../../../hooks/useDataloggerFetch';
import { useT } from '@/hooks/useT';
import LanguageToggle from '@/components/login/LanguageToggle';

const { width } = Dimensions.get('window');
const logoSize = width * 0.85;

export default function WiFiConnect() {

  const [disconnecting, setDisconnecting] = useState(false);

  const { dataMap, fetchEndpoint } = useDataloggerFetch('http://192.168.4.1');
  const datalogger = dataMap['/req_info_datalogger'] || {};
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const t = useT()

  useFocusEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => true 
    );

    return () => subscription.remove();
  });

  useEffect(() => {
    fetchEndpoint('/req_info_datalogger');
  }, []);

  useEffect(() => {
    return () => {
      try {
        if (typeof (WifiManager as any).forceWifiUsage === 'function') {
          (WifiManager as any).forceWifiUsage(false).catch(() => null);
        }
      } catch {}
    };
  }, []);

  const waitForRealDisconnect = async () => {
  let attempts = 0;

  const interval = setInterval(async () => {
    attempts++;

    const stillConnected = await isStillOnDeviceNetwork();

    if (!stillConnected) {
      clearInterval(interval);
      router.replace('/');
    }

    if (attempts % 3 === 0) {
      promptUserToDisconnect();
    }

    if (attempts > 20) {
      clearInterval(interval);
    }
  }, 3000);
};

const handleDisconnect = async () => {
  setDisconnecting(true);

  Animated.timing(scaleAnim, {
    toValue: 0,
    duration: 500,
    useNativeDriver: true,
  }).start();

  try {
    if (typeof (WifiManager as any).forceWifiUsage === 'function') {
      await (WifiManager as any).forceWifiUsage(false);
    }

    try {
      if (typeof WifiManager.disconnect === 'function') {
        await WifiManager.disconnect();
      }
    } catch {}

    await new Promise((res) => setTimeout(res, 3000));

    const stillConnected = await isStillOnDeviceNetwork();

    if (stillConnected) {
      promptUserToDisconnect();

      waitForRealDisconnect();
      return;
    }

    router.replace('/');
  } catch (err) {
    console.warn('Disconnect flow error:', err);
    promptUserToDisconnect();
    waitForRealDisconnect();
  } finally {
    setDisconnecting(false);
  }
};

  const openWifiSettings = () => {
  if (Platform.OS === 'android') {
    Linking.sendIntent('android.settings.WIFI_SETTINGS');
  } else {
    Linking.openSettings(); // iOS fallback
  }
};

const promptUserToDisconnect = () => {
  Alert.alert(
    'Desconectar do Wi-Fi',
    'Você ainda está conectado ao dispositivo.\n\nAbra as configurações de Wi-Fi e conecte-se à sua internet normal ou dados móveis.',
    [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Abrir Wi-Fi',
        onPress: openWifiSettings,
      },
    ],
    { cancelable: false }
  );
};

const isStillOnDeviceNetwork = async () => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);

    const res = await fetch('http://192.168.4.1', {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeout);

    return res.ok;
  } catch {
    return false;
  }
};

  return (
    <View style={styles.container}>
      <View style={{position: 'absolute', top: 40, right: 20, zIndex: 10,}}>
                <LanguageToggle
                    onChange={(lang) => {
                    console.log('Language changed to:', lang);
                    }}
                />
            </View>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Image
          source={require('@/assets/images/Logo_v101.png')}
          style={{ width: logoSize, height: logoSize, marginBottom: -60 }}
          resizeMode="contain"
        />
      </Animated.View>

        <Text style={{color:'grey', fontSize: 26, position: 'absolute', top: 200, fontWeight: '400'}}>Versão 1.1.0</Text>

      <View
        style={{
          marginTop: '10%',
          alignItems: 'center',
          gap: 7,
          backgroundColor: 'rgba(226, 222, 222, 0.5)',
          padding: 16,
          borderRadius: 10,
        }}
      >
        <RobotoText style={{ fontSize: 20, fontWeight: 'bold' }}>
          {t.Disconnect.text0}
        </RobotoText>
        <RobotoText style={{ fontSize: 16 }}>
          {t.Disconnect.text1}
        </RobotoText>
        <RobotoText style={{ fontSize: 26, fontWeight: 'semibold' }}>
          {datalogger.modelo}{"    "}
          {datalogger.numero_serie}
        </RobotoText>
       
      </View>
      <View style={{ marginTop: '20%' }} />

      <TouchableOpacity
        onPress={handleDisconnect}
        style={{
          backgroundColor: '#ff4f4fbe',
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderRadius: 10,
        }}
        disabled={disconnecting}
      >
        <RobotoText style={{ fontSize: 16 }}>
          {disconnecting ? t.System.Disconnecting : t.System.Disconnect}
        </RobotoText>      
      </TouchableOpacity>

      {disconnecting && (
        <View style={styles.loaderContainer}>
          <Loader />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: 'rgb(250, 251, 252)',
  },
  loaderContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center'
  },
});
