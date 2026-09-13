import PostSender from '@/hooks/PostSender';
import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';
import ModalContainer from '@/components/utils/modalParts/ModalContainer';
import SaveButton from '@/components/utils/modalParts/SaveButton';
import RobotoText from '@/components/RobotoText';
import { SerialInfo } from '@/components/utils/types';
import LoaderOverlay from '@/components/LoaderOverlay';
import { useT } from '@/hooks/useT';

interface SerialProps {
  onClose: () => void;
  serialData: SerialInfo
}

const Serial: React.FC<SerialProps> = ({ onClose, serialData }) => {
    const DEFAULTS = {
  comunicationSpeed: serialData?.baud_rate_serial ? String(serialData.baud_rate_serial) : '9600',
  parity: serialData?.paridade ? String(serialData.paridade) : 'Nenhum',
  stopBits: serialData?.stop_bits_serial ? String(serialData.stop_bits_serial) : '1',
};

  const [comunicationSpeed, setComunicationSpeed] = useState(DEFAULTS.comunicationSpeed);
  const [parity, setParity] = useState(DEFAULTS.parity);
  const [stopBits, setStopBits] = useState(DEFAULTS.stopBits);
  const [intraFrames, setIntraFrames] = useState('');
  const [modbusAddress, setModbusAddress] = useState('');
  const [isSaveDisabled, setIsSaveDisabled] = useState(true);
  const [postPayload, setPostPayload] = useState<any>(null);
  const [postEndpoint, setPostEndpoint] = useState('');

  const t = useT()

const hasLoaded = React.useRef(false);

useEffect(() => {
  if (!serialData || hasLoaded.current) return;

  const info = serialData;

  setComunicationSpeed(String(info.baud_rate_serial));
  setParity(String(info.paridade));
  setStopBits(String(info.stop_bits_serial));
  setIntraFrames(String(info.inter_frames));
  setModbusAddress(String(info.endereco_modbus));

  hasLoaded.current = true;
}, [serialData]);

  useEffect(() => {
    const enabled =
      intraFrames.length > 0 &&
      modbusAddress.length > 0;

    setIsSaveDisabled(!enabled);
  }, [comunicationSpeed, parity, stopBits, intraFrames, modbusAddress]);

  const handleSave = () => {
    Alert.alert(
      "Confirmar Salvar",
      "Você tem certeza de que quer salvar as alterações?",
      [
        {
          text: "Não",
          onPress: () => {},
          style: "cancel",
        },
        {
          text: "Sim",
          onPress: () => {
            handlePost();
          },
        },
      ],
      { cancelable: false }
    );
  };

  const handlePost = () => {
    console.log('📌 Preparing POST payload for Serial config...');

    const payload = {
      ser_baud: Number(comunicationSpeed),
      ser_par: parity,
      ser_stop: Number(stopBits),
      mod_end: Number(modbusAddress),
      inter_frames: Number(intraFrames),
    };

    console.log('➡️ Sending to: /req_config_rs232rs485');
    console.log('📤 Payload:', payload);

    setPostPayload(payload);
    setPostEndpoint('/req_config_rs232rs485');
  };

  return (
    <>
      <ModalContainer
        visible
        onClose={onClose}
        title={t.SettingsOptions.Serial}
        image={require('@/assets/images/Serial.png')}
        data={serialData}
      >
          {postPayload &&
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }}>
            <LoaderOverlay visible={postPayload} />
          </View>
          }
        <View style={styles.inputGroup}>
          {/* Velocidade */}
          <View style={styles.inputGroup}>
            <RobotoText style={styles.inputLabel}>{t.SerialSettings.text0}</RobotoText>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Picker
                selectedValue={comunicationSpeed}
                onValueChange={setComunicationSpeed}
                style={[styles.input, styles.flexGrow, { color: '#333', padding: 0 }]}
                dropdownIconColor="#333"
              >
                <Picker.Item label="1200" value="1200" />
                <Picker.Item label="4800" value="4800" />
                <Picker.Item label="9600" value="9600" />
                <Picker.Item label="19200" value="19200" />
                <Picker.Item label="38400" value="38400" />
                <Picker.Item label="57600" value="57600" />
                <Picker.Item label="115200" value="115200" />
              </Picker>
            </View>
          </View>

          {/* Paridade */}
          <View style={styles.inputGroup}>
            <RobotoText style={styles.inputLabel}>{t.SerialSettings.text1}</RobotoText>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Picker
                selectedValue={parity}
                onValueChange={setParity}
                style={[styles.input, styles.flexGrow, { color: '#333', padding: 0 }]}
                dropdownIconColor="#333"
              >
                <Picker.Item label={t.SerialSettings.text2} value="Impar" />
                <Picker.Item label={t.SerialSettings.text3} value="Nenhum" />
                <Picker.Item label={t.SerialSettings.text4} value="Par" />
              </Picker>
            </View>
          </View>

          {/* Stop Bits */}
          <View style={styles.inputGroup}>
            <RobotoText style={styles.inputLabel}>{t.SerialSettings.text5}</RobotoText>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Picker
                selectedValue={stopBits}
                onValueChange={setStopBits}
                style={[styles.input, styles.flexGrow, { color: '#333', padding: 0 }]}
                dropdownIconColor="#333"
              >
                <Picker.Item label="1" value="1" />
                <Picker.Item label="1.5" value="1.5" />
                <Picker.Item label="2" value="2" />
              </Picker>
            </View>
          </View>

          {/* Intra-frames */}
          <View style={styles.inputGroup}>
            <RobotoText style={styles.inputLabel}>{t.SerialSettings.text6}</RobotoText>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput
                style={[styles.input, styles.flexGrow]}
                value={intraFrames}
                onChangeText={setIntraFrames}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Modbus Address */}
          <View style={styles.inputGroup}>
            <RobotoText style={styles.inputLabel}>{t.SerialSettings.text7}</RobotoText>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput
                style={[styles.input, styles.flexGrow]}
                value={modbusAddress}
                onChangeText={setModbusAddress}
                keyboardType="numeric"
              />
            </View>
          </View>

          <SaveButton isSaveDisabled={isSaveDisabled} onPress={handleSave} />
        </View>
      </ModalContainer>

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

export default Serial;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
    thirdModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
    modalContainer: {
    maxHeight: '90%',
    backgroundColor: '#fff',
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
  v: {
    fontWeight: 'bold',
    paddingTop: 10,
    fontSize: 20
  }
});