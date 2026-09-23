import { Image, StyleSheet } from "react-native";
import Battery from "../components/dashboard/Battery";
import IconButton from "../components/dashboard/IconButton";
import useGetInfo from "./getEvery5Seconds";
import React, { useEffect } from "react";
import { useT } from "@/hooks/useT";

export const useInfoCards = () => {

  const t = useT()
  const datalogger = useGetInfo('/req_info_datalogger')

  const infoCards  = [
    {
      icon: <Image source={require('../assets/images/Processor.png')} style={styles.iconImage} />,
      label: t.StatusPage.text1,
      value: (
        <IconButton
          text='1.0.5'
          icon={require('../assets/images/Tools.png')}
          option={t.SettingsOptions.Updates}
        />
      ),
    },
    {
      icon: <Image source={require('../assets/images/Clock.png')} style={styles.iconImage} />,
      label: t.StatusPage.text2,
      value: new Date().toLocaleString(),
    },
    {
      icon: <Image source={require('../assets/images/memory.png')} style={styles.iconImage} />,
      label: t.StatusPage.text3,
      value: <Battery level={45} />,
    },
    {
      icon: <Image source={require('../assets/images/memory.png')} style={styles.iconImage} />,
      label: t.StatusPage.text4,
      value: <Battery level={33} />,
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
      value: <Battery level={89} />,
    },
    {
      icon: <Image source={require('../assets/images/GPS.png')} style={styles.iconImage} />,
      label: t.StatusPage.text7Bluetooth,
      value: new Date(Date.now() - 27 * 60 * 60 * 1000).toLocaleString(),
    },
    {
      icon: <Image source={require('../assets/images/GPS.png')} style={styles.iconImage} />,
      label: t.StatusPage.text8Bluetooth,
      value: new Date(Date.now() - 1 * 60 * 60 * 1000).toLocaleString(),
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