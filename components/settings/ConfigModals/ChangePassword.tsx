import PostSender from '@/hooks/PostSender';
import useCurrentSSID from '@/hooks/useCurrentSSID';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  TextInput,
  View
} from 'react-native';
import ModalContainer from '../../../components/utils/modalParts/ModalContainer';
import SaveButton from '../../../components/utils/modalParts/SaveButton';
import RobotoText from '../../RobotoText';
import { router } from 'expo-router';
import useWifiPassword from '@/hooks/useWifiPassword';
import { useT } from '@/hooks/useT';

type ChangePasswordModalProps = {
  visible: boolean;
  onClose: () => void;
};

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  visible,
  onClose,
}) => {
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSaveDisabled, setIsSaveDisabled] = useState(true);
  const ssid = useCurrentSSID()

  const { password: currentPassword } = useWifiPassword(ssid)

  const [currentPasswordError, setCurrentPasswordError] = useState('');

  const t = useT()

  useEffect(() => {
  if (password.length === 0) {
    setCurrentPasswordError('');
  } /*else if (password !== currentPassword) {
    setCurrentPasswordError('Senha incorreta');
  }*/ else {
    setCurrentPasswordError('');
  }

  // Enable Save button only if all conditions are met
  if (/*password === currentPassword &&*/ newPassword.length !== 0 && newPassword === confirmPassword) {
    setIsSaveDisabled(false);
  } else {
    setIsSaveDisabled(true);
  }
}, [password, newPassword, confirmPassword, currentPassword]);



  useEffect(() => {
    if (password.length === 0) {
      setCurrentPasswordError('');
    }/* else if (password !== currentPassword) {
      setCurrentPasswordError('Senha incorreta');
    }*/ else {
      setCurrentPasswordError('');
    }

    if (
      /*password === currentPassword &&*/
      newPassword.length >= 8 &&
      newPassword === confirmPassword
    ) {
      setIsSaveDisabled(false);
    } else {
      setIsSaveDisabled(true);
    }
  }, [password, newPassword, confirmPassword, currentPassword]);


  const [sendPayload, setSendPayload] = useState<any | null>(null);

  const handlePost = () => {
    console.log("🔐 Saving new password...");

    const payload = {
      s_atual: password,
      s_nova: newPassword,
      s_nova_r: confirmPassword,
    };

    console.log("📤 Payload to send:", payload);

    setSendPayload(payload);
  };

         const handleSave = ({onClose}: any) => {
          Alert.alert(
            "Confirmar Salvar",
            "Você tem certeza de que quer salvar as alterações?",
            [
              {
                text: "Não",
                 onPress: () => {
                  {onClose &&
                    onClose()
                  }
                },
                style: "cancel"
              },
              {
                text: "Sim",
                onPress: () => {
                  Alert.alert(
                    "Confirmar Alteração de Senha",
                    "ESTA MODIFICAÇÃO IRÁ DESCONECTAR O GATEWAY DO APLICATIVO SENDO NECESSÁRIO NOVO PROCEDIMENTO DE CONEXÃO. DESEJA CONTINUAR?",
                [
              {
                text: "Não",
                 onPress: () => {
                  {onClose &&
                    onClose()
                  }
                },
                style: "cancel"
              },
              {
                text: "Sim",
                onPress: () => {
                  {handlePost()
                    onClose && onClose()
                  }
                }
              }
            ])
          }
        }
            ]
          );
        };


  return (
    <ModalContainer
      onClose={onClose}
      image={require('../../../assets/images/key.png')}
      title={t.SettingsOptions.Password}
      visible={visible}
      /*TODO: CORRECT TYPEING OF ssid */
      /*@ts-ignore*/
      data={ssid}
    >
      <>
        <View style={styles.inputGroup}>
          <RobotoText style={styles.inputLabel}>{t.PasswordSettings.text0}</RobotoText>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.flexGrow]}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor="#cbd5e0"
            />
            <Pressable onPress={() => setShowPassword((prev) => !prev)} style={styles.togglePassword}>
              <Ionicons
                name={showPassword ? 'eye-off' : 'eye'}
                size={20}
                color="#000000ff"
              />
            </Pressable>
          </View>
          <RobotoText style={styles.errorText}>{currentPasswordError}</RobotoText>


          <RobotoText style={styles.inputLabel}>{t.PasswordSettings.text1}</RobotoText>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.flexGrow]}
              secureTextEntry={!showNewPassword}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="••••••••"
              placeholderTextColor="#cbd5e0"
            />
            <Pressable onPress={() => setShowNewPassword((prev) => !prev)} style={styles.togglePassword}>
              <Ionicons
                name={showNewPassword ? 'eye-off' : 'eye'}
                size={20}
                color="#000000ff"
              />
            </Pressable>
          </View>

          <RobotoText style={styles.inputLabel}>{t.PasswordSettings.text2}</RobotoText>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.flexGrow]}
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="••••••••"
              placeholderTextColor="#cbd5e0"
            />
            <Pressable onPress={() => setShowConfirmPassword((prev) => !prev)} style={styles.togglePassword}>
              <Ionicons
                name={showConfirmPassword ? 'eye-off' : 'eye'}
                size={20}
                color="#000000ff"
              />
            </Pressable>
          </View>
        </View>

        <SaveButton isSaveDisabled={isSaveDisabled} onPress={handleSave} />

        {sendPayload && (
          <PostSender
            endpoint="/req_ajustes_senha"
            payload={sendPayload}
            onSuccess={() => router.replace('/')}
            onError={(err) => console.log("❌ Error updating password:", err)}
          />
        )}
      </>
    </ModalContainer>
  );
};

const styles = StyleSheet.create({
  inputGroup: {
    marginBottom: 20,
    width: '100%',
    backgroundColor: '#f7f7f7ff',
    borderRadius: 10,
    padding: 10,
  },
  inputLabel: {
    color: '#7e7e7eff',
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f0f0f0',
    padding: 14,
    borderRadius: 8,
    color: '#333',
    fontSize: 16,
    borderWidth: 0,
    marginBottom: 15,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  togglePassword: {
    paddingHorizontal: 4,
  },
  flexGrow: {
    flex: 1,
  },
  errorText: {
  color: '#FF6B6B',
  fontSize: 13,
  marginBottom: 10,
}

});

export default ChangePasswordModal;
