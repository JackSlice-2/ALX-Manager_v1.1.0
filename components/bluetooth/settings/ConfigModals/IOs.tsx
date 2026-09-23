import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';

import ModalContainer from '@/components/utils/modalParts/ModalContainer';
import SaveButton from '@/components/utils/modalParts/SaveButton';
import RobotoText from '@/components/RobotoText';
import { useT } from '@/hooks/useT';

interface MQTTProps {
  onClose: () => void;
  iosData: any;
  iosPubData: any;
}

const IOs: React.FC<MQTTProps> = ({ onClose, iosData }) => {
  const [isSaveDisabled, setIsSaveDisabled] = useState(true);
  const [isPosting, setIsPosting] = useState(false);

  // AI1
  const [isAI1, setIsAI1] = useState<number | null>(null);
  const [ai1Initial, setAi1Initial] = useState('');
  const [ai1Final, setAi1Final] = useState('');

  // AI2
  const [isAI2, setIsAI2] = useState<number | null>(null);
  const [ai2Initial, setAi2Initial] = useState('');
  const [ai2Final, setAi2Final] = useState('');

  const [postPayload, setPostPayload] = useState<any>(null);
  const [postEndpoint, setPostEndpoint] = useState('');

  const t = useT();

  useEffect(() => {
    if (!iosData?.configs?.length) return;

    if (isAI1 === null && isAI2 === null) {
      setIsAI1(iosData.configs[0] ? 1 : 0);
      setIsAI2(iosData.configs[1] ? 1 : 0);
    }
  }, [iosData, isAI1, isAI2]);

  useEffect(() => {
    const requiredFilled =
      isAI1 !== null &&
      isAI2 !== null &&
      ai1Initial.trim() !== '' &&
      ai1Final.trim() !== '' &&
      ai2Initial.trim() !== '' &&
      ai2Final.trim() !== '';

    setIsSaveDisabled(!requiredFilled);
  }, [
    isAI1,
    isAI2,
    ai1Initial,
    ai1Final,
    ai2Initial,
    ai2Final,
  ]);

  const handleSave = () => {
    Alert.alert(
      'Confirmar Salvar',
      'Você tem certeza de que quer salvar as alterações?',
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim',
          onPress: handlePost,
        },
      ],
      { cancelable: false }
    );
  };

  const handlePost = () => {
    if (isPosting) return;

    setIsPosting(true);

    const payload = {
      configs: [
        {
          enabled: isAI1 === 1,
          initialScale: ai1Initial,
          finalScale: ai1Final,
        },
        {
          enabled: isAI2 === 1,
          initialScale: ai2Initial,
          finalScale: ai2Final,
        },
      ],
    };

    console.log('POST payload (IOs):', payload);

    setPostPayload(payload);
    setPostEndpoint('/req_config_in_ana');
  };

  return (
    <ModalContainer
      visible
      onClose={onClose}
      title={t.SettingsOptions.IOs}
      image={require('@/assets/images/icons8-control-250.png')}
      data={iosData}
    >
      {/* ENTRADA ANALÓGICA 1 */}
      <View style={styles.inputGroup}>
        <RobotoText style={styles.inputTitle}>
          Entradas Analógicas 1
        </RobotoText>

        <View style={styles.row}>
          <RobotoText style={styles.inputLabel}>
            Operação
          </RobotoText>

          <Picker
            selectedValue={isAI1}
            onValueChange={(v) => setIsAI1(Number(v))}
            style={[styles.input, styles.flexGrow]}
            dropdownIconColor="#333"
          >
            <Picker.Item label="4-20 mA" value={1} />
            <Picker.Item label="0-10 V" value={0} />
          </Picker>
        </View>

        <View style={styles.row}>
          <RobotoText style={styles.inputLabel}>
            Escala Inicial
          </RobotoText>

          <TextInput
            style={[styles.input, styles.flexGrow]}
            value={ai1Initial}
            onChangeText={setAi1Initial}
            
            placeholderTextColor="#999"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.row}>
          <RobotoText style={styles.inputLabel}>
            Escala Final
          </RobotoText>

          <TextInput
            style={[styles.input, styles.flexGrow]}
            value={ai1Final}
            onChangeText={setAi1Final}
            
            placeholderTextColor="#999"
            keyboardType="numeric"
          />
        </View>
      </View>

      {/* ENTRADA ANALÓGICA 2 */}
      <View style={styles.inputGroup}>
        <RobotoText style={styles.inputTitle}>
          Entradas Analógicas 2
        </RobotoText>

        <View style={styles.row}>
          <RobotoText style={styles.inputLabel}>
            Operação
          </RobotoText>

          <Picker
            selectedValue={isAI2}
            onValueChange={(v) => setIsAI2(Number(v))}
            style={[styles.input, styles.flexGrow]}
            dropdownIconColor="#333"
          >
            <Picker.Item label="4-20 mA" value={1} />
            <Picker.Item label="0-10 V" value={0} />
          </Picker>
        </View>

        <View style={styles.row}>
          <RobotoText style={styles.inputLabel}>
            Escala Inicial
          </RobotoText>

          <TextInput
            style={[styles.input, styles.flexGrow]}
            value={ai2Initial}
            onChangeText={setAi2Initial}
            
            placeholderTextColor="#999"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.row}>
          <RobotoText style={styles.inputLabel}>
            Escala Final
          </RobotoText>

          <TextInput
            style={[styles.input, styles.flexGrow]}
            value={ai2Final}
            onChangeText={setAi2Final}
            
            placeholderTextColor="#999"
            keyboardType="numeric"
          />
        </View>

        <SaveButton
          isSaveDisabled={isSaveDisabled || isPosting}
          onPress={handleSave}
          text={isPosting ? t.System.Saving : t.System.Save}
        />
      </View>
    </ModalContainer>
  );
};

export default IOs;

const styles = StyleSheet.create({
  inputGroup: {
    width: '100%',
    position: 'relative',
    backgroundColor: '#f7f7f7',
    borderRadius: 10,
    padding: 5,
    marginBottom: 20,
    gap: 5,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  inputLabel: {
    color: '#333',
    fontSize: 14,
    marginBottom: 8,
    width: '30%',
  },

  inputTitle: {
    color: '#333',
    fontSize: 16,
    marginBottom: 10,
    fontWeight: '600',
  },

  input: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    color: '#333',
    minHeight: 50,
    borderWidth: 0,
    fontSize: 16,
    width: '50%',
  },

  flexGrow: {
    flex: 1,
  },
});