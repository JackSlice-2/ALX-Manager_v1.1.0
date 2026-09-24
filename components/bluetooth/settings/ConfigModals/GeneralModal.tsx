import PostSender from '@/hooks/PostSender';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Switch, TextInput, View } from 'react-native';
import ModalContainer from '@/components/utils/modalParts/ModalContainer';
import SaveButton from '@/components/utils/modalParts/SaveButton';
import RobotoText from '@/components/RobotoText';
import { MqttConfigData, MQTTData } from '@/components/utils/types';
import LoaderOverlay from '@/components/LoaderOverlay';
import { useT } from '@/hooks/useT';

interface GeneralModalProps {
  onClose: () => void
  mqttData: MQTTData
  mqttConfigData: MqttConfigData
}

const GeneralModal: React.FC<GeneralModalProps> = ({
  onClose,
  mqttData,
  mqttConfigData
}) => {
  const [isMQTTEnabled, setIsMQTTEnabled] = useState(true);
  const [isRetentiveEnabled, setIsRetentiveEnabled] = useState(0);

  const [activationTime, setActivationTime] = useState('');
  const [inactivityTime, setInactivityTime] = useState('');

  const [postPayload, setPostPayload] = useState<any>(null);

  const t = useT();

  useEffect(() => {
    // Everything is mocked for now.
    setIsMQTTEnabled(true);
    setIsRetentiveEnabled(0);

    setActivationTime('');
    setInactivityTime('');
  }, []);

  const handleToggleChange = (value: boolean) => {
    setIsMQTTEnabled(value);
  };

  const handleRetainToggleChange = (value: boolean) => {
    setIsRetentiveEnabled(value ? 1 : 0);
  };

  const handleSave = () => {
    Alert.alert(
      "Confirmar Salvar",
      "Você tem certeza de que quer salvar as alterações?",
      [
        { text: "Não", style: "cancel" },
        {
          text: "Sim",
          onPress: () => {
            // Mocked for now.
            // The values are available here:
            // isMQTTEnabled
            // isRetentiveEnabled
            // activationTime
            // inactivityTime
          }
        }
      ],
      { cancelable: false }
    );
  };

  return (
    <>
      <ModalContainer
        visible
        onClose={onClose}
        title={t.SettingsOptions.General}
        image={require('@/assets/images/gears.png')}
        data={mqttData || mqttConfigData}
      >
        {postPayload &&
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999
            }}
          >
            <LoaderOverlay visible={postPayload} />
          </View>
        }

        {/* MQTT Enabled Toggle */}
        <View style={styles.toggleItem}>
          <View style={styles.toggleRow}>
            <Switch
              thumbColor={
                isMQTTEnabled
                  ? 'rgba(163, 188, 216, 0.6)'
                  : 'rgba(200, 200, 200, 0.5)'
              }
              trackColor={{
                false: 'rgba(200, 200, 200, 0.5)',
                true: 'rgba(32, 62, 107, 0.66)'
              }}
              value={isMQTTEnabled}
              onValueChange={handleToggleChange}
              style={{
                transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }],
                width: 50,
                height: 30
              }}
            />

            <RobotoText>
              Habilitar BLE na energização
            </RobotoText>
          </View>
        </View>

        {/* Retain Toggle */}
        <View style={styles.toggleItem}>
          <View style={styles.toggleRow}>
            <Switch
              thumbColor={
                isRetentiveEnabled
                  ? 'rgba(163, 188, 216, 0.6)'
                  : 'rgba(200, 200, 200, 0.5)'
              }
              trackColor={{
                false: 'rgba(200, 200, 200, 0.5)',
                true: 'rgba(32, 62, 107, 0.66)'
              }}
              value={isRetentiveEnabled === 1}
              onValueChange={handleRetainToggleChange}
              style={{
                transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }],
                width: 50,
                height: 30
              }}
            />

            <RobotoText>
              Habilitar &quot;switch&quot; magnético
            </RobotoText>
          </View>
        </View>

        {/* BLE Inputs */}
        <View style={styles.inputGroup}>
          {[
            {
              label: 'Tempo de ativação do BLE na energização [seg]',
              value: activationTime,
              setter: setActivationTime
            },
            {
              label: 'Tempo de desligamento do BLE por inatividade [seg]',
              value: inactivityTime,
              setter: setInactivityTime
            }
          ].map((input, idx) => (
            <View key={idx} style={styles.inputGroup}>
              <RobotoText style={styles.inputLabel}>
                {input.label}
              </RobotoText>

              <TextInput
                style={[styles.input, styles.flexGrow]}
                value={input.value}
                onChangeText={input.setter}
                placeholderTextColor="#cbd5e0"
              />
            </View>
          ))}
        </View>

        <SaveButton
          isSaveDisabled={false}
          onPress={handleSave}
        />
      </ModalContainer>
    </>
  );
};

export default GeneralModal;

const styles = StyleSheet.create({
  scrollViewContent: {
    paddingBottom: 20,
    flexGrow: 1,
  },

  modalContainer: {
    maxHeight: '90%',
    backgroundColor: '#f7f7f7ff',
    padding: 24,
    borderRadius: 16,
    width: '95%',
    alignItems: 'center',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },

  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  headerImage: {
    width: 70,
    height: 70,
    resizeMode: 'contain',
    marginRight: 8,
    marginBottom: 6,
  },

  inputGroup: {
    width: '100%',
    position: 'relative',
    backgroundColor: '#f7f7f7ff',
    borderRadius: 10,
    padding: 5,
    marginBottom: 20
  },

  singleInput: {
    width: '50%',
    position: 'relative',
    backgroundColor: '#f7f7f7ff',
    borderRadius: 10,
    padding: 5
  },

  closeButton: {
    position: 'absolute',
    top: 20,
    right: 15,
  },

  closeText: {
    fontSize: 20,
    marginTop: -10,
    color: '#000',
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
    top: 15,
  },

  saveButtonDisabled: {
    backgroundColor: '#bebdbd',
    justifyContent: 'center',
    width: '100%'
  },

  buttonText: {
    color: 'white',
    marginLeft: 6,
    fontWeight: 'bold',
  },

  errorText: {
    color: '#ff4d4d',
    marginTop: 8,
    marginBottom: 16,
    textAlign: 'center',
  },

  statusButton: {
    width: '100%',
    backgroundColor: '#9e9e9eff',
    borderRadius: 8,
  },

  statusButtonText: {
    color: 'black',
    marginLeft: 6,
    fontWeight: 'bold',
    padding: 12,
  },

  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    marginTop: 20,
  },

  backButton: {
    flexDirection: 'row',
    backgroundColor: '#007ACC',
    padding: 12,
    borderRadius: 8,
    marginRight: 'auto',
  },

  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#007ACC',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    width: '100%'
  },

  signalContainer: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 5,
  },

  signalBar: {
    width: 7,
    height: 20,
    borderRadius: 2,
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

  separatorLine: {
    height: 1,
    width: 50,
    backgroundColor: '#ccc',
    marginHorizontal: 10,
  },

  label: {
    color: '#666',
    marginBottom: 4,
  },
});