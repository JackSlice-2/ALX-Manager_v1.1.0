import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  NativeEventEmitter,
  NativeModules,
  DeviceEventEmitter,
} from 'react-native';
import RobotoText from '../../RobotoText';
import { Ionicons } from '@expo/vector-icons';
import { useT } from '@/hooks/useT';

type BluetoothDevice = {
  name: string;
  address: string;
  rssi: number;
};

type Props = {
  visible: boolean;
  onClose: () => void;
};

const ManualBluetoothModal: React.FC<Props> = ({
  visible,
  onClose,
}) => {
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [selectedDevice, setSelectedDevice] =
    useState<BluetoothDevice | null>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
const [connectedAddress, setConnectedAddress] =
  useState<string | null>(null);
  const [password, setPassword] = useState('');

  const t = useT();

const { AlxBleGatt } = NativeModules;

// ---------------------------------------------------------
// ALX BLE GATT events
// ---------------------------------------------------------

// Inside ManualBluetoothModal.tsx, add a listener effect for data parsing:
useEffect(() => {
  const dataSub = DeviceEventEmitter.addListener('AlxBleDataReceived', (event) => {
    console.log('[BLE] Raw Gateway Data Packet:', event.hexCompact);
    
    // Example: parse the incoming packet bytes
    // const parsedData = parseAlxGatewayStatus(event.hexCompact);
    // if (parsedData) {
    //   setGatewayInfo(parsedData);
    // }
  });

  return () => {
    dataSub.remove();
  };
}, []);

useEffect(() => {
  console.log(
    '[BLE] AlxBleGatt:',
    AlxBleGatt
  );

  if (!AlxBleGatt) {
    console.error(
      '[BLE] AlxBleGatt MODULE NOT FOUND'
    );

    return;
  }

  AlxBleGatt.isConnected()
    .then((connected: boolean) => {
      console.log(
        '[BLE] AlxBleGatt.isConnected():',
        connected
      );
    })
    .catch((error: unknown) => {
      console.error(
        '[BLE] AlxBleGatt.isConnected() ERROR:',
        error
      );
    });
}, []);

useEffect(() => {
  if (!AlxBleGatt) {
    return;
  }

  const readySubscription =
    DeviceEventEmitter.addListener(
      'AlxBleGattReady',
      async (event) => {
        console.log(
          '[BLE] ALX GATT ready:',
          event
        );

        try {
          console.log(
            '[BLE] Enabling ALX RX notifications...'
          );

          await AlxBleGatt.enableNotifications();

          console.log(
            '[BLE] enableNotifications() requested'
          );
        } catch (error) {
          console.error(
            '[BLE] enableNotifications() failed:',
            error
          );
        }
      }
    );
const notificationSubscription = DeviceEventEmitter.addListener(
  'AlxBleGattNotificationEnabled',
  async (event) => {
    console.log('[BLE] Notification enabled:', event);

    try {
      console.log('[BLE] Sending initial STS command to prevent timeout...');
      await AlxBleGatt.sendSts();
      console.log('[BLE] STS command sent successfully!');
    } catch (error) {
      console.error('[BLE] Failed to send initial command:', error);
    }
  }
);

  const notificationFailedSubscription =
    DeviceEventEmitter.addListener(
      'AlxBleGattNotificationFailed',
      (event) => {
        console.error(
          '[BLE] Notification enable failed:',
          event
        );
      }
    );

  const dataSubscription =
    DeviceEventEmitter.addListener(
      'AlxBleDataReceived',
      (event) => {
        console.log(
          '[BLE] ALX DATA RECEIVED:',
          event
        );
      }
    );

  return () => {
    readySubscription.remove();
    notificationSubscription.remove();
    notificationFailedSubscription.remove();
    dataSubscription.remove();
  };
}, []);
  // ---------------------------------------------------------
  // BLE scan
  // ---------------------------------------------------------

  useEffect(() => {
    if (!visible) {
      return;
    }

    const bluetoothHelper = NativeModules.BluetoothHelper;

    if (!bluetoothHelper) {
      console.log(
        '[Bluetooth Modal] BluetoothHelper unavailable'
      );
      return;
    }

    const emitter = new NativeEventEmitter(
      bluetoothHelper
    );

    const deviceSubscription = emitter.addListener(
      'BluetoothDeviceFound',
      (device: BluetoothDevice) => {
        console.log(
          '[Bluetooth Modal] Device found:',
          device.name,
          device.address,
          'RSSI:',
          device.rssi
        );

        if (!device.name?.startsWith('ALX-')) {
          return;
        }

        setDevices((currentDevices) => {
          const existingIndex =
            currentDevices.findIndex(
              (item) =>
                item.address === device.address
            );

          if (existingIndex === -1) {
            return [...currentDevices, device];
          }

          const updated = [...currentDevices];

          updated[existingIndex] = device;

          return updated;
        });
      }
    );

    const scanFailedSubscription =
      emitter.addListener(
        'BluetoothScanFailed',
        (errorCode) => {
          console.log(
            '[Bluetooth Modal] Scan failed:',
            errorCode
          );

          setIsScanning(false);
        }
      );

    const startScan = async () => {
      try {
        console.log(
          '[Bluetooth Modal] Starting BLE scan...'
        );

        setDevices([]);
        setSelectedDevice(null);
        setIsScanning(true);

        await bluetoothHelper.startBleScan();

        console.log(
          '[Bluetooth Modal] BLE scan started'
        );
      } catch (error) {
        console.log(
          '[Bluetooth Modal] BLE scan error:',
          error
        );

        setIsScanning(false);
      }
    };

    startScan();

    return () => {
      deviceSubscription.remove();
      scanFailedSubscription.remove();

      bluetoothHelper
        .stopBleScan()
        .catch(() => {});

      setIsScanning(false);
    };
  }, [visible]);

  // ---------------------------------------------------------
  // BLE connection events
  // ---------------------------------------------------------

  useEffect(() => {
    const bluetoothHelper =
      NativeModules.BluetoothHelper;

    if (!bluetoothHelper) {
      return;
    }

    const emitter = new NativeEventEmitter(
      bluetoothHelper
    );

    const connectedSubscription =
      emitter.addListener(
        'BluetoothConnected',
        (address: string) => {
          console.log(
            '[Bluetooth Modal] BLE connected:',
            address
          );

          setIsConnecting(false);
          setConnectedAddress(address);
        }
      );

    const failedSubscription =
      emitter.addListener(
        'BluetoothConnectionFailed',
        (errorCode: number) => {
          console.log(
            '[Bluetooth Modal] BLE connection failed:',
            errorCode
          );

          setIsConnecting(false);
        }
      );

    const disconnectedSubscription =
      emitter.addListener(
        'BluetoothDisconnected',
        (address: string) => {
          console.log(
            '[Bluetooth Modal] BLE disconnected:',
            address
          );

          setConnectedAddress(
            (currentAddress) =>
              currentAddress === address
                ? null
                : currentAddress
          );
        }
      );

    return () => {
      connectedSubscription.remove();
      failedSubscription.remove();
      disconnectedSubscription.remove();
    };
  }, []);

  // ---------------------------------------------------------
  // Select device
  // ---------------------------------------------------------

  const handleSelect = (
    device: BluetoothDevice
  ) => {
    if (
      selectedDevice?.address ===
      device.address
    ) {
      setSelectedDevice(null);
    } else {
      setSelectedDevice(device);
    }
  };

  // ---------------------------------------------------------
  // Connect
  // ---------------------------------------------------------
const handleConnect = async (
  device: BluetoothDevice
) => {
  try {
    const bluetoothHelper =
      NativeModules.BluetoothHelper;

    if (!bluetoothHelper) {
      console.log(
        '[Bluetooth Modal] BluetoothHelper unavailable'
      );
      return;
    }

    const bluetoothPassword = '123456';

    console.log(
      '[Bluetooth Modal] Connecting to:',
      device.name,
      device.address
    );

    setIsConnecting(true);

    await bluetoothHelper.connectBleDevice(
      device.address,
      bluetoothPassword
    );

  } catch (error) {
    console.log(
      '[Bluetooth Modal] Connection error:',
      error
    );

    setIsConnecting(false);
  }
};

  // ---------------------------------------------------------
  // Render
  // ---------------------------------------------------------

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
    >
      <View style={styles.overlay}>
        <View style={styles.container}>

          <Text style={styles.title}>
            {t.System.Connect}
          </Text>

          <ScrollView style={styles.list}>

            {devices.map((device) => {
              const isSelected =
                selectedDevice?.address ===
                device.address;

              const isConnected =
                connectedAddress ===
                device.address;

              return (
                <View
                  key={device.address}
                  style={styles.deviceBlock}
                >

                  <TouchableOpacity
                    style={[
                      styles.deviceItem,
                      isSelected &&
                        styles.selected,
                    ]}
                    onPress={() =>
                      handleSelect(device)
                    }
                  >
                    <View
                      style={styles.deviceInfo}
                    >

                      <View
                        style={styles.nameRow}
                      >
                        <Ionicons
                          name="bluetooth"
                          size={20}
                          color="#007ACC"
                        />

                        <Text
                          style={
                            styles.deviceName
                          }
                        >
                          {device.name}
                        </Text>
                      </View>

                      <Text
                        style={styles.address}
                      >
                        {device.address}
                      </Text>

                      <Text
                        style={styles.rssi}
                      >
                        RSSI: {device.rssi} dBm
                      </Text>

                    </View>
                  </TouchableOpacity>

                 {isSelected && (
  <View style={styles.expanded}>

    <Text
      style={styles.selectedTitle}
    >
      {device.name}
    </Text>

    <Text
      style={styles.selectedAddress}
    >
      {device.address}
    </Text>

    <TextInput
      value={password}
      onChangeText={setPassword}
      placeholder="Senha Bluetooth"
      secureTextEntry
      autoCapitalize="none"
      autoCorrect={false}
      editable={!isConnecting && !isConnected}
      style={styles.passwordInput}
    />

    <TouchableOpacity
      style={styles.connectBtn}
      onPress={() =>
        handleConnect(device)
      }
      disabled={
        isConnecting ||
        isConnected ||
        password.length === 0
      }
    >
      <RobotoText
        style={{
          color: '#fff',
        }}
      >
        {isConnecting &&
        !isConnected
          ? t.System.Connecting
          : isConnected
            ? 'Conectado'
            : t.System.Connect}
      </RobotoText>
    </TouchableOpacity>

  </View>
)}

                </View>
              );
            })}

            {!isScanning &&
              devices.length === 0 && (
                <View
                  style={styles.empty}
                >
                  <Ionicons
                    name="bluetooth"
                    size={32}
                    color="#999"
                  />

                  <Text
                    style={styles.emptyText}
                  >
                    Nenhum dispositivo ALX
                    encontrado.
                  </Text>
                </View>
              )}

            {isScanning &&
              devices.length === 0 && (
                <View
                  style={styles.empty}
                >
                  <Ionicons
                    name="bluetooth"
                    size={32}
                    color="#007ACC"
                  />

                  <Text
                    style={styles.emptyText}
                  >
                    Procurando dispositivos
                    Bluetooth...
                  </Text>
                </View>
              )}

          </ScrollView>

          <TouchableOpacity
            onPress={() => {
              setSelectedDevice(null);
              setDevices([]);
              setIsConnecting(false);
              setPassword('');
              onClose();
            }}
            style={styles.cancelBtn}
          >
            <RobotoText
              style={{ color: 'red' }}
            >
              {t.System.Cancel}
            </RobotoText>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
};

export default ManualBluetoothModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#00000080',
    justifyContent: 'center',
    alignItems: 'center',
  },

  container: {
    width: '85%',
    maxHeight: '70%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  passwordInput: {
  backgroundColor: '#fff',
  borderWidth: 1,
  borderColor: '#d1d5db',
  borderRadius: 8,
  paddingHorizontal: 12,
  paddingVertical: 10,
  marginBottom: 10,
  fontSize: 14,
  color: 'black'
},

  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  list: {
    marginBottom: 10,
  },

  deviceBlock: {
    marginBottom: 8,
  },

  deviceItem: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
  },

  selected: {
    backgroundColor: '#dbeafe',
  },

  deviceInfo: {
    flex: 1,
  },

  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  deviceName: {
    fontSize: 15,
    fontWeight: '500',
  },

  address: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },

  rssi: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },

  expanded: {
    marginTop: 8,
    padding: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 10,
  },

  selectedTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },

  selectedAddress: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
  },

  connectBtn: {
    backgroundColor: '#1e40af',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },

  cancelBtn: {
    marginTop: 10,
    alignItems: 'flex-end',
  },

  empty: {
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});