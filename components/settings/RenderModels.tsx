import React from 'react';
import ChangePasswordModal from './ConfigModals/ChangePassword';
import Commands from './ConfigModals/Commands';
import Drivers from './ConfigModals/Drivers';
import GPS from './ConfigModals/GPS';
import Mobile from './ConfigModals/Mobile';
import MQTT from './ConfigModals/MQTT';
import Serial from './ConfigModals/Serial';
import Updates from './ConfigModals/Updates';
import WiFi from './ConfigModals/WiFi';
import IOs from './ConfigModals/IOs';
import LoaderOverlay from '@/components/LoaderOverlay';
import { RenderModalsProps } from '../utils/types';
import { useT } from '@/hooks/useT';

export default function RenderModals({
  selectedOption,
  setSelectedOption,
  wifi,
  refreshWifi,
  mobileData,
  gpsData,
  datalogger,
  mqttData,
  drivers,
  serialData,
  iosData,
  commandsData,
  iosPubData,
  mobileConfigData,
  mqttConfigData,
}: RenderModalsProps) {

  const t = useT()

  if (!selectedOption) return null;

  const onClose = () => {
    setSelectedOption(null);
  };

  switch (selectedOption) {
    case t.SettingsOptions.WiFi:
      if (!wifi) return <LoaderOverlay visible message={t.Settings.text1} />;
      return <WiFi wifi={wifi} refreshWifi={refreshWifi} onClose={onClose} />;

    case t.SettingsOptions.Mobile:
      if (!mobileData || !mobileConfigData)
        return <LoaderOverlay visible message={t.Settings.text2}/>;
      return (
        <Mobile
          onClose={onClose}
          mobileData={mobileData}
          mobileConfigData={mobileConfigData}
        />
      );

    case t.SettingsOptions.GPS:
      if (!gpsData || !datalogger)
        return <LoaderOverlay visible message={t.Settings.text3} />;
      return <GPS onClose={onClose} gpsData={gpsData} datalogger={datalogger} />;

    case t.SettingsOptions.MQTT:
      if (!mqttData || !mqttConfigData)
        return <LoaderOverlay visible message={t.Settings.text4} />;
      return (
        <MQTT
          onClose={onClose}
          mqttData={mqttData}
          mqttConfigData={mqttConfigData}
        />
      );

    case t.SettingsOptions.Drivers:
      if (!drivers)
        return <LoaderOverlay visible message={t.Settings.text5} />;
      return <Drivers onClose={onClose} drivers={drivers} />;

    case t.SettingsOptions.Serial:
      if (!serialData)
        return <LoaderOverlay visible message={t.Settings.text6} />;
      return <Serial onClose={onClose} serialData={serialData} />;

    case t.SettingsOptions.IOs:
      if (!iosData || !iosPubData)
        return <LoaderOverlay visible message={t.Settings.text7} />;
      return <IOs onClose={onClose} iosData={iosData} iosPubData={iosPubData} />;

    case t.SettingsOptions.Updates:
      if (!datalogger)
        return <LoaderOverlay visible message={t.Settings.text1} />;
      return <Updates onClose={onClose} datalogger={datalogger} />;

    case t.SettingsOptions.Commands:
      if (!commandsData)
        return <LoaderOverlay visible message={t.Settings.text9} />;
      return <Commands onClose={onClose} commandData={commandsData} />;

    case t.SettingsOptions.Password:
      return <ChangePasswordModal onClose={onClose} visible />;

    default:
      return null;
  }
}
