import { router, useGlobalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, TouchableOpacity, View, } from 'react-native';
import PageContainer from '@/components/PageContainer';
import RobotoText from '@/components/RobotoText';
import RenderModals from '@/components/bluetooth/settings/RenderModels';
import useAllSettingsData from '@/components/bluetooth/settings/useAllSettings';
import { useT } from '@/hooks/useT';
import { useBluetoothConfigOptions } from '@/utils/constants';

export default function Settings() {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const { selectedOption: option }: any = useGlobalSearchParams();

  const {
    RTC,
    RTCConfig,
    RegisterData,
    RegisterConfigData,
    mobile,
    mobileConfig,
    datalogger,
    gps,
    mqtt,
    mqttConfig,
    ios,
    iosPub,
    drivers,
    serial,
    commands,
  } = useAllSettingsData();

  const t = useT()

  useEffect(() => {
    if (option) {
      router.navigate('/settings');
      setSelectedOption(option);
    }
  }, [option]);

  const optionReadyMap: Record<string, boolean> = {
    [t.SettingsOptions.RTC]: !!RTC.info,
    [t.SettingsOptions.Register]: !!RegisterData.info && !!RegisterConfigData.info,
    [t.SettingsOptions.Mobile]: !!mobile.info && !!mobileConfig.info,
    [t.SettingsOptions.GPS]: !!gps.info && !!datalogger.info,
    [t.SettingsOptions.MQTT]: !!mqtt.info && !!mqttConfig.info,
    [t.SettingsOptions.Drivers]: !!drivers.info,
    [t.SettingsOptions.Serial]: !!serial.info,
    [t.SettingsOptions.IOs]: !!ios.info && !!iosPub.info,
    [t.SettingsOptions.Updates]: !!datalogger.info,
    [t.SettingsOptions.Commands]: !!commands.info,
    [t.SettingsOptions.Password]: true,
  };

  const isOptionReady = (label: string) =>
    optionReadyMap[label] === true;

  const handleOptionPress = (label: string) => {
    if (!isOptionReady(label)) return;
    setSelectedOption(label);
  };

  return (
    <PageContainer
      title={t.Settings.text0}
      image={require('@/assets/images/Tools.png')}
    >
      <View style={styles.optionsContainer}>
        {useBluetoothConfigOptions().map(({ label, image }: any) => {
          const enabled = isOptionReady(label);

          return (
            <TouchableOpacity
              key={label}
              onPress={() => handleOptionPress(label)}
              style={[
                styles.optionBox,
                !enabled && styles.disabledOption,
              ]}
              activeOpacity={enabled ? 0.8 : 1}
            >
              <Image
                source={image}
                style={styles.optionImage}
                resizeMode="contain"
              />
              <RobotoText style={styles.optionLabel}>
                {label}
              </RobotoText>
            </TouchableOpacity>
          );
        })}
      </View>

      <RenderModals
        selectedOption={selectedOption}
        setSelectedOption={setSelectedOption}

        RTC={RTC.info ?? undefined}
        RTCConfig={RTCConfig.info ?? undefined}

        mobileData={mobile.info ?? undefined}
        mobileConfigData={mobileConfig.info ?? undefined}

        RegisterData={mobile.info ?? undefined}
        RegisterConfigData={mobileConfig.info ?? undefined}

        datalogger={datalogger.info ?? undefined}
        gpsData={gps.info ?? undefined}

        mqttData={mqtt.info ?? undefined}
        mqttConfigData={mqttConfig.info ?? undefined}

        iosData={ios.info ?? undefined}
        iosPubData={iosPub.info ?? undefined}

        drivers={drivers.info ?? undefined}
        serialData={serial.info ?? undefined}
        commandsData={commands.info ?? undefined}
      />
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  optionBox: {
    backgroundColor: 'rgba(228, 228, 228, 1)',
    paddingHorizontal: 10,
    borderRadius: 10,
    width: '48%',
    aspectRatio: 1,
    marginBottom: 10,
    justifyContent: 'center',
  },
  disabledOption: {
    opacity: 0.4,
  },
  optionLabel: {
    color: '#7c7c7cff',
    fontSize: 17,
    fontWeight: '400',
    marginTop: 10,
  },
  optionImage: {
    width: 50,
    height: 50,
    marginTop: -15,
  },
});
