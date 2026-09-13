import PostSender from '@/hooks/PostSender';
import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Switch, TextInput, View } from 'react-native';
import ModalContainer from '@/components/utils/modalParts/ModalContainer';
import SaveButton from '@/components/utils/modalParts/SaveButton';
import RobotoText from '@/components/RobotoText';
import { MqttConfigData, MQTTData } from '@/components/utils/types';
import LoaderOverlay from '@/components/LoaderOverlay';
import { useT } from '@/hooks/useT';

interface MQTTProps {
  onClose: () => void
  mqttData: MQTTData
  mqttConfigData: MqttConfigData
}

const MQTT: React.FC<MQTTProps> = ({
  onClose,
  mqttData,
  mqttConfigData
}) => {
  const [isMQTTEnabled, setIsMQTTEnabled] = useState(mqttData.mqtt_hab === 'Habilitado' ? true : false);
  const [isRetentiveEnabled, setIsRetentiveEnabled] = useState(0);
  const [isSaveDisabled, setIsSaveDisabled] = useState(true);

  const [isHost, setIsHost] = useState('');
  const [isDoor, setIsDoor] = useState('');
  const [isUser, setIsUser] = useState('');
  const [isPassword, setIsPassword] = useState('');
  const [isPubTopic, setIsPubTopic] = useState('');
  const [isSubsTopic, setIsSubsTopic] = useState('');
  const [isQOS, setIsQOS] = useState('');

  const [postPayload, setPostPayload] = useState<any>(null);
  const [postEndpoint, setPostEndpoint] = useState('');

const initialized = React.useRef(false);

useEffect(() => {
  if (!mqttConfigData || initialized.current) return;

  setIsMQTTEnabled(!!mqttConfigData.hab_mqtt);
  setIsHost(mqttConfigData.host_mqtt ?? '');
  setIsDoor(mqttConfigData.porta_mqtt?.toString() ?? '');
  setIsUser(mqttConfigData.usuario_mqtt ?? '');
  setIsPassword(mqttConfigData.senha_mqtt ?? '');
  setIsPubTopic(mqttConfigData.topico_pub ?? '');
  setIsSubsTopic(mqttConfigData.topico_sub ?? '');
  setIsRetentiveEnabled(mqttConfigData.retain ?? 0);
  setIsQOS(mqttConfigData.qos?.toString() ?? '');

  initialized.current = true;
}, [mqttConfigData]);


useEffect(() => {
  if (!isMQTTEnabled) {
    setIsSaveDisabled(false);
    return;
  }

  const requiredFilled =
    isHost.trim() !== '' &&
    isDoor.trim() !== '' &&
    isUser.trim() !== '' &&
    isPassword.trim() !== '' &&
    isPubTopic.trim() !== '' &&
    isSubsTopic.trim() !== '' &&
    isQOS.trim() !== '';

  setIsSaveDisabled(!requiredFilled);
}, [
  isMQTTEnabled,
  isHost,
  isDoor,
  isUser,
  isPassword,
  isPubTopic,
  isSubsTopic,
  isQOS,
]);


  const handleToggleChange = (value: boolean) => setIsMQTTEnabled(value);
  const handleRetainToggleChange = (value: boolean) => {
    // Convert boolean (true/false) back to number (1/0) for the state
    setIsRetentiveEnabled(value ? 1 : 0);
};

const t = useT()

const handleSave = () => {
  Alert.alert(
    "Confirmar Salvar",
    "Você tem certeza de que quer salvar as alterações?",
    [
      { text: "Não", style: "cancel" },
      {
        text: "Sim",
        onPress: () => {
          handlePost();
        }
      }
    ],
    { cancelable: false }
  );
};


  const handlePost = () => {
    const payload = {
      mqt_hab: isMQTTEnabled,
      mqt_host: isHost,
      mqt_port: Number(isDoor),
      mqt_user: isUser,
      mqt_senha: isPassword,
      mqt_pub: isPubTopic,
      mqt_sub: isSubsTopic,
      qos: Number(isQOS),
      retain: isRetentiveEnabled,
    };

    setPostPayload(payload);
    setPostEndpoint('/req_config_mqtt');
  };

  return (
    <>
      <ModalContainer
        visible
        onClose={onClose}
        title={t.SettingsOptions.MQTT}
        image={require('@/assets/images/Cloud.png')}
        data={mqttData || mqttConfigData}
      >
          {postPayload &&
                          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }}>
                          <LoaderOverlay visible={postPayload} />
                        </View>
                        }
        <View style={styles.inputGroup}>
          <RobotoText style={styles.label}>{t.MQTTSettings.text0}</RobotoText>
          <RobotoText style={styles.sectionText}>{mqttData.mqtt_stat || '---'}</RobotoText>
        </View>

        {/* MQTT Enabled Toggle */}
        <View style={styles.toggleItem}>
          <View style={styles.toggleRow}>
            <Switch
              thumbColor={isMQTTEnabled ? 'rgba(163, 188, 216, 0.6)' : 'rgba(200, 200, 200, 0.5)'}
              trackColor={{ false: 'rgba(200, 200, 200, 0.5)', true: 'rgba(32, 62, 107, 0.66)' }}
              value={isMQTTEnabled}
              onValueChange={handleToggleChange}
              style={{ transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }], width: 50, height: 30 }}
            />
<RobotoText>
  {isMQTTEnabled ? t.System.Enabled : t.System.Disabled}
</RobotoText>
          </View>
        </View>

        {/* MQTT Inputs */}
        <View style={styles.inputGroup}>

        {[
          { label: t.MQTTSettings.text1, value: isHost, setter: setIsHost },
          { label: t.MQTTSettings.text2, value: isDoor, setter: setIsDoor },
          { label: t.MQTTSettings.text3, value: isUser, setter: setIsUser },
          { label: t.MQTTSettings.text4, value: isPassword, setter: setIsPassword },
          { label: t.MQTTSettings.text5, value: isPubTopic, setter: setIsPubTopic },
          { label: t.MQTTSettings.text6, value: isSubsTopic, setter: setIsSubsTopic },
        ].map((input, idx) => (
          <View key={idx} style={styles.inputGroup}>
            <RobotoText style={styles.inputLabel}>{input.label}</RobotoText>
            <TextInput
              style={[styles.input, styles.flexGrow]}
              value={input.value}
              onChangeText={input.setter}
              placeholderTextColor="#cbd5e0"
            />
          </View>
        ))}
          </View>


        {/* QOS Picker */}

        <View style={styles.inputGroup}>
          <Picker
            selectedValue={isQOS}
            onValueChange={(v) => setIsQOS(v)}
            style={[styles.input, styles.flexGrow, { color: '#333', padding: 0 }]}
            dropdownIconColor="#333"
          >
            <Picker.Item label="0" value="0" />
            <Picker.Item label="1" value="1" />
            <Picker.Item label="2" value="2" />
          </Picker>
        </View>

        {/* Retain Toggle */}
        <View style={styles.toggleItem}>
          <View style={styles.toggleRow}>
            <Switch
              thumbColor={isRetentiveEnabled ? 'rgba(163, 188, 216, 0.6)' : 'rgba(200, 200, 200, 0.5)'}
              trackColor={{ false: 'rgba(200, 200, 200, 0.5)', true: 'rgba(32, 62, 107, 0.66)' }}
              value={isRetentiveEnabled === 1 ? true : false}
              onValueChange={handleRetainToggleChange}
              style={{ transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }], width: 50, height: 30 }}
            />
            <RobotoText>{t.MQTTSettings.text8}</RobotoText>
          </View>
        </View>

        <SaveButton isSaveDisabled={isSaveDisabled} onPress={handleSave} />
      </ModalContainer>

      {/* PostSender triggered only when user clicks Save */}
      {postPayload && postEndpoint && (
        <PostSender
          endpoint={postEndpoint}
          payload={postPayload}
             onSuccess={() => {
                     Alert.alert(
                       "Sucesso",
                       "Dados salvos corretamente no gateway"
                     );
                     setPostPayload(null);
                     onClose()
                   }}
                   onError={(err) => {
                     Alert.alert(
                       "Falha",
                       "Nã foi possivel salvar os dados no gateway"
                     );
                     alert("Erro ao salvar!");
                     console.log(err);
                     setPostPayload(null);
                   }}
                 />
      )}
    </>
  );
};

export default MQTT

const styles = StyleSheet.create({
  

  scrollViewContent: {
    paddingBottom: 20, // Optional for spacing at the bottom
    flexGrow: 1, // Ensure scrollview takes up full height
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
    width: '100%',  // Ensure it takes up the full width of the modal container
    marginTop: 20,
  },
  backButton: {
    flexDirection: 'row',
    backgroundColor: '#007ACC',
    padding: 12,
    borderRadius: 8,
    marginRight: 'auto', // Push it to the left
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
  height: 1, // Thickness of the line
  width: 50, // Length of the line, adjust as needed
  backgroundColor: '#ccc', // Color of the line
  marginHorizontal: 10, // Space around the line
},

  label: {
    color: '#666',
    marginBottom: 4,
  },
});