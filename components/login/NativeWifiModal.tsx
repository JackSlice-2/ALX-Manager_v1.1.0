import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LoaderOverlay from '@/components/LoaderOverlay';
import { useT } from '@/hooks/useT';

interface NativeWifiProps {
    isModalVisible: any
    availableGateways: any
    handleConnect: any
    setIsModalVisible: any
    showQRScanner: any
    isConnecting: any
}

const NativeWifiModal: React.FC<NativeWifiProps> = ({
    isModalVisible,
    availableGateways,
    handleConnect,
    setIsModalVisible,
    showQRScanner,
    isConnecting
}) => {
  const t = useT();

    return (
      <Modal visible={isModalVisible && !showQRScanner} transparent={true} animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.listContainer}>
          {isConnecting ? (
            <View style={{ marginTop: 20 }}>
              <LoaderOverlay visible={true} message="Conectando ao Gateway..." />
            </View>
          ) : (
          <>
            <Text style={styles.title}>
              {t.WiFiModal.text0}
            </Text>
            <ScrollView style={styles.list}>
              {availableGateways.map((ssid: any, index: any) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.ssidButton}
                  onPress={() => {
                  handleConnect({ ssid }, "BYPASS");
                  setIsModalVisible(false);
                  }}
                >
                  <Text style={styles.buttonText}>{ssid}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={styles.cancelText}>
                  {t.WiFiModal.text1}
                </Text>
              </TouchableOpacity>
            </>
          )
        }
      </View>
    </View>
  </Modal>
  )
}
export default NativeWifiModal

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: 'rgb(250, 251, 252)',
  },
  errorMessageContainer: {
    marginTop: 20,
    backgroundColor: '#FF6B6B',
    padding: 10,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
  },
  errorMessage: { 
    color: '#fff', 
    fontWeight: 'bold', 
    textAlign: 'center' 
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    height: '40%',
    width: "80%",
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { 
      width: 0, 
      height: 4 
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  list: {
    marginVertical: 10,
  },
  ssidButton: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  cancelButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    alignSelf: 'flex-end',
  },
  cancelText: {
    fontSize: 15,
    color: '#FF3B30',
    fontWeight: '600',
  },
});