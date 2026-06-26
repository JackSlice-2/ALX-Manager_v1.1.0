import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet } from 'react-native';
import RobotoText from '../RobotoText';
import { NetworkType } from '@/hooks/wifiHelpers';
import { Ionicons } from '@expo/vector-icons';
import { useT } from '@/hooks/useT';

type Props = {
  visible: boolean;
  networks: NetworkType[];
  onClose: () => void;
  onSubmit: (data: string) => void;
};

const ManualConnectModal: React.FC<Props> = ({
  visible,
  networks,
  onClose,
  onSubmit
}) => {
  const [selectedSSID, setSelectedSSID] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSaveDisabled, setIsSaveDisabled] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false)

  const alxNetworks = networks.filter(n => n.ssid.startsWith('ALX_4GS'));

  const t = useT();

  const handleSelect = (ssid: string) => {
    if (selectedSSID === ssid) {
      setSelectedSSID(null);
      setPassword('');
    } else {
      setSelectedSSID(ssid);
      setPassword('');
    }
  };

  const handleConnect = () => {
    if (!selectedSSID || !password) return;
    setIsConnecting(true)

    const fakeQR = JSON.stringify({
      ssid: selectedSSID,
      password,
      hidden: false
    });

    onSubmit(fakeQR);
    setSelectedSSID(null);
    setPassword('');
    setIsConnecting(false)
  };

  useEffect(() => {
    const isDisabled = !selectedSSID || !password || password.length < 8;
    setIsSaveDisabled(isDisabled);
  }, [selectedSSID, password]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>
            {t.PasswordModal.text0}
          </Text>

          <ScrollView style={styles.list}>
            {alxNetworks.map((net, i) => {
              const isSelected = selectedSSID === net.ssid;

              return (
                <View key={i} style={styles.networkBlock}>
                  <TouchableOpacity
                    style={[
                      styles.networkItem,
                      isSelected && styles.selected
                    ]}
                    onPress={() => handleSelect(net.ssid)}
                  >
                    <Text style={styles.ssidText}>{net.ssid}</Text>
                  </TouchableOpacity>
        {isSelected && (
          <View style={styles.expanded}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TextInput
                placeholder={t.WiFiModal.text0}
                placeholderTextColor={'#5c5c5cff'}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                autoFocus
              />
              <TouchableOpacity
                onPress={() => setShowPassword((prev) => !prev)}
                style={styles.trailing}
              >
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color="#007ACC"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
        style={[styles.connectBtn, isSaveDisabled && styles.saveButtonDisabled]}
              onPress={handleConnect}
              disabled={isSaveDisabled}
            >
              <RobotoText style={{ color: '#fff' }}>
                {isConnecting ? t.System.Connecting : t.System.Connect}
              </RobotoText>
            </TouchableOpacity>

          </View>
        )}
                </View>
              );
            })}
          </ScrollView>
            <TouchableOpacity
            onPress={() => {
                setSelectedSSID(null);
                setPassword('');
                onClose();
            }}
            style={styles.cancelBtn}
            >
                <RobotoText style={{ color: 'red' }}>
              {t.System.Cancel}
            </RobotoText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default ManualConnectModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#00000080',
    justifyContent: 'center',
    alignItems: 'center'
  },
  container: {
    width: '85%',
    maxHeight: '70%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10
  },
  list: {
    marginBottom: 10
  },

  networkBlock: {
    marginBottom: 8
  },

  networkItem: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#f3f4f6'
  },

  selected: {
    backgroundColor: '#dbeafe'
  },

  ssidText: {
    fontSize: 15,
    fontWeight: '500'
  },

  expanded: {
    marginTop: 8,
    padding: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 10
  },

  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    color: 'black',
    width: '100%'
  },

  connectBtn: {
    backgroundColor: '#1e40af',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center'
  },

  cancelBtn: {
    marginTop: 10,
    alignItems: 'flex-end'
  },
    trailing: {
    marginLeft: '-10%',
    marginBottom: 7
  },
    saveButtonDisabled: {
    backgroundColor: '#c3d3ddff',
    justifyContent: 'center',
    width: '100%'
  },
});