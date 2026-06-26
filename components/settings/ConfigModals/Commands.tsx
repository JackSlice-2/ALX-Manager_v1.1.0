import { useLiveServerFetch } from '@/hooks/useLiveServerFetch';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import RobotoText from '../../../components/RobotoText';
import ModalContainer from '../../../components/utils/modalParts/ModalContainer';
import SaveButton from '../../../components/utils/modalParts/SaveButton';
import LoaderOverlay from '@/components/LoaderOverlay';
import { useT } from '@/hooks/useT';

interface CommandProps {
  onClose: () => void
  commandData: any
}

const Commands = ({ onClose, commandData }: CommandProps) => {

  // ---- Live fetch every 2 seconds ----
  const { data, error } = useLiveServerFetch('http://192.168.4.1/req_info_ios', 2000);

  const [isDigitalOne, setIsDigitalOne] = useState(false);
  const [isDigitalTwo, setIsDigitalTwo] = useState(false);
  const [postPayload, setPostPayload] = useState<any>(null);

  const t = useT()

  // ---- Update UI state when polling data arrives ----
  useEffect(() => {
    if (data?.out_dig?.estados) {
      setIsDigitalOne(data.out_dig.estados[0] === true);
      setIsDigitalTwo(data.out_dig.estados[1] === true);
    }
  }, [data]);

  // ---------------------------------------
  // 🔵 POST COMMAND FUNCTION
  // ---------------------------------------
const sendToggleCommand = async (saida: number, estado: number) => {
  setPostPayload({ saida, estado });
  const formData = new FormData();
  formData.append('saida', saida.toString());
  formData.append('estado', estado.toString());

  console.log("📤 [POST] Sending to /req_toggle_out");
  console.log("📦 [POST] FormData Payload:", formData);

  try {
    const response = await fetch("http://192.168.4.1/req_toggle_out", {
      method: "POST",
      body: formData,  // Using form-data
    });

    const text = await response.text();
    console.log("📥 [POST] RAW RESPONSE TEXT:", text);

    if (text.toLowerCase().includes("erro")) {
      console.log("❌ [POST] Gateway returned an error phrase.");
      Alert.alert("Falha", "Gateway retornou erro.");
      return;
    }

    console.log("✅ [POST] Command sent successfully.");
    Alert.alert("Sucesso", "Comando enviado para o gateway.");
    setPostPayload(null);
  } catch (err) {
    console.log("❌ [POST] Error:", err);
    Alert.alert("Erro", "Não foi possível enviar o comando.");
    setPostPayload(null);
  }
};

  // ---------------------------------------
  // CONFIRM DIALOG
  // ---------------------------------------
  const confirmToggle = (saida: number, estado: number) => {
    Alert.alert(
      "Confirmar Comando",
      `Você deseja ${estado === 1 ? "LIGAR" : "DESLIGAR"} a Saída ${saida + 1}?`,
      [
        { text: "Não", style: "cancel" },
        { text: "Sim", onPress: () => sendToggleCommand(saida, estado) }
      ]
    );
  };

  const handleFactoryReset = () => {
    Alert.alert(
      "Confirmar Comando",
      "Confirma a execução do comando de restaurar padrão de fabrica?",
      [{ text: "Não" }, { text: "Sim", 
        onPress: () => Alert.alert(
          "VOCÊ TEM CERTEZA?",
          "ESTE COMMANDO NÃO PODE SER REVERTIDO E TODOS OS DADOS PROGRAMADO SERÃO PERDIDOS",
      [{ text: "Não" }, { text: "Sim"}]
    )}] 
    )}

  return (
    <ModalContainer
      visible
      onClose={onClose}
      title={t.SettingsOptions.Commands}
      image={require('../../../assets/images/Command.png')}
      data={commandData}
    >
            {postPayload &&
                        <View style={{ position: 'absolute', top: 0, left: 0, right: "10%", bottom: 0, zIndex: 999 }}>
                        <LoaderOverlay visible={postPayload} />
                      </View>
                      }
      <View style={styles.cmdGroup}>
        <SaveButton text={t.CommandsSettings.text0} onPress={handleFactoryReset} isSaveDisabled={false} />
      </View>

      {error && (
        <RobotoText style={styles.fetchErrorText}>
          {t.CommandsSettings.text1}
        </RobotoText>
      )}

      <View style={styles.container}>

        {/* -------------------------- */}
        {/* SAÍDA 1  → saida = 0 */}
        {/* -------------------------- */}
        <View style={styles.row}>
          <View style={styles.buttonContainer}>
            <RobotoText style={{ padding: 5 }}>{t.CommandsSettings.text2}</RobotoText>

            <TouchableOpacity
              style={styles.button}
              onPress={() => confirmToggle(0, 1)}  // LIGAR
            >
              <RobotoText style={styles.buttonText}>{t.CommandsSettings.text3}</RobotoText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={() => confirmToggle(0, 0)}  // DESLIGAR
            >
              <RobotoText style={styles.buttonText}>{t.CommandsSettings.text4}</RobotoText>
            </TouchableOpacity>
          </View>

          <View style={[
            styles.statusBall,
            { backgroundColor: isDigitalOne ? "#28c12b" : "#bfbfbf", marginTop: "25%" }
          ]} />
        </View>

        {/* -------------------------- */}
        {/* SAÍDA 2  → saida = 1 */}
        {/* -------------------------- */}
        <View style={styles.row}>
          <View style={styles.buttonContainer}>
            <RobotoText style={{ padding: 5 }}>{t.CommandsSettings.text5}</RobotoText>

            <TouchableOpacity
              style={styles.button}
              onPress={() => confirmToggle(1, 1)}  // LIGAR
            >
              <RobotoText style={styles.buttonText}>{t.CommandsSettings.text3}</RobotoText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={() => confirmToggle(1, 0)}  // DESLIGAR
            >
              <RobotoText style={styles.buttonText}>{t.CommandsSettings.text4}</RobotoText>
            </TouchableOpacity>
          </View>

          <View style={[
            styles.statusBall,
            { backgroundColor: isDigitalTwo ? "#28c12b" : "#bfbfbf", marginTop: "25%" }
          ]} />
        </View>

      </View>
    </ModalContainer>
  );
};

export default Commands;

const styles = StyleSheet.create({
  cmdGroup: {
    width: '100%',
    backgroundColor: '#f7f7f7ff',
    borderRadius: 10,
    marginBottom: 12,
    padding: 5
  },
  container: {
    flexDirection: 'row',
    backgroundColor: '#f7f7f7ff',
    borderRadius: 10,
    justifyContent: 'space-between',
    padding: 10,
    marginBottom: 20
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10
  },
  statusBall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#5e5e5e",
    justifyContent: 'center',
    alignContent: 'center',
  },
  buttonContainer: {
    gap: 10
  },
  buttonText: {
    color: 'white',
    marginLeft: 6,
    fontWeight: 'bold',
  },
  button: {
    flexDirection: 'row',
    backgroundColor: '#007ACC',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    width: 100
  },
  fetchErrorText: {
    color: '#cc0000', 
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 14,
    padding: 8,
    backgroundColor: '#ffdddd', 
    borderRadius: 5,
    marginBottom: 10,
    width: '100%',
  }
});
