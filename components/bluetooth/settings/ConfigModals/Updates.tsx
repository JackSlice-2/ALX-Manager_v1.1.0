import useServerFetch from '@/hooks/useServerfetch';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Alert, Image, StyleSheet, Switch, TextInput, View } from 'react-native';
import ModalContainer from '@/components/utils/modalParts/ModalContainer';
import SaveButton from '@/components/utils/modalParts/SaveButton';
import RobotoText from '@/components/RobotoText';
import LoaderOverlay from '@/components/LoaderOverlay';
import PostSender from '@/hooks/PostSender';
import { useT } from '@/hooks/useT';

type UrlParams = {
  codigo: string;
  versao: string;
  serial: string;
};

interface UpdatesProps {
  onClose: () => void
  datalogger: any
}

const Updates: React.FC<UpdatesProps> = ({ onClose, datalogger }) => {
  const [hour, setHour] = useState('12');
  const [minute, setMinute] = useState('00'); 
  const [isSaveDisabled, setIsSaveDisabled] = useState(true);
  const [isWifiEnabled, setIsWifiEnabled] = useState(true);
  const [isForceUpdateDisabled, setIsForceUpdateDisabled] = useState(true);
  const [triggerFetch, setTriggerFetch] = useState(false); 
  const [postPayload, setPostPayload] = useState<any>(null);
  const [postEndpoint, setPostEndpoint] = useState('');
  const t = useT()

    const [updateInfo, setUpdateInfo] = useState<any>(null);
     useEffect(() => {
    const loadUpdateInfo = async () => {
      const saved = await AsyncStorage.getItem("update_info");
      if (saved) {
        setUpdateInfo(JSON.parse(saved));
      }
    };

    loadUpdateInfo();
  }, []);

  const [firmwareCheckUrl, setFirmwareCheckUrl] = useState<string | null>(null); 
  const [urlParams, setUrlParams] = useState<UrlParams | null>(null);

  
  useEffect(() => {
    if (datalogger && datalogger.modelo && datalogger.versao_firmware && datalogger.numero_serie) {
        const codigo = "alx4gs"
        const versao = datalogger.versao_firmware; 
        const serial = datalogger.numero_serie; 
        setUrlParams({ codigo, versao, serial }); 
    } else {
        setUrlParams(null); 
    }
  }, [datalogger]);

  const serverData = useServerFetch(triggerFetch ? firmwareCheckUrl : null);
  
  useEffect(() => {
    const updateAvailable = serverData.data?.status === 'atualizacao_disponivel';
    
    setIsForceUpdateDisabled(!updateAvailable);
  }, [serverData.data]); 

  const onHourChange = (text: string) => {
    if (/^[0-9]*$/.test(text)) {
      setHour(text);
    }
  };

  const onMinuteChange = (text: string) => {
    if (/^[0-9]*$/.test(text)) {
      setMinute(text);
    }
  };

  const handleToggleChange = (value: boolean) => {
    setIsWifiEnabled(value);
  };

useEffect(() => {
  const validHour = hour.length === 2 && Number(hour) >= 0 && Number(hour) <= 23;
  const validMinute = minute.length === 2 && Number(minute) >= 0 && Number(minute) <= 59;

  setIsSaveDisabled(!(isWifiEnabled && validHour && validMinute));
}, [hour, minute, isWifiEnabled]);

  
  let errorMessage = serverData.error ? serverData.error.message : null;

  if (serverData.error && errorMessage?.includes('Network request failed')) {
      errorMessage = "Não foi possível conectar ao servidor de atualizações da Allexo. Verificação de novas versões indisponível.";
  } else if (serverData.error) {
      errorMessage = `Erro ao verificar atualização: ${errorMessage}`;
  }

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
    const payload = {
     
    };

    setPostPayload(payload);
    setPostEndpoint('/');
  };

  return (
    <>
       <ModalContainer
        visible
        onClose={onClose} 
        title={t.SettingsOptions.Updates}
        image={require('@/assets/images/Processor.png')}
        data={datalogger}
      >
          {postPayload &&
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }}>
                <LoaderOverlay visible={postPayload} />
              </View>
              }
                <View style={{width: '100%', backgroundColor:'#f7f7f7ff', borderRadius: 10, marginBottom: 12, padding: 5}}>
              
              {errorMessage && (
                  <RobotoText style={styles.fetchErrorText}>{errorMessage}</RobotoText>
              )}

              <View style={[styles.inputGroup, {flexDirection: 'row'}]}>
             
              <View style={styles.singleInput}>

              <RobotoText style={styles.label}>{t.UpdateSettings.text0}</RobotoText>
                <RobotoText style={styles.sectionText}>{datalogger?.versao_firmware ?? '---'}</RobotoText>
              </View>
               <View style={styles.singleInput}>
              <RobotoText style={styles.label}>{t.UpdateSettings.text1}</RobotoText>
              <View style={{flexDirection: 'row'}}>
                <RobotoText style={styles.sectionText}>
                      {updateInfo?.versionAvailable ?? '---'}
                </RobotoText>
                {updateInfo?.rawData?.status === 'atualizacao_disponivel' && (
                    <Image 
                        source={require('@/assets/images/SVG/icons8-exclamation-250.png')} 
                        style={{ width: 25, height: 25, marginLeft: 20}} 
                    />
                )}
              </View>
              </View>

              </View>
               <SaveButton 
                   text={t.UpdateSettings.text2} 
                   isSaveDisabled={updateInfo?.rawData?.status !== 'atualizacao_disponivel'} 
               />
              </View>

          <View style={styles.inputGroup}>
            <View style={styles.toggleItem}>
              <View style={styles.toggleRow}>
                <Switch
                  thumbColor={isWifiEnabled ? 'rgba(163, 188, 216, 0.6)' : 'rgba(200, 200, 200, 0.5)'}
                  trackColor={{
                    false: 'rgba(200, 200, 200, 0.5)',
                    true: 'rgba(32, 62, 107, 0.66)',
                  }}
                  value={isWifiEnabled}
                  onValueChange={handleToggleChange}
                  style={{
                    transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }],
                    width: 50,
                    height: 30,
                  }}
                />
                <RobotoText>{isWifiEnabled ? t.System.Enabled : t.System.Disabled}</RobotoText>
              </View>
            </View>


            <View style={styles.inputGroup}>
               <RobotoText style={styles.label}>{t.UpdateSettings.text3}</RobotoText>
               <View style={styles.timeInputGroup}>
                 <TextInput
                   style={styles.timeInput}
                   value={hour}
                   onChangeText={onHourChange}
                   keyboardType="numeric"
                   maxLength={2}
                 />
                 <RobotoText style={styles.separator}>:</RobotoText>
         
                 <TextInput
                   style={styles.timeInput}
                   value={minute}
                   onChangeText={onMinuteChange}
                   keyboardType="numeric"
                   maxLength={2}
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

export default Updates;

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
   timeInput: {
    backgroundColor: '#f0f0f0',
    padding: 14,
    borderRadius: 8,
    color: '#333',
    width: '47%',
    textAlign: 'center'
    
  },
    timeInputGroup: {
    marginBottom: 14,
    flexDirection: 'row',
  },
  separator: {
    fontSize: 18,
    color: '#333',
    marginHorizontal: 8,
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