import { Alert, Dimensions } from "react-native";

  export const configOptions: { label: string; image: any }[] = [
    { label: 'Configurar WiFi', image: require('../../assets/images/wifi.png') },
    { label: 'Rede Móvel', image: require('../../assets/images/Simcard.png') },
    { label: 'GPS', image: require('../../assets/images/GPS.png') },
    { label: 'Broker MQTT', image: require('../../assets/images/Cloud.png') },
    { label: 'Drivers de Comunicação', image: require('../../assets/images/Devices.png') },
    { label: 'Canais Seriais', image: require('../../assets/images/Serial.png') },
    { label: 'Internet', image: require('../../assets/images/ethernet.png') },
    { label: 'Drivers', image: require('../../assets/images/ethernet.png') },
    { label: "I'OS", image: require('../../assets/images/ios.png') },
    { label: 'Registro de Dados', image: require('../../assets/images/MemoryData.png') },
    { label: 'Atualização de Firmware', image: require('../../assets/images/Processor.png') },
    { label: 'Comandos', image: require('../../assets/images/Command.png') },
    { label: 'Alterar Senha', image: require('../../assets/images/key.png') },
  ];

export const screenWidth = Dimensions.get('window').width;

  export const handleSave = ({onClose}: any) => {
    // Show confirmation alert before saving
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
            {onClose &&
              onClose()
            }
          }
        }
      ],
      { cancelable: false }
    );
  };
  
  