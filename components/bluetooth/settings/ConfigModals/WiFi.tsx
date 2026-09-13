import { NetworkItem, rssiToLevel } from '@/components/utils/types';
import PostSender from '@/hooks/PostSender';
import useDataloggerPost from '@/hooks/useDataloggerPost';
import { BASE_URL } from '@/utils/constants';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, TextInput, TouchableOpacity, View } from 'react-native';
import WifiManager from 'react-native-wifi-reborn';
import SignalBars from '@/components/dashboard/SignalBars';
import ModalContainer from '@/components/utils/modalParts/ModalContainer';
import SaveButton from '@/components/utils/modalParts/SaveButton';
import RobotoText from '@/components/RobotoText';
import LoaderOverlay from '@/components/LoaderOverlay';
import { WiFiProps } from './ConfigModalsInterface';
import { useT } from '@/hooks/useT';

const WiFi: React.FC<WiFiProps> = ({
  onClose,
  wifi,
  refreshWifi
}) => {

  const [showPassword, setShowPassword] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<string>('');
  const [password, setPassword] = useState('');
  const [isSaveDisabled, setIsSaveDisabled] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [availableNetworks, setAvailableNetworks] = useState<NetworkItem[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [shouldPost, setShouldPost] = useState(false);
  const [payloadToSend, setPayloadToSend] = useState<any>(null);
  const { loading: isPosting } = useDataloggerPost(BASE_URL);
  const t = useT()

  const [isWifiEnabled, setIsWifiEnabled] = useState(wifi.wifi_habilitado === t.System.Enabled ? true : false);

const isValidSSID = (ssid?: string) => {
  if (!ssid) return false;

  const clean = ssid.trim().toLowerCase();

  return (
    clean !== '' &&
    clean !== '<hidden>' &&
    clean !== 'hidden_ssid'
  );
};

const dedupeByStrongestSignal = (networks: any[]) => {
  const map = new Map<string, any>();

  networks.forEach(net => {
    if (!isValidSSID(net.SSID)) return;

    const existing = map.get(net.SSID);

    if (!existing || net.level > existing.level) {
      map.set(net.SSID, net);
    }
  });

  return Array.from(map.values());
};


  useEffect(() => {
    if (wifi.wifi_habilitado) {
      setIsWifiEnabled(wifi.wifi_habilitado === t.System.Enabled ? true : false);
    }
    if (!selectedNetwork && wifi.wifi_ssid) {
      setSelectedNetwork(wifi.wifi_ssid);
    }
  }, [wifi.wifi_habilitado, wifi.wifi_ssid, selectedNetwork, t]);

  const handleToggleChange = (value: boolean) => {
    setIsWifiEnabled(value);
  };

const scanForNetworks = async () => {
  setIsScanning(true);

  try {
    const rawNetworks = await WifiManager.loadWifiList();

    const uniqueNetworks = dedupeByStrongestSignal(rawNetworks);

    const formattedNetworks: NetworkItem[] = uniqueNetworks.map((network, index) => ({
      id: index,
      name: network.SSID,
      signalStrength: (
        <SignalBars level={rssiToLevel(network.level)} />
      ),
    }));

    setAvailableNetworks(formattedNetworks);
    setIsModalVisible(true);

  } catch (error) {
    console.error("Error scanning WiFi networks:", error);
    Alert.alert(
      "Erro ao Escanear",
      "Não foi possível escanear redes Wi-Fi."
    );
    setAvailableNetworks([]);
  } finally {
    setIsScanning(false);
  }
};


  const handleSearch = () => {
    scanForNetworks();
  };

  const handleNetworkSelect = (networkName: string) => {
    setSelectedNetwork(networkName);
    setPassword('');
    setIsModalVisible(false);
  };

      const handleSave = () => {
        // Show confirmation alert before saving
        Alert.alert(
          "Confirmar Salvar",
          "Você tem certeza de que quer salvar as alterações?",
          [
            {
              text: "Não",
               onPress: () => {},
              style: "cancel"
            },
            {
              text: "Sim",
              onPress: () => {handlePost()}
            }
          ],
          { cancelable: false }
        );
      };


  const handlePost = useCallback(() => {
    
    const isConfiguringNetwork = isWifiEnabled && selectedNetwork && password;

    if (isWifiEnabled && !isConfiguringNetwork) {
      Alert.alert("Atenção", "Para salvar, selecione uma rede WiFi e digite a senha. Caso queira apenas desabilitar, use o toggle.");
      return;
    }

    const payload = {
      "hab": isWifiEnabled,
      "ssid": selectedNetwork,
      "senha": password
    };

    // Store payload and trigger PostSender mount
    setPayloadToSend(payload);
    setShouldPost(true);

  }, [isWifiEnabled, selectedNetwork, password]);

  const handleSuccess = async () => {
    await refreshWifi();

  Alert.alert(
    "Sucesso",
    "Dados salvos corretamente no gateway"
  );
    setPassword('');
    setShouldPost(false);
    onClose();
  };

  const handleError = () => {
   Alert.alert(
    "Falha",
    "Não foi possível salvar os dados no gateway"
  );
    setShouldPost(false);
  };

  useEffect(() => {
    const isDisabled = isPosting || (!selectedNetwork || !password || password.length < 8);
    setIsSaveDisabled(isDisabled);
  }, [selectedNetwork, password, isPosting]);

  return (
    <>    
      {/* Hidden Post Trigger */}
      {shouldPost && (
        <PostSender
          endpoint="/req_config_wifi"
          payload={payloadToSend}
          onSuccess={handleSuccess}
          onError={handleError}
          baseUrl={BASE_URL}
        />
      )}

      <ModalContainer
        visible
        onClose={onClose}
        image={require('@/assets/images/wifi.png')}
        title={t.SettingsOptions.WiFi}
        data={wifi}
      >
        {shouldPost &&
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }}>
          <LoaderOverlay visible={shouldPost} />
        </View>
        }
        <View style={styles.inputGroup}>
          <RobotoText style={styles.label}>{t.WiFiSettings.text0}</RobotoText>
          <RobotoText style={styles.sectionText}>{wifi.wifi_status || '---'}</RobotoText>
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.toggleItem}>
            <View style={styles.toggleRow}>
              <Switch
                thumbColor={isWifiEnabled ? 'rgba(163, 188, 216, 0.6)' : 'rgba(200, 200, 200, 0.5)'}
                trackColor={{ false: 'rgba(200, 200, 200, 0.5)', true: 'rgba(32, 62, 107, 0.66)' }}
                value={isWifiEnabled}
                onValueChange={handleToggleChange}
                style={{
                  transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }],
                  width: 50,
                  height: 30,
                }}
              />
              <RobotoText>{isWifiEnabled ? t.System.Enabled : t.System.Disabled}</RobotoText>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <RobotoText style={styles.inputLabel}>{t.WiFiSettings.text1}</RobotoText>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput
                style={[styles.input, styles.flexGrow]}
                value={selectedNetwork}
                onChangeText={setSelectedNetwork}
                placeholderTextColor="#cbd5e0"
                editable={true}
              />
              <TouchableOpacity
                onPress={handleSearch}
                style={styles.togglePassword}
              >
                <Ionicons name={'search'} size={24} color="#007ACC" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <RobotoText style={styles.inputLabel}>{t.System.Password}</RobotoText>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput
                style={[styles.input, styles.flexGrow]}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#cbd5e0"
                editable={true}
              />
              <TouchableOpacity
                onPress={() => setShowPassword((prev) => !prev)}
                style={styles.togglePassword}
              >
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={24}
                  color="#007ACC"
                />
              </TouchableOpacity>
            </View>
          </View>

          <SaveButton
            isSaveDisabled={isSaveDisabled}
            onPress={handleSave}
            text={isPosting ? t.System.Saving : t.System.Save}
          />
        </View>

      </ModalContainer>

      {/* WiFi Picker Modal */}
      <ModalContainer visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        image={require('@/assets/images/wifi.png')}
        title={t.WiFiSettings.text2}
        data={availableNetworks}
      >
        <View style={styles.WifiSelectModal}>
          <ScrollView showsVerticalScrollIndicator stickyHeaderHiddenOnScroll >
          {availableNetworks.map((network) => (
            <TouchableOpacity
              key={network.id}
              style={styles.networkItem}
              onPress={() => handleNetworkSelect(network.name)}
            >
              <RobotoText style={styles.networkName}>{network.name}</RobotoText>
              {network.signalStrength}
            </TouchableOpacity>
          ))}
          {availableNetworks.length === 0 && !isScanning && (
            <RobotoText style={{ color: '#666', marginTop: 10 }}>{t.WiFiSettings.text3}</RobotoText>
          )}

          {isScanning && (
            <RobotoText style={{ color: '#007ACC', marginTop: 10 }}>{t.WiFiSettings.text4}</RobotoText>
          )}
</ScrollView>

        </View>

        <TouchableOpacity
          onPress={() => setIsModalVisible(false)}
          style={[styles.saveButton, { marginTop: 20 }]}
        >
          <RobotoText style={styles.buttonText}>{t.System.Close}Fechar</RobotoText>
        </TouchableOpacity>

      </ModalContainer>
    </>

  );
};

export default WiFi;

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  inputGroup: {
    width: '100%',
    position: 'relative',
    backgroundColor: '#f7f7f7ff',
    borderRadius: 10,
    padding: 5,
    marginBottom: 20
  },
  status: {
    marginBottom: 5,
    marginLeft: 'auto',
    fontWeight: 500,
    backgroundColor: '#d4d4d4ff',
    padding: 7,
    borderRadius: 8,

  },
  inputLabel: {
    color: '#333',
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f0f0f0',
    padding: 14,
    borderRadius: 8,
    color: '#333',
    minHeight: 50,
    borderWidth: 0,
    fontSize: 16,
  },
  togglePassword: {
    padding: 5,
    alignSelf: 'center',
  },
  buttonText: {
    color: 'white',
    marginLeft: 6,
    fontWeight: 'bold',
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#007ACC',
    padding: 12,
    borderRadius: 10,
    justifyContent: 'center',
    width: '100%'
  },
  flexGrow: {
    flex: 1,
  },
  networkItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    width: '100%',
  },
  networkName: {
    fontSize: 16,
    color: '#333',
  },
  section: {
    marginBottom: 24,
  },
  WifiSelectModal: {
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '100%'
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    width: '100%'
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  sectionText: {
    fontSize: 18,
    fontWeight: 'semibold',
  },
  toggleItem: {
    width: '100%',
    padding: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  label: {
    color: '#666',
    marginBottom: 4,
  },
});