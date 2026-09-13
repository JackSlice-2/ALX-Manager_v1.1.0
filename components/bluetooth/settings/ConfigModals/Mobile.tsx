import PostSender from '@/hooks/PostSender';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';
import ModalContainer from '@/components/utils/modalParts/ModalContainer';
import SaveButton from '@/components/utils/modalParts/SaveButton';
import RobotoText from '@/components/RobotoText';
import { MobileConfigData, MobileInfo } from '@/components/utils/types';
import LoaderOverlay from '@/components/LoaderOverlay';
import { useT } from '@/hooks/useT';

interface MobileProps{
  onClose: () => void;
  mobileData: MobileInfo
  mobileConfigData: MobileConfigData
}

const Mobile: React.FC<MobileProps> = ({
  onClose,
  mobileData,
  mobileConfigData
}) => {

  const [showPassword, setShowPassword] = useState(false);
  const [isSaveDisabled, setIsSaveDisabled] = useState(true);


  const [isHab, setIsHab] = useState(false);
  const [isApn, setIsApn] = useState('');
  const [isUser, setIsUser] = useState('');
  const [isSenha, setIsSenha] = useState('');

  const [sendPayload, setSendPayload] = useState<any>(null);

  const hasInitialized = React.useRef(false);
  const t = useT()

useEffect(() => {
  if (hasInitialized.current) return;
  if (!mobileConfigData || Object.keys(mobileConfigData).length === 0) return;
  if (!mobileData || Object.keys(mobileData).length === 0)  return;

  setIsHab(mobileConfigData.cel_hab);
  setIsApn(mobileConfigData.cel_apn);
  setIsUser(mobileConfigData.cel_user);
  setIsSenha(mobileConfigData.cel_senha);

  const fullData = {
    ...mobileData,
    ...mobileConfigData
  }
  console.log('Full Mobile Data:', fullData);

  hasInitialized.current = fullData && Object.keys(fullData).length > 0;
}, [mobileConfigData, mobileData]);

  useEffect(() => {
    const allFilled = !!isApn && !!isUser && !!isSenha;
    setIsSaveDisabled(!(allFilled));
  }, [isApn, isUser, isSenha]);

  const handlePost = () => {
    setSendPayload({
      cel_hab: isHab,
      cel_rede: "LTE-FDD",
      cel_apn: isApn,
      cel_user: isUser,
      cel_senha: isSenha
    });
  };
  
    const handleSave = () => {
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

  return (
    <ModalContainer
      visible
      onClose={onClose}
      title={t.SettingsOptions.Mobile}
      image={require('@/assets/images/Simcard.png')}
      data={mobileData || mobileConfigData}
    >
       {sendPayload &&
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }}>
            <LoaderOverlay visible={sendPayload} />
          </View>
              }
      {sendPayload && (
        <PostSender
          endpoint="/req_config_celular"
          payload={sendPayload}
          onSuccess={() => {
            Alert.alert(
              "Sucesso",
              "Dados salvos corretamente no gateway"
            );
            setSendPayload(null);
            onClose()
          }}
          onError={(err) => {
            Alert.alert(
              "Falha",
              "Nã foi possivel salvar os dados no gateway"
            );
            alert("Erro ao salvar!");
            console.log(err);
            setSendPayload(null);
          }}
        />
      )}

      <View style={{ width: '100%', backgroundColor: '#f7f7f7ff', borderRadius: 10, marginBottom: 12 }}>
        <View style={[styles.inputGroup, { flexDirection: 'row' }]}>
          <View style={styles.singleInput}>
            <RobotoText style={styles.label}>{t.MobileSettings.text0}</RobotoText>
            <RobotoText style={styles.sectionText}>{mobileData.cel_hab}</RobotoText>
          </View>

          <View style={styles.singleInput}>
            <RobotoText style={styles.label}>{t.MobileSettings.text1}</RobotoText>
            <RobotoText style={styles.sectionText}>{mobileData.cel_tec}</RobotoText>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <RobotoText style={styles.label}>{t.MobileSettings.text2}</RobotoText>
          <RobotoText style={styles.sectionText}>{mobileData.cel_iccid}</RobotoText>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <View style={styles.toggleItem}>
          <View style={styles.toggleRow}>
            <Switch
              thumbColor={isHab ? 'rgba(163, 188, 216, 0.6)' : 'rgba(200, 200, 200, 0.5)'}
              trackColor={{
                false: 'rgba(200, 200, 200, 0.5)',
                true: 'rgba(32, 62, 107, 0.66)'
              }}
              value={isHab}
              onValueChange={setIsHab}
            />
            <RobotoText>{isHab ? t.System.Enabled : t.System.Disabled}</RobotoText>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <RobotoText style={styles.inputLabel}>{t.MobileSettings.text3}</RobotoText>
          <TextInput
            style={[styles.input, styles.flexGrow]}
            value={isApn}
            onChangeText={setIsApn}
          />
        </View>

        <View style={styles.inputGroup}>
          <RobotoText style={styles.inputLabel}>{t.MobileSettings.text4}</RobotoText>
          <TextInput
            style={[styles.input, styles.flexGrow]}
            value={isUser}
            onChangeText={setIsUser}
          />
        </View>

        <View style={styles.inputGroup}>
          <RobotoText style={styles.inputLabel}>{t.System.Password}</RobotoText>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TextInput
              style={[styles.input, styles.flexGrow]}
              secureTextEntry={!showPassword}
              value={isSenha}
              onChangeText={setIsSenha}
            />
            <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.togglePassword}>
              <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#000" />
            </Pressable>
          </View>
        </View>

        <SaveButton
          isSaveDisabled={isSaveDisabled}
          onPress={handleSave}
        />
      </View>
    </ModalContainer>
  );
};

export default Mobile;

const styles = StyleSheet.create({
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
  flexGrow: {
    flex: 1,
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
