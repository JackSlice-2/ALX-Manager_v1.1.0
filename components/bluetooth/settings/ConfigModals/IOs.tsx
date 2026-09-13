import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import ModalContainer from '@/components/utils/modalParts/ModalContainer';
import SaveButton from '@/components/utils/modalParts/SaveButton';
import RobotoText from '@/components/RobotoText';
import BrokerDataPublication from './BrokerDataPublication';
import IOSPostSender from '@/hooks/IOSPostSender';
import LoaderOverlay from '@/components/LoaderOverlay';
import { useT } from '@/hooks/useT';

interface MQTTProps {
  onClose: () => void;
  iosData: any;
  iosPubData: any;
}

const IOs: React.FC<MQTTProps> = ({ onClose, iosData, iosPubData }) => {
  const [isSaveDisabled, setIsSaveDisabled] = useState(true);
  const [isPosting, setIsPosting] = useState(false);

  const [isAI1, setIsAI1] = useState<number | null>(null);
  const [isAI2, setIsAI2] = useState<number | null>(null);

  const [postPayload, setPostPayload] = useState<any>(null);
  const [postEndpoint, setPostEndpoint] = useState('');

  const t = useT()

useEffect(() => {
  if (!iosData?.configs?.length) return;

  if (isAI1 === null && isAI2 === null) {
    setIsAI1(iosData.configs[0] ? 1 : 0);
    setIsAI2(iosData.configs[1] ? 1 : 0);
  }
}, [iosData, isAI1, isAI2]);


  useEffect(() => {
    const requiredFilled = isAI1 !== null && isAI2 !== null;
    setIsSaveDisabled(!requiredFilled);
  }, [isAI1, isAI2]);

  const handleSave = () => {
    Alert.alert(
      "Confirmar Salvar",
      "Você tem certeza de que quer salvar as alterações?",
      [
        { text: "Não", style: "cancel" },
        {
          text: "Sim",
          onPress: () => handlePost(), 
        }
      ],
      { cancelable: false }
    );
  };

  const handlePost = () => {
    if (isPosting) return;
    setIsPosting(true);

    const payload = {
      configs: [
        isAI1 === 1, 
        isAI2 === 1
      ]
    };

    console.log('POST payload (IOs):', payload);
    setPostPayload(payload);
    setPostEndpoint('/req_config_in_ana');
  };

  return (
    <>
      <ModalContainer
        visible
        onClose={onClose}
        title={t.SettingsOptions.IOs}
        image={require('@/assets/images/icons8-control-250.png')}
        data={iosData}
      >
          {postPayload &&
                                  <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: "80%", zIndex: 999 }}>
                                  <LoaderOverlay visible={postPayload} />
                                </View>
                                }
        <View style={styles.inputGroup}>
          <View style={styles.inputGroup}>
            <RobotoText style={styles.inputTitle}>
              {t.IOsSettings.text0}
            </RobotoText>
            
            <RobotoText style={styles.inputLabel}>AI 1</RobotoText>
            <Picker
              selectedValue={isAI1}
              onValueChange={(v) => setIsAI1(Number(v))}
              style={[styles.input, styles.flexGrow, { color: '#333', padding: 0 }]}
              dropdownIconColor="#333"
            >
              <Picker.Item label="4-20 mA" value={1} />
              <Picker.Item label="0-10 V" value={0} />
            </Picker>
          </View>

          <View style={styles.inputGroup}>
            <RobotoText style={styles.inputLabel}>AI 2</RobotoText>
            <Picker
              selectedValue={isAI2}
              onValueChange={(v) => setIsAI2(Number(v))}
              style={[styles.input, styles.flexGrow, { color: '#333', padding: 0 }]}
              dropdownIconColor="#333"
            >
              <Picker.Item label="4-20 mA" value={1} />
              <Picker.Item label="0-10 V" value={0} />
            </Picker>
          </View>

          <SaveButton 
            isSaveDisabled={isSaveDisabled || isPosting} 
            onPress={handleSave} 
            text={isPosting ? t.System.Saving : t.System.Save} 
          />
        </View>

        <BrokerDataPublication 
            onClose={() => onClose()} 
            iosData={iosData} 
            iosPubData={iosPubData}
        />
      </ModalContainer>

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

export default IOs;

const styles = StyleSheet.create({
  inputGroup: {
    width: '100%',
    position: 'relative',
    backgroundColor: '#f7f7f7ff',
    borderRadius: 10,
    padding: 5,
    marginBottom: 20
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
  flexGrow: {
    flex: 1,
  },
});