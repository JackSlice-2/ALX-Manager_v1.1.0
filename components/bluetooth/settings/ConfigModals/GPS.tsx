import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Switch, TextInput, View } from 'react-native';
import ModalContainer from '@/components/utils/modalParts/ModalContainer';
import SaveButton from '@/components/utils/modalParts/SaveButton';
import RobotoText from '@/components/RobotoText';
import LoaderOverlay from '@/components/LoaderOverlay';
import PostSender from '@/hooks/PostSender';
import { useT } from '@/hooks/useT';

interface GPSProps {
  onClose: () => void;
  gpsData: any
  datalogger: any
}

const GPS: React.FC<GPSProps> = ({ 
  onClose,
  gpsData,
  datalogger
 }) => {
  const [selectedNetwork, setSelectedNetwork] = useState<string>('');
  const [isSaveDisabled, setIsSaveDisabled] = useState(true);
  const [isWifiEnabled, setIsWifiEnabled] = useState(true);
  const [postPayload, setPostPayload] = useState<any>(null);
  const [postEndpoint, setPostEndpoint] = useState('');
  const t = useT()

const handleToggleChange = (value: boolean) => {
  setIsWifiEnabled(value);
  if (!value) {
  }
};

useEffect(() => {
  setIsSaveDisabled(!selectedNetwork);
}, [selectedNetwork]);

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
        title={t.SettingsOptions.GPS}
        image={require('@/assets/images/GPS.png')}
        data={datalogger || gpsData}
>
      {postPayload &&
                  <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }}>
                  <LoaderOverlay visible={postPayload} />
                </View>
                }
                <View style={{width: '100%', backgroundColor:'#f7f7f7ff', borderRadius: 10, marginBottom: 12}}>
              <View style={[styles.inputGroup, {flexDirection: 'row'}]}>
             
              <View style={styles.singleInput}>

              <RobotoText style={styles.label}>{t.GPSSettings.text0}</RobotoText>
                <RobotoText style={styles.sectionText}>{datalogger.sts_gnss}</RobotoText>
              </View>
               <View style={styles.singleInput}>
              <RobotoText style={styles.label}>{t.GPSSettings.text1}</RobotoText>
                <RobotoText style={styles.sectionText}>{gpsData.gps_n_sat}</RobotoText>
              </View>

              </View>
               <View style={[styles.inputGroup, {flexDirection: 'row'}]}>
             
              <View style={styles.singleInput}>
              <RobotoText style={styles.label}>{t.GPSSettings.text2}</RobotoText>
                <RobotoText style={styles.sectionText}>{gpsData.gps_lat}</RobotoText>
              </View>
               <View style={styles.singleInput}>
              <RobotoText style={styles.label}>{t.GPSSettings.text3}</RobotoText>
                <RobotoText style={styles.sectionText}>{gpsData.gps_lon}</RobotoText>
              </View>
              
              </View>
               <View style={[styles.inputGroup, {flexDirection: 'row'}]}>
             
              <View style={styles.singleInput}>
              <RobotoText style={styles.label}>{t.GPSSettings.text4}</RobotoText>
                <RobotoText style={styles.sectionText}>{gpsData.gps_alt}</RobotoText>
              </View>
               <View style={styles.singleInput}>
              <RobotoText style={styles.label}>{t.GPSSettings.text5}</RobotoText>
                <RobotoText style={styles.sectionText}>{gpsData.gps_vel}</RobotoText>
              </View>
              
              </View>
               <View style={[styles.inputGroup, {flexDirection: 'row'}]}>
             
              <View style={styles.singleInput}>
              <RobotoText style={styles.label}>{t.GPSSettings.text6}</RobotoText>
                <RobotoText style={styles.sectionText}>{gpsData.gps_err}</RobotoText>
              </View>
               <View style={styles.singleInput}>
              <RobotoText style={styles.label}>{t.GPSSettings.text7}</RobotoText>
                <RobotoText style={styles.sectionText}>{gpsData.gps_azim}</RobotoText>
              </View>
              
              </View>

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
        transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }], // Slightly scale the track
        width: 50,  // Adjust width of switch (track size)
        height: 30,  // Adjust height of switch (track size)
      }}
    />
    <RobotoText>{t.GPSSettings.text8}</RobotoText>
  </View>
</View>



            {/* Display the currently connected Wi-Fi network */}
          <View style={styles.inputGroup}>
            <RobotoText style={styles.inputLabel}>{t.GPSSettings.text9}</RobotoText>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput
                style={[styles.input, styles.flexGrow]}
                value={selectedNetwork}
                onChangeText={setSelectedNetwork}
                placeholderTextColor="#cbd5e0"
                keyboardType="numeric"
                editable={isWifiEnabled}
              />

            </View>
          </View>
          
           <SaveButton isSaveDisabled={isSaveDisabled} onPress={handleSave} />
            </View>
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

export default GPS;

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
});
