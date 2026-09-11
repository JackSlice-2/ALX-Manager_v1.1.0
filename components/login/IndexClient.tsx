import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import WifiManager from 'react-native-wifi-reborn';
import { openLocationSettings, openWifiSettings } from '@/utils/constants';
import LoaderOverlay from '@/components/LoaderOverlay';
import PermissionModal from '@/components/utils/modalParts/PermisionModal';
import { ensureLocationPermission, isSystemLocationEnabled } from '@/hooks/wifiHelpers';
import QRReader from './QRReader';
import RobotoText from '../RobotoText';
import IndexAnimation from '@/components/login/IndexAnimation';
import ManualConnectModal from '@/components/login/ManualConnectModal';
import LanguageToggle from '@/components/login/LanguageToggle';
import NativeWifiModal from './NativeWifiModal';
import { router } from 'expo-router';

interface IndexClientProps {
    setShowQRScanner: any
    scanning: any
    isConnecting: any
    showQRScanner: any
    errorMessage: any
    handleQRScan: any
    refreshPage: any
    locationDisabled: any
    networks: any
    wifiDisabled: any
    isModalVisible: any
    availableGateways: any
    handleConnect: any
    setIsModalVisible: any
    setWifiDisabled: any
    setLocationDisabled: any
    setErrorMessage: any
    openNetworkModal: () => void
}

const IndexClient: React.FC<IndexClientProps> = ({
    setShowQRScanner,
    scanning,
    isConnecting,
    showQRScanner,
    errorMessage,
    handleQRScan,
    refreshPage,
    locationDisabled,
    networks,
    wifiDisabled,
    isModalVisible,
    availableGateways,
    handleConnect,
    setIsModalVisible,
    setWifiDisabled,
    setLocationDisabled,
    setErrorMessage,
    openNetworkModal
}) => {
    const [showManualModal, setShowManualModal] = useState(false);
    
    const openQRScanner = async () => {
        setWifiDisabled(false);
        setLocationDisabled(false);
        setErrorMessage('');

        if (!await ensureLocationPermission()) { setLocationDisabled(true); return; }
        if (!await isSystemLocationEnabled()) { setLocationDisabled(true); return; }
        if (!(await WifiManager.isEnabled())) { setWifiDisabled(true); return; }

        setShowQRScanner(true);
    };

    return (
        <>
        {!showQRScanner &&
        <View>
             <View style={{position: 'absolute', top: 40, right: 20, zIndex: 10,}}>
                <LanguageToggle
                    onChange={(lang) => {
                    console.log('Language changed to:', lang);
                    }}
                />
            </View>
             <View style={{ position: 'absolute', top: 50, left: 20, zIndex: 10 }}>
  <TouchableOpacity
    onPress={() => router.back()}
    style={{
      width: 45,
      height: 45,
      justifyContent: 'center',
      alignItems: 'center',
    }}
  >
    <Text style={{ fontSize: 32 }}>‹--</Text>
  </TouchableOpacity>
</View>
        </View>
        }
            <View style={styles.container}>
                <IndexAnimation
                    openNetworkModal={openNetworkModal}
                    openQRScanner={openQRScanner}
                    openManualConnect={() => setShowManualModal(true)}
                />
            {(scanning || isConnecting) && (
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: "#00000060" }}>
                    <LoaderOverlay  
                        visible={scanning || isConnecting} 
                        message={isConnecting ? 'Conectando ao Gateway...' : 'Escaneando redes...'} 
                    />
                </View>
            )}
            {showQRScanner && (
                <>
                    <QRReader onScan={handleQRScan} onClose={() => setShowQRScanner(false)} />
                    {errorMessage && (
                        <View style={styles.errorMessageContainer}>
                            <RobotoText style={styles.errorMessage}>
                                {errorMessage}
                            </RobotoText>
                        </View>
                    )}
                </>
            )}
            <ManualConnectModal
                visible={showManualModal}
                networks={networks}
                onClose={() => setShowManualModal(false)}
                onSubmit={(data) => {
                setShowManualModal(false);
                handleQRScan(data);
                }}
            />
            <PermissionModal
                visible={wifiDisabled}
                icon={require('../../assets/images/wifi.png')}
                title="Wi-Fi desativado"
                message="Ative o Wi-Fi para continuar."
                onOpenSettings={openWifiSettings}
                onRefresh={refreshPage}
            />
            <PermissionModal
                visible={locationDisabled}
                icon={require('../../assets/images/GPS.png')}
                title="Localização desativada"
                message="Habilite a Localização para escanear redes Wi-Fi."
                onOpenSettings={openLocationSettings}
                onRefresh={refreshPage}
            />
            <NativeWifiModal 
                isModalVisible={isModalVisible}
                availableGateways={availableGateways}
                handleConnect={handleConnect}
                setIsModalVisible={setIsModalVisible}
                showQRScanner={showQRScanner}
                isConnecting={isConnecting}
            />
        </View>
    </>
    )
  }

export default IndexClient

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
  }
});