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

/**
 * BLE logging
 *
 * Keep logs focused on state transitions and failures.
 * Avoid logging passwords, repeated scan results, or
 * listener lifecycle noise.
 */
const bleLog = (
  category: string,
  message: string,
  data?: unknown
) => {
  if (data !== undefined) {
    console.log(`[BLE] [${category}] ${message}`, data);
  } else {
    console.log(`[BLE] [${category}] ${message}`);
  }
};

const bleError = (
  category: string,
  message: string,
  error?: unknown
) => {
  if (error !== undefined) {
    console.error(`[BLE] [${category}] ${message}`, error);
  } else {
    console.error(`[BLE] [${category}] ${message}`);
  }
};

const bleWarn = (
  category: string,
  message: string,
  data?: unknown
) => {
  if (data !== undefined) {
    console.warn(`[BLE] [${category}] ${message}`, data);
  } else {
    console.warn(`[BLE] [${category}] ${message}`);
  }
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

  const [gattReady, setGattReady] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] =
    useState(false);
  const [protocolReady, setProtocolReady] = useState(false);

  const [readingRx, setReadingRx] = useState(false);
  const [readingRx2, setReadingRx2] = useState(false);

  const t = useT();

  const {
    BluetoothHelper,
    BluetoothConnection,
    AlxBleGatt,
    AlxBleTransport,
    AlxBleProtocol,
  } = NativeModules;

  // =========================================================
  // Native module validation
  // =========================================================

  useEffect(() => {
    const modules = {
      BluetoothHelper,
      BluetoothConnection,
      AlxBleGatt,
      AlxBleTransport,
      AlxBleProtocol,
    };

    Object.entries(modules).forEach(([name, module]) => {
      if (!module) {
        bleError(
          'NATIVE',
          `${name} native module is unavailable`
        );
      }
    });
  }, [
    BluetoothHelper,
    BluetoothConnection,
    AlxBleGatt,
    AlxBleTransport,
    AlxBleProtocol,
  ]);

  // =========================================================
  // Initial GATT state
  // =========================================================

  useEffect(() => {
    if (
      !AlxBleGatt ||
      typeof AlxBleGatt.getGattState !== 'function'
    ) {
      return;
    }

    AlxBleGatt.getGattState()
      .then((state: unknown) => {
        const gattState = state as {
          ready?: boolean;
        };

        setGattReady(gattState?.ready === true);
      })
      .catch((error: unknown) => {
        bleError(
          'GATT',
          'Failed to query GATT state',
          error
        );
      });
  }, [AlxBleGatt]);

  // =========================================================
  // Initial transport state
  // =========================================================

  useEffect(() => {
    if (
      !AlxBleTransport ||
      typeof AlxBleTransport.getTransportState !==
        'function'
    ) {
      return;
    }

    AlxBleTransport.getTransportState().catch(
      (error: unknown) => {
        bleError(
          'TRANSPORT',
          'Failed to query transport state',
          error
        );
      }
    );
  }, [AlxBleTransport]);

  // =========================================================
  // Protocol state
  // =========================================================

  useEffect(() => {
    if (
      !AlxBleProtocol ||
      typeof AlxBleProtocol.getProtocolState !==
        'function'
    ) {
      return;
    }

    AlxBleProtocol.getProtocolState()
      .then(() => {
        setProtocolReady(true);
      })
      .catch((error: unknown) => {
        bleError(
          'PROTOCOL',
          'Failed to query protocol state',
          error
        );
      });
  }, [AlxBleProtocol]);

  // =========================================================
  // Raw BLE data
  // =========================================================

  useEffect(() => {
    const subscription =
      DeviceEventEmitter.addListener(
        'AlxBleDataReceived',
        (event) => {
          bleLog('RX', 'BLE data received', {
            source: event?.source,
            uuid: event?.uuid,
            length: event?.length,
            hex: event?.hex,
          });
        }
      );

    return () => subscription.remove();
  }, []);

  // =========================================================
  // ALX protocol frames
  // =========================================================

  useEffect(() => {
    const subscription =
      DeviceEventEmitter.addListener(
        'AlxBleFrameReceived',
        (event) => {
          bleLog('PROTOCOL', 'ALX frame received', {
            direction: event?.direction,
            command: event?.command,
            payload: event?.payload,
            crcValid: event?.crcValid,
            hex: event?.hex,
          });
        }
      );

    return () => subscription.remove();
  }, []);

  // =========================================================
  // ALX GATT events
  // =========================================================

  useEffect(() => {
    const readySubscription =
      DeviceEventEmitter.addListener(
        'AlxBleGattReady',
        (event) => {
          bleLog('GATT', 'GATT ready', {
            service: event?.service,
            tx: event?.tx,
            rx: event?.rx,
            rx2: event?.rx2,
          });

          setGattReady(true);

          /*
           * Notifications are intentionally NOT enabled here.
           *
           * Enabling notifications performs a CCCD write.
           * On the current ALX-5DLG/Samsung configuration,
           * that operation triggers BLE security negotiation.
           *
           * GATT readiness and notification subscription
           * therefore remain separate states.
           */
        }
      );

    const failedSubscription =
      DeviceEventEmitter.addListener(
        'AlxBleGattFailed',
        (event) => {
          bleError(
            'GATT',
            'GATT setup failed',
            event
          );

          setGattReady(false);
          setNotificationsEnabled(false);
        }
      );

    return () => {
      readySubscription.remove();
      failedSubscription.remove();
    };
  }, []);

  // =========================================================
  // Transport events
  // =========================================================

  useEffect(() => {
    const subscription =
      DeviceEventEmitter.addListener(
        'AlxBleNotificationEnabled',
        (event) => {
          if (event?.enabled === true) {
            bleLog(
              'TRANSPORT',
              `${event?.source ?? 'BLE'} notifications enabled`
            );

            setNotificationsEnabled(true);
          } else {
            bleError(
              'TRANSPORT',
              `${event?.source ?? 'BLE'} notifications failed`,
              event?.error
            );

            setNotificationsEnabled(false);
          }
        }
      );

    return () => subscription.remove();
  }, []);

  // =========================================================
  // BLE scan
  // =========================================================

  useEffect(() => {
    if (!visible || !BluetoothHelper) {
      return;
    }

    const emitter =
      new NativeEventEmitter(BluetoothHelper);

    const deviceSubscription =
      emitter.addListener(
        'BluetoothDeviceFound',
        (device: BluetoothDevice) => {
          if (
            !device?.name
              ?.toUpperCase()
              .startsWith('ALX')
          ) {
            return;
          }

          setDevices((currentDevices) => {
            const existingIndex =
              currentDevices.findIndex(
                (item) =>
                  item.address === device.address
              );

            if (existingIndex === -1) {
              bleLog('SCAN', 'ALX device found', {
                name: device.name,
                address: device.address,
                rssi: device.rssi,
              });

              return [
                ...currentDevices,
                device,
              ];
            }

            const updated = [
              ...currentDevices,
            ];

            updated[existingIndex] = device;

            return updated;
          });
        }
      );

    const scanFailedSubscription =
      emitter.addListener(
        'BluetoothScanFailed',
        (event) => {
          bleError(
            'SCAN',
            'BLE scan failed',
            event
          );

          setIsScanning(false);
        }
      );

    const startScan = async () => {
      try {
        setDevices([]);
        setSelectedDevice(null);
        setGattReady(false);
        setNotificationsEnabled(false);
        setIsScanning(true);

        if (
          typeof BluetoothHelper.startBleScan !==
          'function'
        ) {
          throw new Error(
            'BluetoothHelper.startBleScan() unavailable'
          );
        }

        await BluetoothHelper.startBleScan();

        bleLog('SCAN', 'BLE scan started');
      } catch (error) {
        bleError(
          'SCAN',
          'Failed to start BLE scan',
          error
        );

        setIsScanning(false);
      }
    };

    startScan();

    return () => {
      deviceSubscription.remove();
      scanFailedSubscription.remove();

      if (
        typeof BluetoothHelper.stopBleScan ===
        'function'
      ) {
        BluetoothHelper.stopBleScan().catch(
          (error: unknown) => {
            bleWarn(
              'SCAN',
              'Failed to stop BLE scan',
              error
            );
          }
        );
      }

      setIsScanning(false);
    };
  }, [visible, BluetoothHelper]);

  // =========================================================
  // Bluetooth connection events
  // =========================================================

  useEffect(() => {
    if (!BluetoothConnection) {
      return;
    }

    const emitter =
      new NativeEventEmitter(
        BluetoothConnection
      );

    const connectedSubscription =
      emitter.addListener(
        'BluetoothConnected',
        (event) => {
          const address =
            typeof event === 'string'
              ? event
              : event?.address;

          bleLog(
            'CONNECTION',
            'Bluetooth connected',
            address
          );

          setIsConnecting(false);
          setConnectedAddress(
            address ?? null
          );
        }
      );

    const disconnectedSubscription =
      emitter.addListener(
        'BluetoothDisconnected',
        (event) => {
          bleLog(
            'CONNECTION',
            'Bluetooth disconnected',
            event
          );

          const address =
            typeof event === 'string'
              ? event
              : event?.address;

          setConnectedAddress(
            (currentAddress) =>
              currentAddress === address
                ? null
                : currentAddress
          );

          setIsConnecting(false);
          setGattReady(false);
          setNotificationsEnabled(false);
        }
      );

    const pairingSubscription =
      emitter.addListener(
        'BluetoothPairingRequest',
        (event) => {
          bleLog(
            'PAIRING',
            'Bluetooth pairing request',
            {
              address: event?.address,
              variant: event?.variant,
              variantName: event?.variantName,
            }
          );
        }
      );

    const bondSubscription =
      emitter.addListener(
        'BluetoothBondStateChanged',
        (event) => {
          bleLog(
            'BOND',
            `${event?.previousState ?? 'UNKNOWN'} → ${
              event?.state ?? 'UNKNOWN'
            }`,
            event?.address
          );
        }
      );

    return () => {
      connectedSubscription.remove();
      disconnectedSubscription.remove();
      pairingSubscription.remove();
      bondSubscription.remove();
    };
  }, [BluetoothConnection]);

  // =========================================================
  // Select device
  // =========================================================

  const handleSelect = (
    device: BluetoothDevice
  ) => {
    if (
      selectedDevice?.address ===
      device.address
    ) {
      setSelectedDevice(null);
      return;
    }

    bleLog(
      'UI',
      'Device selected',
      device.address
    );

    setSelectedDevice(device);
  };

  // =========================================================
  // Password
  // =========================================================

  const handlePasswordChange = (
    value: string
  ) => {
    // Never log the password.
    setPassword(value);
  };

  // =========================================================
  // Connect
  // =========================================================

  const handleConnect = async (
    device: BluetoothDevice
  ) => {
    if (!BluetoothConnection) {
      bleError(
        'CONNECTION',
        'BluetoothConnection unavailable'
      );
      return;
    }

    if (
      typeof BluetoothConnection.connectBleDevice !==
      'function'
    ) {
      bleError(
        'CONNECTION',
        'connectBleDevice() unavailable'
      );
      return;
    }

    try {
      setIsConnecting(true);
      setGattReady(false);
      setNotificationsEnabled(false);

      bleLog(
        'CONNECTION',
        'Connecting to BLE device',
        device.address
      );

      await BluetoothConnection.connectBleDevice(
        device.address,
        password
      );

      bleLog(
        'CONNECTION',
        'Connection request completed'
      );
    } catch (error) {
      bleError(
        'CONNECTION',
        'Connection failed',
        error
      );

      setIsConnecting(false);
      setConnectedAddress(null);
      setGattReady(false);
      setNotificationsEnabled(false);
    }
  };

  // =========================================================
  // Disconnect
  // =========================================================

  const handleDisconnect = async () => {
    if (
      !BluetoothConnection ||
      typeof BluetoothConnection.disconnectBleDevice !==
        'function'
    ) {
      bleWarn(
        'CONNECTION',
        'disconnectBleDevice() unavailable'
      );
      return;
    }

    try {
      await BluetoothConnection.disconnectBleDevice();

      setConnectedAddress(null);
      setGattReady(false);
      setNotificationsEnabled(false);
      setIsConnecting(false);
    } catch (error) {
      bleError(
        'CONNECTION',
        'Disconnect failed',
        error
      );
    }
  };

  // =========================================================
  // Close modal
  // =========================================================

  const handleClose = () => {
    /*
     * Deliberately do NOT disconnect here.
     */
    setSelectedDevice(null);
    setDevices([]);
    setIsConnecting(false);
    setPassword('');

    onClose();
  };

  // =========================================================
  // BLE test: RX read
  // =========================================================

  const readRx = async () => {
    if (
      !AlxBleTransport ||
      typeof AlxBleTransport.readRx !== 'function'
    ) {
      bleError(
        'TEST',
        'readRx() unavailable'
      );
      return;
    }

    if (readingRx || readingRx2) {
      return;
    }

    try {
      setReadingRx(true);

      bleLog('TEST', 'Reading RX');

      const result =
        await AlxBleTransport.readRx();

      bleLog('TEST', 'RX read result', result);
    } catch (error) {
      bleError(
        'TEST',
        'RX read failed',
        error
      );
    } finally {
      setReadingRx(false);
    }
  };

  // =========================================================
  // BLE test: RX2 read
  // =========================================================

  const readRx2 = async () => {
    if (
      !AlxBleTransport ||
      typeof AlxBleTransport.readRx2 !== 'function'
    ) {
      bleError(
        'TEST',
        'readRx2() unavailable'
      );
      return;
    }

    if (readingRx || readingRx2) {
      return;
    }

    try {
      setReadingRx2(true);

      bleLog('TEST', 'Reading RX2');

      const result =
        await AlxBleTransport.readRx2();

      bleLog(
        'TEST',
        'RX2 read result',
        result
      );
    } catch (error) {
      bleError(
        'TEST',
        'RX2 read failed',
        error
      );
    } finally {
      setReadingRx2(false);
    }
  };

  // =========================================================
  // BLE test: enable RX notifications
  // =========================================================

  const enableRxNotifications = async () => {
    if (
      !AlxBleTransport ||
      typeof AlxBleTransport.enableRxNotifications !==
        'function'
    ) {
      bleError(
        'TEST',
        'enableRxNotifications() unavailable'
      );
      return;
    }

    try {
      bleLog(
        'TEST',
        'Enabling RX notifications'
      );

      const result =
        await AlxBleTransport.enableRxNotifications();

      bleLog(
        'TEST',
        'RX notification result',
        result
      );
    } catch (error) {
      bleError(
        'TEST',
        'RX notification enable failed',
        error
      );
    }
  };

  // =========================================================
  // Render
  // =========================================================

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

          {connectedAddress && (
            <View style={styles.statusBox}>

              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusDot,
                    styles.statusConnected,
                  ]}
                />

                <Text style={styles.statusText}>
                  Bluetooth conectado
                </Text>
              </View>

              <Text style={styles.statusAddress}>
                {connectedAddress}
              </Text>

              <Text style={styles.statusDetail}>
                GATT:{' '}
                {gattReady
                  ? '✓ pronto'
                  : 'aguardando'}
              </Text>

              <Text style={styles.statusDetail}>
                Notifications:{' '}
                {notificationsEnabled
                  ? '✓ habilitadas'
                  : 'não habilitadas'}
              </Text>

              <Text style={styles.statusDetail}>
                Protocol:{' '}
                {protocolReady
                  ? '✓ carregado'
                  : 'aguardando'}
              </Text>

              <TouchableOpacity
                style={styles.disconnectBtn}
                onPress={handleDisconnect}
              >
                <RobotoText
                  style={{ color: '#fff' }}
                >
                  Desconectar
                </RobotoText>
              </TouchableOpacity>

            </View>
          )}

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
                      isConnected &&
                        styles.connectedItem,
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

                        {isConnected && (
                          <Text
                            style={
                              styles.connectedLabel
                            }
                          >
                            CONECTADO
                          </Text>
                        )}
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
                    <View
                      style={styles.expanded}
                    >

                      <Text
                        style={
                          styles.selectedTitle
                        }
                      >
                        {device.name}
                      </Text>

                      <Text
                        style={
                          styles.selectedAddress
                        }
                      >
                        {device.address}
                      </Text>

                      {!isConnected && (
                        <>
                          <TextInput
                            value={password}
                            onChangeText={
                              handlePasswordChange
                            }
                            placeholder="Senha Bluetooth"
                            secureTextEntry
                            autoCapitalize="none"
                            autoCorrect={false}
                            editable={
                              !isConnecting
                            }
                            style={
                              styles.passwordInput
                            }
                          />

                          <TouchableOpacity
                            style={
                              styles.connectBtn
                            }
                            onPress={() =>
                              handleConnect(
                                device
                              )
                            }
                            disabled={
                              isConnecting ||
                              password.length === 0
                            }
                          >
                            <RobotoText
                              style={{
                                color: '#fff',
                              }}
                            >
                              {isConnecting
                                ? t.System.Connecting
                                : t.System.Connect}
                            </RobotoText>
                          </TouchableOpacity>
                        </>
                      )}

                      {isConnected && (
                        <View
                          style={
                            styles.connectionDetails
                          }
                        >
                          <Text
                            style={
                              styles.detailText
                            }
                          >
                            GATT:{' '}
                            {gattReady
                              ? '✓ pronto'
                              : 'aguardando'}
                          </Text>

                          <Text
                            style={
                              styles.detailText
                            }
                          >
                            RX:{' '}
                            {notificationsEnabled
                              ? '✓ notifications ativas'
                              : 'não habilitadas'}
                          </Text>

                          <Text
                            style={
                              styles.detailText
                            }
                          >
                            ALX Protocol:{' '}
                            {protocolReady
                              ? '✓ disponível'
                              : 'aguardando'}
                          </Text>
                        </View>
                      )}

                    </View>
                  )}

                </View>
              );
            })}

            {!isScanning &&
              devices.length === 0 && (
                <View style={styles.empty}>
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
                <View style={styles.empty}>
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

            {/* BLE test buttons */}
            <View style={styles.bleTestContainer}>

              <TouchableOpacity
                style={[
                  styles.bleTestButton,
                  readingRx &&
                    styles.bleTestButtonDisabled,
                ]}
                disabled={
                  readingRx || readingRx2
                }
                onPress={readRx}
              >
                <Text
                  style={
                    styles.bleTestButtonText
                  }
                >
                  {readingRx
                    ? 'Lendo RX...'
                    : 'READ RX'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.bleTestButton,
                  readingRx2 &&
                    styles.bleTestButtonDisabled,
                ]}
                disabled={
                  readingRx || readingRx2
                }
                onPress={readRx2}
              >
                <Text
                  style={
                    styles.bleTestButtonText
                  }
                >
                  {readingRx2
                    ? 'Lendo RX2...'
                    : 'READ RX2'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.bleTestButton}
                onPress={
                  enableRxNotifications
                }
                disabled={
                  !gattReady ||
                  readingRx ||
                  readingRx2
                }
              >
                <Text
                  style={
                    styles.bleTestButtonText
                  }
                >
                  ENABLE RX NOTIFICATIONS
                </Text>
              </TouchableOpacity>

            </View>

          </ScrollView>

          <TouchableOpacity
            onPress={handleClose}
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

  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  statusBox: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  statusDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginRight: 7,
  },

  statusConnected: {
    backgroundColor: '#16a34a',
  },

  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#166534',
  },

  statusAddress: {
    fontSize: 11,
    color: '#4b5563',
    marginTop: 3,
  },

  statusDetail: {
    fontSize: 11,
    color: '#374151',
    marginTop: 3,
  },

  disconnectBtn: {
    backgroundColor: '#dc2626',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },

  bleTestContainer: {
    marginTop: 20,
    width: '80%',
    gap: 10,
  },

  bleTestButton: {
    backgroundColor: '#222',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },

  bleTestButtonDisabled: {
    opacity: 0.5,
  },

  bleTestButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
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

  connectedItem: {
    borderWidth: 1,
    borderColor: '#22c55e',
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

  connectedLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#16a34a',
    marginLeft: 'auto',
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

  passwordInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    fontSize: 14,
    color: 'black',
  },

  connectBtn: {
    backgroundColor: '#1e40af',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },

  connectionDetails: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 10,
  },

  detailText: {
    fontSize: 12,
    color: '#374151',
    marginBottom: 3,
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