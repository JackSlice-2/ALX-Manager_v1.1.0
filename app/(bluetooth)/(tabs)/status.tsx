import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import ScreenOne from '@/components/bluetooth/dashboard/screens/ScreenOne';
import ScreenTwo from '@/components/bluetooth/dashboard/screens/ScreenTwo';
import ScreenThree from '@/components/bluetooth/dashboard/screens/ScreenThree';
import PageContainer from '../../../components/PageContainer';
import useGetInfo from '@/utils/getEvery5Seconds';
import LoaderOverlay from '@/components/LoaderOverlay';
import { useKeepAwake } from 'expo-keep-awake'
import { useT } from '@/hooks/useT';

export default function Dashboard() {
  
  useKeepAwake()
  const t = useT();
  const hasInitialized = React.useRef(false);

  const { width } = useWindowDimensions();
  const gap = 10;
  const numberOfScreens = 1.135;
  const screenWidth = (width - gap * (numberOfScreens - 1)) / numberOfScreens;
  const isSmallDevice = width < 750;

  const dataloggerHook = useGetInfo('/req_info_datalogger');
  const configHook     = useGetInfo('/req_info_config_RS232_RS485');
  const iosHook        = useGetInfo('/req_info_ios');
  const rawHook        = useGetInfo('/req_info_drivers');

  const datalogger = dataloggerHook.info;
  const config     = configHook.info;
  const ios        = iosHook.info;
  const raw        = rawHook.info;
  
  useEffect(() => {
    if (hasInitialized.current) return;
    if (!datalogger) return;
    if (!configHook) return;
    if (!iosHook) return;
    if (!rawHook) return;
  
    const fullData = {
      ...datalogger,
      ...configHook,
      ...iosHook,
      ...rawHook
    }
  
    hasInitialized.current = fullData && Object.keys(fullData).length > 0;
  }, [datalogger, configHook, iosHook, rawHook]);

  return (
    <PageContainer
      title={"Status do Datalogger"}
      image={require('@/assets/images/SVG/icons8-info-250.png')}
    >
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {!hasInitialized.current ? (
          <View style={{position: 'absolute', top: 50, left: 0, right: 0, bottom: 0, height: 200}}>
            <LoaderOverlay visible message={t.System.LoadingInfo} />
          </View>
          ) : (
            <>
              <ScreenOne
                screenWidth={screenWidth}
                isSmallDevice={isSmallDevice}
              />
              <ScreenTwo
                screenWidth={screenWidth}
                datalogger={datalogger}
                config={config}
                ios={ios}
              />
              <ScreenThree
                screenWidth={screenWidth}
                raw={raw}
              />
          </>
         )
        }
      </ScrollView>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
});
