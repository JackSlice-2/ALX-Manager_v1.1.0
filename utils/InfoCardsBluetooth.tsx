import { Image, StyleSheet } from "react-native";
import Battery from "../components/dashboard/Battery";
import IconButton from "../components/dashboard/IconButton";
import useGetInfo from "./getEvery5Seconds";
import React, { useEffect } from "react";
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
      label: t.StatusPage.text5Bluetooth,
      value: 'D8:13:2A:B6:50:70',
    },
    {
      icon: <Image source={require('../assets/images/memory.png')} style={styles.iconImage} />,
      label: t.StatusPage.text6Bluetooth,
      value: '3,34V',
    },
    {
      icon: <Image source={require('../assets/images/memory.png')} style={styles.iconImage} />,
      label: t.StatusPage.text4Bluetooth,
      value: <Battery level={datalogger.info.uso_por_cento} />,
    },
    {
      icon: <Image source={require('../assets/images/GPS.png')} style={styles.iconImage} />,
      label: t.StatusPage.text7Bluetooth,
      value: new Date().toLocaleString(),
    },
    {
      icon: <Image source={require('../assets/images/GPS.png')} style={styles.iconImage} />,
      label: t.StatusPage.text8Bluetooth,
      value: new Date(Date.now() - 24 * 60 * 60 * 900).toLocaleString(),
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