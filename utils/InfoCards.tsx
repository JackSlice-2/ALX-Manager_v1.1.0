import { Image, StyleSheet } from "react-native";
import Battery from "../components/dashboard/Battery";
import IconButton from "../components/dashboard/IconButton";
import SignalBars from "../components/dashboard/SignalBars";
import useGetInfo from "./getEvery5Seconds";
import React, { useEffect } from "react";
import { rssiToLevel } from "@/components/utils/types";
import { useT } from "@/hooks/useT";

export const useInfoCards = () => {

  const hasInitialized = React.useRef(false);
  const t = useT()

  const datalogger = useGetInfo('/req_info_datalogger')
  const cel = useGetInfo('/req_info_celular')
  const mqtt = useGetInfo('/req_info_mqtt')
  const wifi = useGetInfo('/req_info_wifi')

    useEffect(() => {
      if (hasInitialized.current) return;
      if (!datalogger.info || Object.keys(mqtt.info).length === 0) return
      if (!cel.info || Object.keys(cel.info).length === 0) return;
      if (!mqtt.info || Object.keys(mqtt.info).length === 0) return;
      if (!wifi.info || Object.keys(wifi.info).length === 0) return;

      const fullData = {
        ...datalogger.info,
        ...cel.info,
        ...mqtt.info,
        ...wifi.info
      }
    
      hasInitialized.current = fullData && Object.keys(fullData).length > 0;
    }, [datalogger, cel, mqtt, wifi]);

    if (!hasInitialized.current) {
      return null
    }

  const infoCards  = [
    {
      icon: <Image source={require('../assets/images/Processor.png')} style={styles.iconImage} />,
      label: t.StatusPage.text1,
      value: (
        <IconButton
          text={datalogger.info.versao_firmware}
          icon={require('../assets/images/Tools.png')}
          option={t.SettingsOptions.Updates}
        />
      ),
    },
    {
      icon: <Image source={require('../assets/images/Clock.png')} style={styles.iconImage} />,
      label: t.StatusPage.text2,
      value: `${datalogger.info.data_atual || ''} - ${datalogger.info.hora_atual}`,
    },
    {
      icon: <Image source={require('../assets/images/memory.png')} style={styles.iconImage} />,
      label: t.StatusPage.text3,
      value: <Battery level={datalogger.info.memoria_ram} />,
    },
    {
      icon: <Image source={require('../assets/images/memory.png')} style={styles.iconImage} />,
      label: t.StatusPage.text4,
      value: <Battery level={datalogger.info.uso_por_cento} />,
    },
    {
      icon: <Image source={require('../assets/images/memory.png')} style={styles.iconImage} />,
      label: t.StatusPage.text5,
      value: datalogger.info.sts_spiffs,
    },
    {
      icon: <Image source={require('../assets/images/memory.png')} style={styles.iconImage} />,
      label: t.StatusPage.text6,
      value: datalogger.info.sts_eeprom,
    },
    {
      icon: <Image source={require('../assets/images/GPS.png')} style={styles.iconImage} />,
      label: t.StatusPage.text7,
      value: datalogger.info.sts_gnss,
    },
    {
      icon: <Image source={require('../assets/images/wifi.png')} style={styles.iconImage} />,
      label: t.StatusPage.text8,
      value: (
        <IconButton
          component={<SignalBars level={datalogger.info.sts_wifi === t.System.Disabled || t.System.ConnectionError ? 0 : wifi.info.wifi_sinal} />}
          text={datalogger.info.sts_wifi}
          icon={require('../assets/images/Tools.png')}
          option={t.SettingsOptions.WiFi}
        />
      ),
    },
    {
      icon: <Image source={require('../assets/images/Processor.png')} style={styles.iconImage} />,
      label: t.StatusPage.text9,
      value: (
        <IconButton
          component={<SignalBars level={cel.info.cel_stat === t.System.Disconnected ? 0 :rssiToLevel(parseInt(cel.info.cel_sinal))} />}
          icon={require('../assets/images/Tools.png')}
          text={cel.info.cel_stat}
          option={t.SettingsOptions.Mobile}
        />
      ),
    },
    {
      icon: <Image source={require('../assets/images/MemoryData.png')} style={styles.iconImage} />,
      label: t.StatusPage.text10,
      value: <IconButton text={cel.info.cel_tec} option={t.SettingsOptions.Mobile} />,
    },
    {
      icon: <Image source={require('../assets/images/Cloud.png')} style={styles.iconImage} />,
      label: t.StatusPage.text11,
      value: (
        <IconButton
          icon={require('../assets/images/Tools.png')}
          text={mqtt.info.mqtt_stat}
          option={t.SettingsOptions.MQTT}
        />
      ),
    },
        {
      icon: <Image source={require('../assets/images/Cloud.png')} style={styles.iconImage} />,
      label: t.StatusPage.text12,
      value: mqtt.info.mqtt_ult_con,
    },
        {
      icon: <Image source={require('../assets/images/Cloud.png')} style={styles.iconImage} />,
      label: t.StatusPage.text13,
      value: mqtt.info.mqtt_ult_pub,
    },
  ];
  return infoCards;
};

const styles = StyleSheet.create({
  iconImage: {
    width: 30,
    height: 25,
    resizeMode: 'contain',
  },
});