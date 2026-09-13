import React, { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';
import SaveButton from '@/components/utils/modalParts/SaveButton';
import RobotoText from '@/components/RobotoText';
import IOSPostSender from '@/hooks/IOSPostSender';
import { Picker } from '@react-native-picker/picker';
import LoaderOverlay from '@/components/LoaderOverlay';
import { useT } from '@/hooks/useT';

interface MQTTProps {
  onClose: () => void
  iosData: any
  iosPubData: any
}

const BrokerDataPublication: React.FC<MQTTProps> = ({ iosPubData, onClose }) => {


  const initialized = useRef(false);

  const [isSaveDisabled, setIsSaveDisabled] = useState(true);

const [isPeriod, setIsPeriod] = useState('');

const [isValueDI1, setIsValueDI1] = useState('');
const [isValueDI2, setIsValueDI2] = useState('');
const [isValueAI1, setIsValueAI1] = useState('');
const [isValueAI2, setIsValueAI2] = useState('');

const [isEventDI1, setIsEventDI1] = useState<number | null>(null);
const [isEventDI2, setIsEventDI2] = useState<number | null>(null);
const [isEventAI1, setIsEventAI1] = useState<number | null>(null);
const [isEventAI2, setIsEventAI2] = useState<number | null>(null);

const t = useT()

  const [isPosting, setIsPosting] = useState(false);

  const [postPayload, setPostPayload] = useState<any>(null);
  const [postEndpoint, setPostEndpoint] = useState('');

  useEffect(() => {
    if (!iosPubData?.ios_pub?.cpu) return;
    if (initialized.current) return; 

    const { time, cpu } = iosPubData.ios_pub;
    const { di_mask, ct_values, freq_values, ea_mask, ea_values } = cpu;

    setIsPeriod(String(time ?? ''));

setIsEventDI1(di_mask?.[0] ?? 0);
setIsValueDI1(
  di_mask?.[0] === 2
    ? String(ct_values?.[0] ?? 0)
    : di_mask?.[0] === 3
    ? String(freq_values?.[0] ?? 0)
    : '0'
);

setIsEventDI2(di_mask?.[1] ?? 0);
setIsValueDI2(
  di_mask?.[1] === 2
    ? String(ct_values?.[1] ?? 0)
    : di_mask?.[1] === 3
    ? String(freq_values?.[1] ?? 0)
    : '0'
);

    setIsEventAI1((ea_mask?.[0] ?? 0));
    setIsEventAI2((ea_mask?.[1] ?? 0));
    setIsValueAI1((ea_values?.[0] ?? 0));
    setIsValueAI2((ea_values?.[1] ?? 0));

    initialized.current = true;
  }, [iosPubData]);

  useEffect(() => {
const requiredFilled =
  isPeriod !== '' &&
  isEventDI1 !== null &&
  isValueDI1 !== '' &&
  isEventDI2 !== null &&
  isValueDI2 !== '' &&
  isEventAI1 !== null &&
  isValueAI1 !== '' &&
  isEventAI2 !== null &&
  isValueAI2 !== '';


    setIsSaveDisabled(!requiredFilled);
  }, [
    isPeriod,
    isEventDI1,
    isValueDI1,
    isEventDI2,
    isValueDI2,
    isEventAI1,
    isValueAI1,
    isEventAI2,
    isValueAI2,
  ]);

const handleSave = () => {
    Alert.alert(
      "Confirmar Salvar",
      "Você tem certeza de que quer salvar as alterações?",
      [
        { text: "Não", style: "cancel" },
        {
          text: "Sim",
          onPress: () => handlePost(), // Remove immediate onClose() here
        }
      ],
      { cancelable: false }
    );
  };

  const handlePost = () => {
      if (isPosting) return;

    setIsPosting(true)
    const diMask1 = Number(isEventDI1);
    const diMask2 = Number(isEventDI2);

    const payload = {
      ios_pub: {
        time: Number(isPeriod),
        cpu: {
          di_mask: [diMask1, diMask2],

          ct_values: [
            diMask1 === 3 ? 0 : Number(isValueDI1),
            diMask2 === 3 ? 0 : Number(isValueDI2),
          ],

          freq_values: [
            diMask1 === 3 ? Number(isValueDI1) : 0,
            diMask2 === 3 ? Number(isValueDI2) : 0,
          ],

          ea_mask: [
            Number(isEventAI1),
            Number(isEventAI2),
          ],

          ea_values: [
            Number(isValueAI1),
            Number(isValueAI2),
          ],
        },
      },
    };

    console.log('POST payload:', JSON.stringify(payload, null, 2));

    setPostPayload(payload);
    setPostEndpoint('/req_config_ios_pub');
  };

  return (
    <>
         {postPayload &&
          <View style={{ position: 'absolute', top: "50%", left: 0, right: 0, bottom: 0, zIndex: 999 }}>
          <LoaderOverlay visible={postPayload} />
        </View>
        }

      <View style={styles.inputGroup}>
        <RobotoText style={styles.inputTitle}>
          {t.IOsSettings.text1}
        </RobotoText>
                  <View style={styles.inputGroup}>
            <RobotoText style={styles.inputLabel}>{t.IOsSettings.text2}</RobotoText>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput
                style={[styles.input, styles.flexGrow]}
                value={isPeriod}
                onChangeText={setIsPeriod}
                placeholderTextColor="#cbd5e0"
                editable={true}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
          <RobotoText style={styles.inputLabel}>{t.IOsSettings.text3}</RobotoText>
          <Picker
            selectedValue={isEventDI1}
            onValueChange={(v) => setIsEventDI1(Number(v))}
            style={[styles.input, styles.flexGrow, { color: '#333', padding: 0 }]}
            dropdownIconColor="#333"
          >
            <Picker.Item label={t.IOsSettings.text4} value={0} />
            <Picker.Item label={t.IOsSettings.text5} value={1} />
            <Picker.Item label={t.IOsSettings.text6} value={2} />
            <Picker.Item label={t.IOsSettings.text7} value={3} />
          </Picker>
        </View>
           <View style={styles.inputGroup}>
            <RobotoText style={styles.inputLabel}>{t.IOsSettings.text8}</RobotoText>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput
                style={[styles.input, styles.flexGrow]}
                value={isValueDI1}
                onChangeText={setIsValueDI1}
                placeholderTextColor="#cbd5e0"
                editable={true}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
          <RobotoText style={styles.inputLabel}>{t.IOsSettings.text9}</RobotoText>
          <Picker
            selectedValue={isEventDI2}
            onValueChange={(v) => setIsEventDI2(Number(v))}
            style={[styles.input, styles.flexGrow, { color: '#333', padding: 0 }]}
            dropdownIconColor="#333"
          >
            <Picker.Item label={t.IOsSettings.text4} value={0} />
            <Picker.Item label={t.IOsSettings.text5} value={1} />
            <Picker.Item label={t.IOsSettings.text6} value={2} />
            <Picker.Item label={t.IOsSettings.text7} value={3} />
          </Picker>
        </View>
           <View style={styles.inputGroup}>
            <RobotoText style={styles.inputLabel}>{t.IOsSettings.text10}</RobotoText>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput
                style={[styles.input, styles.flexGrow]}
                value={isValueDI2}
                onChangeText={setIsValueDI2}
                placeholderTextColor="#cbd5e0"
                editable={true}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
          <RobotoText style={styles.inputLabel}>{t.IOsSettings.text11}</RobotoText>
          <Picker
            selectedValue={isEventAI1}
            onValueChange={(v) => setIsEventAI1(v)}
            style={[styles.input, styles.flexGrow, { color: '#333', padding: 0 }]}
            dropdownIconColor="#333"
          >
            <Picker.Item label={t.IOsSettings.text12} value={0} />
            <Picker.Item label={t.IOsSettings.text13} value={1} />
            <Picker.Item label={t.IOsSettings.text14} value={2} />
            <Picker.Item label={t.IOsSettings.text15} value={3} />
            <Picker.Item label={t.IOsSettings.text16} value={4} />
          </Picker>
        </View>
           <View style={styles.inputGroup}>
            <RobotoText style={styles.inputLabel}>{t.IOsSettings.text17}</RobotoText>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput
                style={[styles.input, styles.flexGrow]}
                value={isValueAI1}
                onChangeText={setIsValueAI1}
                placeholderTextColor="#cbd5e0"
                editable={true}
              />
            </View>
          </View>

            <View style={styles.inputGroup}>
          <RobotoText style={styles.inputLabel}>{t.IOsSettings.text18}</RobotoText>
          <Picker
            selectedValue={isEventAI2}
            onValueChange={(v) => setIsEventAI2(v)}
            style={[styles.input, styles.flexGrow, { color: '#333', padding: 0 }]}
            dropdownIconColor="#333"
          >
            <Picker.Item label={t.IOsSettings.text12} value={0} />
            <Picker.Item label={t.IOsSettings.text13} value={1} />
            <Picker.Item label={t.IOsSettings.text14} value={2} />
            <Picker.Item label={t.IOsSettings.text15} value={3} />
            <Picker.Item label={t.IOsSettings.text16} value={4} />
          </Picker>
        </View>
           <View style={styles.inputGroup}>
            <RobotoText style={styles.inputLabel}>{t.IOsSettings.text19}</RobotoText>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput
                style={[styles.input, styles.flexGrow]}
                value={isValueAI2}
                onChangeText={setIsValueAI2}
                placeholderTextColor="#cbd5e0"
                editable={true}
              />
            </View>
          </View>

     <SaveButton
  isSaveDisabled={isSaveDisabled || isPosting}
  onPress={handleSave}
  text={isPosting ? t.System.Saving : t.System.Save}
/>
      </View>

      {postPayload && postEndpoint && (
       <IOSPostSender
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

export default BrokerDataPublication;


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
  inputTitle: {
    color: '#333',
    fontSize: 16,
    marginBottom: 10,
    fontWeight: 'semibold',
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