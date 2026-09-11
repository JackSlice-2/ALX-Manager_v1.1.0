import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LoaderOverlay from '@/components/LoaderOverlay';
import { useT } from '@/hooks/useT';

export type BluetoothDevice = {
  name: string;
  address: string;
  rssi: number;
};

interface NativeBluetoothProps {
  isModalVisible: boolean;
  availableDevices: BluetoothDevice[];
  handleConnect: (device: BluetoothDevice) => void;
  setIsModalVisible: (visible: boolean) => void;
  isConnecting: boolean;
}

const NativeBluetoothModal: React.FC<NativeBluetoothProps> = ({
  isModalVisible,
  availableDevices,
  handleConnect,
  setIsModalVisible,
  isConnecting,
}) => {
  const t = useT();

  return (
    <Modal
      visible={isModalVisible}
      transparent
      animationType="fade"
    >
      <View style={styles.overlay}>
        <View style={styles.listContainer}>
          {isConnecting ? (
            <View style={{ marginTop: 20 }}>
              <LoaderOverlay
                visible={true}
                message="Conectando ao Gateway..."
              />
            </View>
          ) : (
            <>
              <Text style={styles.title}>
                Dispositivos Bluetooth
              </Text>

              <ScrollView style={styles.list}>
                {availableDevices.map((device) => (
                  <TouchableOpacity
                    key={device.address}
                    style={styles.deviceButton}
                    onPress={() => {
                      handleConnect(device);
                      setIsModalVisible(false);
                    }}
                  >
                    <View>
                      <Text style={styles.buttonText}>
                        {device.name}
                      </Text>

                      <Text style={styles.addressText}>
                        {device.address}
                      </Text>
                    </View>

                    <Text style={styles.rssiText}>
                      {device.rssi} dBm
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={styles.cancelText}>
                  {t.System.Cancel}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default NativeBluetoothModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  listContainer: {
    height: '40%',
    width: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
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

  deviceButton: {
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

  addressText: {
    fontSize: 12,
    color: '#777',
    marginTop: 3,
  },

  rssiText: {
    fontSize: 12,
    color: '#555',
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