import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import ModalHeader from './ModalHeader';
import LoaderOverlay from '@/components/LoaderOverlay';
import { CommandsData, DataloggerData, Driver, GPSData, IOSData, IOSPubData, MobileConfigData, MobileData, MobileInfo, MqttConfigData, MQTTData, SerialData, WifiData, NetworkItem, SerialInfo } from '../types';
import { useT } from '@/hooks/useT';

interface ModalContainerProps {
  onClose: any
  image?: any
  title?: string
  visible: boolean
  children: any
  headerButton?: boolean
  onPress?: any
  data: WifiData | MobileData | GPSData | DataloggerData | MQTTData | Driver[] | SerialData | IOSData | CommandsData | IOSPubData | MobileInfo | MobileConfigData | MqttConfigData | NetworkItem[] | "Drivers" | SerialInfo
}

const ModalContainer: React.FC<ModalContainerProps> = ({
  onClose,
  image,
  title,
  visible,
  children,
  headerButton,
  onPress,
  data
}) => {

    const [minLoadingDone, setMinLoadingDone] = useState(false);
    const t = useT()

     useEffect(() => {
    if (visible) {
      setMinLoadingDone(false);

      const timer = setTimeout(() => {
        setMinLoadingDone(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const shouldShowLoader =
    !minLoadingDone || !data || Object.keys(data).length === 0;


  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalContainer}>
          <ModalHeader
            onClose={onClose}
            title={title}
            image={image}
            headerButton={headerButton}
            onPress={onPress}
          />
         

          <KeyboardAwareScrollView
            style={styles.scrollContainer}
            contentContainerStyle={{ paddingBottom: 30 }}
            extraScrollHeight={60}
            enableOnAndroid={true}
          >
            {children}
          </KeyboardAwareScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

export default ModalContainer

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    top: 40,
    width: '90%',
    maxHeight: '75%',
    alignItems: 'center',
  },
  scrollContainer: {
    width: '100%',
  },
})
