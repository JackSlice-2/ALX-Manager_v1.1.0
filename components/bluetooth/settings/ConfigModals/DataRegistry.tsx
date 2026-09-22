import React from 'react';
import {
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import ModalContainer from '@/components/utils/modalParts/ModalContainer';
import { MobileConfigData, MobileInfo } from '@/components/utils/types';
import { useT } from '@/hooks/useT';

import NormalOperation from './DataRegistry/NormalOperation';
import AlarmOperation from './DataRegistry/AlarmOperation';
import AlarmConfigs from './DataRegistry/AlarmConfigs';

interface DataRegistryProps {
  onClose: () => void;
  mobileData: MobileInfo;
  mobileConfigData: MobileConfigData;
}

const DataRegistry: React.FC<DataRegistryProps> = ({
  onClose,
  mobileData,
  mobileConfigData,
}) => {
  const t = useT();
  const { width } = useWindowDimensions();
  const pageWidth = width * 0.8;

  

  return (
    <ModalContainer
      visible
      onClose={onClose}
      title={t.SettingsOptions.Register}
      image={require('@/assets/images/server.png')}
      data={mobileData || mobileConfigData}
    >
<ScrollView
  horizontal
  pagingEnabled
  snapToInterval={pageWidth}
  snapToAlignment="start"
  decelerationRate="fast"
  disableIntervalMomentum
  showsHorizontalScrollIndicator={false}
  directionalLockEnabled
  bounces={false}
  style={styles.scrollView}
  contentContainerStyle={styles.scrollContent}
>
  <View style={{ width: pageWidth }}>
    <NormalOperation
      mobileData={mobileData}
      mobileConfigData={mobileConfigData}
      onClose={onClose}
    />
  </View>

  <View style={{ width: pageWidth }}>
    <AlarmOperation
      mobileData={mobileData}
      mobileConfigData={mobileConfigData}
      onClose={onClose}
    />
  </View>

  <View style={{ width: pageWidth }}>
    <AlarmConfigs
      mobileData={mobileData}
      mobileConfigData={mobileConfigData}
      onClose={onClose}
    />
  </View>
</ScrollView>
    </ModalContainer>
  );
};

export default DataRegistry;

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    width: '100%',
  },

  scrollContent: {
    flexDirection: 'row',
  },
});