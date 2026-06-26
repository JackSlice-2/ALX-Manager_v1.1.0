import React from 'react';
import { Image, Linking, Modal, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import RobotoText from '../RobotoText';

interface PermissionModalProps {
    locationDisabled: boolean;
    wifiDisabled: boolean;
    refreshPage: () => void;
}

const PermissionModal: React.FC<PermissionModalProps> = ({
    locationDisabled,
    wifiDisabled,
    refreshPage
}) => {

      const openLocationSettings = () => {
        if (Platform.OS === 'android') {
          if ((Linking as any).sendIntent) (Linking as any).sendIntent('android.settings.LOCATION_SOURCE_SETTINGS');
          else Linking.openSettings();
        } else {
          Linking.openSettings();
        }
      };

        const openWifiSettings = () => {
          if (Platform.OS === 'android') {
            if ((Linking as any).sendIntent) (Linking as any).sendIntent('android.settings.WIFI_SETTINGS');
            else Linking.openSettings();
          } else {
            Linking.openSettings();
          }
        };
    
  return (
    <>
    {   locationDisabled &&
        <Modal visible={locationDisabled} transparent animationType="fade">
            <View style={styles.modalOverlay}>
              <View style={styles.modalBox}>
                <Image source={require('../../assets/images/GPS.png')} style={{ width: 70, height: 70, marginBottom: 12 }} />
                <RobotoText style={styles.modalTitle}>Localização desativada</RobotoText>
                <RobotoText style={styles.modalText}>Habilite a Localização para escanear redes Wi-Fi.</RobotoText>
    
                <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#ccc' }]} onPress={openLocationSettings}>
                  <RobotoText style={[styles.modalButtonText, { color: '#000' }]}>Abrir Configurações</RobotoText>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#ccc' }]} onPress={refreshPage}>
                  <RobotoText style={[styles.modalButtonText, { color: '#000' }]}>Já Ativei</RobotoText>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
    }
    {    wifiDisabled &&
     <Modal visible={wifiDisabled} transparent animationType="fade">
            <View style={styles.modalOverlay}>
              <View style={styles.modalBox}>
                <Image source={require('../../assets/images/wifi.png')} style={{ width: 70, height: 70, marginBottom: 12 }} />
                <RobotoText style={styles.modalTitle}>Wi-Fi desativado</RobotoText>
                <RobotoText style={styles.modalText}>Ative o Wi-Fi para continuar.</RobotoText>
    
                <TouchableOpacity style={styles.modalButton} onPress={openWifiSettings}>
                  <RobotoText style={styles.modalButtonText}>Abrir Configurações</RobotoText>
                </TouchableOpacity>
    
                <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#ccc' }]} onPress={refreshPage}>
                  <RobotoText style={[styles.modalButtonText, { color: '#000' }]}>Já Ativei</RobotoText>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
  }
  </>
  )
}

export default PermissionModal

const styles = StyleSheet.create({
     container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: 'rgb(250, 251, 252)',
  },
  buttonRow: { flexDirection: 'row' },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 9999,
    marginHorizontal: 8,
  },
  buttonText: {
    fontWeight: 'semibold',
    width: 128,
    textAlign: 'center',
    color: '#000',
    fontSize: 18,
    letterSpacing: 0.5,
  },
  errorMessageContainer: {
    marginTop: 20,
    backgroundColor: '#FF6B6B',
    padding: 10,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
  },
  errorMessage: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalText: {
    textAlign: 'center',
    color: '#333',
    marginBottom: 20,
    maxWidth: '100%',
  },
  modalButton: {
    backgroundColor: '#007bff',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
});
