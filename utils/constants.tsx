import { useEffect, useState } from "react";
import { modemInfo } from "../assets/MockedData";
import Battery from "../components/dashboard/Battery";
import IconButton from "../components/dashboard/IconButton";
import SignalBars from "../components/dashboard/SignalBars";
import { Alert, Dimensions, Image, Linking, Platform } from "react-native";
import { useT } from "@/hooks/useT";
import { StyleSheet } from "react-native";


const styles = StyleSheet.create({  
  iconImage: {
    width: 30,
    height: 25,
    resizeMode: 'contain',
  },
})

const Time = () => {
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleString());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleString());
    }, 1000); // update every second

    // Simulate a delay of 1.5 seconds for loading the dashboard when initially loaded
    const loadingTimeout = setTimeout(() => {
      setLoading(false);  // Hide the loading indicator after 1.5 seconds
    }, 1500);

    // Clean up interval and timeout on unmount
    return () => {
      clearInterval(interval);
      clearTimeout(loadingTimeout);
    };
  }, []);

  return (
    <>{currentTime}</>
  );
}  

export const useConfigOptions = () => {
  const t = useT();

  return [
    { label: t.SettingsOptions.WiFi, image: require('../assets/images/wifi.png') },
    { label: t.SettingsOptions.Mobile, image: require('../assets/images/Simcard.png') },
    { label: t.SettingsOptions.GPS, image: require('../assets/images/GPS.png') },
    { label: t.SettingsOptions.MQTT, image: require('../assets/images/Cloud.png') },
    { label: t.SettingsOptions.Drivers, image: require('../assets/images/Devices.png') },
    { label: t.SettingsOptions.Serial, image: require('../assets/images/Serial.png') },
    { label: t.SettingsOptions.IOs, image: require('../assets/images/icons8-control-250.png') },
    { label: t.SettingsOptions.Updates, image: require('../assets/images/Processor.png') },
    { label: t.SettingsOptions.Commands, image: require('../assets/images/Command.png') },
    { label: t.SettingsOptions.Password, image: require('../assets/images/key.png') },
  ];
};


export const useInfoCards = () => {

  const t = useT();

  return [  
    {
      icon: <Image source={require('../assets/images/Processor.png')} style={styles.iconImage} />,
      label: 'Firmware',
      value: modemInfo.firmware && 
        <IconButton text='0.0.0.1' icon={require('../assets/images/Tools.png')} option="Atualizações" />,
    },
    {
      icon: <Image source={require('../assets/images/Clock.png')} style={styles.iconImage} />,
      label: 'Data/Hora',
      value: <Time />,
    },
    {
      icon: <Image source={require('../assets/images/memory.png')} style={styles.iconImage} />,
      label: 'Memória RAM',
      value: <Battery level={modemInfo.RAM} />,
    },
    {
      icon: <Image source={require('../assets/images/memory.png')} style={styles.iconImage} />,
      label: 'Memória Flash',
      value: <Battery level={modemInfo.flash} />,
    },
    {
      icon: <Image source={require('../assets/images/memory.png')} style={styles.iconImage} />,
      label: 'Arquivos de Configuração',
      value: modemInfo.ConfigFiles,
    },
    {
      icon: <Image source={require('../assets/images/memory.png')} style={styles.iconImage} />,
      label: 'EEPROM',
      value: modemInfo.eepromStatus,
    },
    {
      icon: <Image source={require('../assets/images/GPS.png')} style={styles.iconImage} />,
      label: 'Status GPS',
      value: modemInfo.GPS,
    },
    {
      icon: <Image source={require('../assets/images/wifi.png')} style={styles.iconImage} />,
      label: 'Status WiFi',
      value: modemInfo.wifiStatus && 
        <IconButton component={<SignalBars level={0} />} link='./settings' icon={require('../assets/images/Tools.png')} text='Desabilitado' option={t.SettingsOptions.WiFi} />,
    },
    {
      icon: <Image source={require('../assets/images/Processor.png')} style={styles.iconImage} />,
      label: 'Status Mobile',
      value: modemInfo.wifiStatus && 
        <IconButton component={<SignalBars level={3} />} link='./settings' icon={require('../assets/images/Tools.png')} text='Conectado' option="Configurar Mobile" />,
    },
    {
      icon: <Image source={require('../assets/images/MemoryData.png')} style={styles.iconImage} />,
      label: 'Tecnologia Mobile',
      value: modemInfo.wifiStatus && <IconButton text='LTE-FDD' option="Configurar Mobile" />,
    },
    {
      icon: <Image source={require('../assets/images/Cloud.png')} style={styles.iconImage} />,
      label: 'Status ao Broker MQTT',
      value: modemInfo.wifiStatus && 
        <IconButton link='./settings' icon={require('../assets/images/Tools.png')} text='Conectado' option="Configurar MQTT" />,
    },
  ];
}

export const screenWidth = Dimensions.get('window').width;

  export const handleSave = (onClose: any) => {
    // Show confirmation alert before saving
    Alert.alert(
      "Confirmar Salvar",
      "Você tem certeza de que quer salvar as alterações?",
      [
        {
          text: "Não",
          style: "cancel"
        },
        {
          text: "Sim",
          onPress: () => {
            {onClose &&
              onClose()
            }
          }
        }
      ],
      { cancelable: false }
    );
  };


  export const BASE_URL = "http://192.168.4.1";

      export const openWifiSettings = () => {
        if (Platform.OS === 'android') (Linking as any).sendIntent?.('android.settings.WIFI_SETTINGS') || Linking.openSettings();
        else Linking.openSettings();
      };
    
      export const openLocationSettings = () => {
        if (Platform.OS === 'android') (Linking as any).sendIntent?.('android.settings.LOCATION_SOURCE_SETTINGS') || Linking.openSettings();
        else Linking.openSettings();
      };

     export const mockedHistory: Record<string, string[]> = {
  '2026-02-25': [
    '===============================',
    'INICIANDO CONEXÃO COM O HOST',
    '===============================',
    '> Verificando dados móveis...',
    '✔ Dados móveis ativos',
    '> Conectando ao Servidor Allexo...',
    '✔ Conectado!',
    '> Authenticando numero de serie...',
    '> Enviando: 00000103',
    '✔ Numero de serie enviado',
    '✔ SESSAO INICIADA',
    '🎉 Support has connected to this session!'
  ],

  '2026-02-24': [
    '===============================',
    'INICIANDO CONEXÃO COM O HOST',
    '===============================',
    '> Verificando dados móveis...',
    '✖ CONEXÂO COM SEVIDOR FALHOU',
    'Error: Network request failed'
  ],

  '2026-02-23': [
    '===============================',
    'INICIANDO CONEXÃO COM O HOST',
    '===============================',
    '> Verificando dados móveis...',
    '✔ Dados móveis ativos',
    '> Conectando ao Servidor Allexo...',
    '✔ Conectado!',
    '> Authenticando numero de serie...',
    'Encryption error: Invalid key length'
  ],

  '2026-02-22': [
    '===============================',
    'INICIANDO CONEXÃO COM O HOST',
    '===============================',
    '> Verificando dados móveis...',
    '✔ Dados móveis ativos',
    '> Conectando ao Servidor Allexo...',
    '✔ Conectado!',
    '> Authenticando numero de serie...',
    '> Enviando: 00000103',
    '✔ Numero de serie enviado',
    '✔ SESSAO INICIADA'
  ],

  '2026-02-21': [
    '===============================',
    'INICIANDO CONEXÃO COM O HOST',
    '===============================',
    '> Verificando dados móveis...',
    '✔ Dados móveis ativos',
    '> Conectando ao Servidor Allexo...',
    '✔ Conectado!',
    '> Authenticando numero de serie...',
    '> Enviando: 00000103',
    '✔ Numero de serie enviado',
    '✔ SESSAO INICIADA',
    '📥 Server message received: support_connected',
    '🎉 Support has connected to this session!',
    '⚠ CONNEXÃO TERMINADA (cliente)'
  ],
    '2026-02-19': [
    '===============================',
    'INICIANDO CONEXÃO COM O HOST',
    '===============================',
    '> Verificando dados móveis...',
    '✔ Dados móveis ativos',
    '> Conectando ao Servidor Allexo...',
    '✔ Conectado!',
    '> Authenticando numero de serie...',
    '> Enviando: 00000103',
    '✔ Numero de serie enviado',
    '✔ SESSAO INICIADA',
    '🎉 Support has connected to this session!'
  ],

  '2026-02-18': [
    '===============================',
    'INICIANDO CONEXÃO COM O HOST',
    '===============================',
    '> Verificando dados móveis...',
    '✖ CONEXÂO COM SEVIDOR FALHOU',
    'Error: Network request failed'
  ],

  '2026-02-17': [
    '===============================',
    'INICIANDO CONEXÃO COM O HOST',
    '===============================',
    '> Verificando dados móveis...',
    '✔ Dados móveis ativos',
    '> Conectando ao Servidor Allexo...',
    '✔ Conectado!',
    '> Authenticando numero de serie...',
    'Encryption error: Invalid key length'
  ],

  '2026-02-16': [
    '===============================',
    'INICIANDO CONEXÃO COM O HOST',
    '===============================',
    '> Verificando dados móveis...',
    '✔ Dados móveis ativos',
    '> Conectando ao Servidor Allexo...',
    '✔ Conectado!',
    '> Authenticando numero de serie...',
    '> Enviando: 00000103',
    '✔ Numero de serie enviado',
    '✔ SESSAO INICIADA'
  ],

  '2026-02-15': [
    '===============================',
    'INICIANDO CONEXÃO COM O HOST',
    '===============================',
    '> Verificando dados móveis...',
    '✔ Dados móveis ativos',
    '> Conectando ao Servidor Allexo...',
    '✔ Conectado!',
    '> Authenticando numero de serie...',
    '> Enviando: 00000103',
    '✔ Numero de serie enviado',
    '✔ SESSAO INICIADA',
    '📥 Server message received: support_connected',
    '🎉 Support has connected to this session!',
    '⚠ CONNEXÃO TERMINADA (cliente)'
  ]
}