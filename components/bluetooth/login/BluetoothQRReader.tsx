import { MaterialIcons } from '@expo/vector-icons';
import {
  BarcodeScanningResult,
  CameraView,
  useCameraPermissions,
} from 'expo-camera';
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  Vibration,
  View,
  Modal,
} from 'react-native';
import RobotoText from '@/components/RobotoText';
import { useT } from '@/hooks/useT';

type BluetoothDeviceData = {
  name: string;
  address: string;
  password: string;
};

type BluetoothQRReaderProps = {
  onScan: (data: string) => void;
  onClose: () => void;
};

const BLE_DEVICE: BluetoothDeviceData = {
  name: 'ALX-5DLG',
  address: 'F8:24:0E:B1:0A:F2',
  password: '123456',
};

const BluetoothQRReader: React.FC<BluetoothQRReaderProps> = ({
  onScan,
  onClose,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [tempData, setTempData] = useState<string | null>(null);

  const t = useT();

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  const handleBarCodeScanned = (result: BarcodeScanningResult) => {
    if (!scanned) {
      setScanned(true);
      Vibration.vibrate(100);

      console.log('[BluetoothQRReader] QR scanned:', result.data);

      setTempData(result.data);
    }
  };

  const handleConfirm = () => {
    if (tempData) {
      const bluetoothData = JSON.stringify(BLE_DEVICE);

      console.log('[BluetoothQRReader] Connecting to BLE device:');
      console.log('[BluetoothQRReader] Name:', BLE_DEVICE.name);
      console.log('[BluetoothQRReader] Address:', BLE_DEVICE.address);
      console.log('[BluetoothQRReader] PIN:', BLE_DEVICE.password);

      onScan(bluetoothData);

      setTempData(null);
      setScanned(false);
    }
  };

  const handleCancel = () => {
    setScanned(false);
    setTempData(null);
  };

  if (!permission) {
    return null;
  }

  if (!permission.granted) {
    return (
      <View>
        <RobotoText style={styles.deniedText}>
          {t.QRReader.text0}
        </RobotoText>

        <TouchableOpacity
          onPress={requestPermission}
          style={styles.permissionButton}
        >
          <RobotoText style={styles.buttonText}>
            {t.QRReader.text1}
          </RobotoText>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onClose}
          style={[styles.permissionButton, styles.cancelButton]}
        >
          <RobotoText style={styles.buttonText}>
            {t.System.Cancel}
          </RobotoText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <View style={StyleSheet.absoluteFill}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        />

        <TouchableOpacity
          onPress={onClose}
          style={styles.closeButton}
        >
          <MaterialIcons
            name="close"
            size={40}
            color="white"
          />
        </TouchableOpacity>

        <View style={styles.overlay}>
          <View style={styles.borderBox} />

          <RobotoText style={styles.scanText}>
            {t.QRReader.text2}
          </RobotoText>
        </View>
      </View>

      <Modal
        visible={!!tempData}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <RobotoText style={styles.modalTitle}>
              {t.QRReader.text3}
            </RobotoText>

            <View style={styles.qrContentBox}>
              <RobotoText style={styles.qrLabel}>
                DISPOSITIVO
              </RobotoText>

              <RobotoText style={styles.qrDataText}>
                {BLE_DEVICE.name}
              </RobotoText>

              <View style={styles.separator} />

              <RobotoText style={styles.qrLabel}>
                ENDEREÇO BLE
              </RobotoText>

              <RobotoText style={styles.qrDataText}>
                {BLE_DEVICE.address}
              </RobotoText>

              <View style={styles.separator} />

              <RobotoText style={styles.qrLabel}>
                PIN
              </RobotoText>

              <RobotoText style={styles.qrDataText}>
                {BLE_DEVICE.password}
              </RobotoText>
            </View>

            <RobotoText style={styles.confirmQuestion}>
              {t.QRReader.text4}
            </RobotoText>

            <TouchableOpacity
              style={styles.connectBtn}
              onPress={handleConfirm}
            >
              <RobotoText style={styles.connectBtnText}>
                {t.QRReader.text5}
              </RobotoText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.noConnectBtn}
              onPress={handleCancel}
            >
              <RobotoText style={styles.noConnectText}>
                {t.QRReader.text6}
              </RobotoText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default BluetoothQRReader;

const styles = StyleSheet.create({
  deniedText: {
    color: '#ffffff',
    fontSize: 18,
    marginBottom: 16,
  },

  permissionButton: {
    backgroundColor: '#1e40af',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },

  cancelButton: {
    marginTop: 8,
    backgroundColor: '#dc2626',
  },

  buttonText: {
    color: '#ffffff',
  },

  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: '#00000080',
    padding: 10,
    borderRadius: 50,
    zIndex: 10,
  },

  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  borderBox: {
    width: 260,
    height: 260,
    borderWidth: 4,
    borderColor: '#00FFFF',
    borderRadius: 20,
  },

  scanText: {
    color: '#ffffff',
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContainer: {
    width: '85%',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    elevation: 5,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },

  qrContentBox: {
    backgroundColor: '#f3f4f6',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  qrLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
    textTransform: 'uppercase',
  },

  qrDataText: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },

  separator: {
    height: 12,
  },

  confirmQuestion: {
    fontSize: 16,
    color: '#4b5563',
    textAlign: 'center',
    marginBottom: 25,
  },

  connectBtn: {
    backgroundColor: '#1e40af',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },

  connectBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },

  noConnectBtn: {
    marginTop: 20,
    alignSelf: 'flex-end',
    padding: 5,
  },

  noConnectText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '600',
  },
});