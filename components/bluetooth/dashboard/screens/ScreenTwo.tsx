import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import RobotoText from '@/components/RobotoText';
import ModalHeader from '@/components/utils/modalParts/ModalHeader';
import { useT } from '@/hooks/useT';

  export interface ScreenTwoProps {
    screenWidth: any;
    datalogger : any;
    config: any
    ios: any
  }

const ScreenTwo: React.FC<ScreenTwoProps> = ({
  screenWidth,
  datalogger,
  config,
  ios
}) => {

  const t = useT()

  const status = datalogger.sts_eeprom && datalogger.sts_spiffs === 'Inicializada com sucesso' ? 'OK' : 'Erro interno detectado'
  
  return (
    <View style={[styles.screen, { width: screenWidth, maxHeight: '50%' }]}>
      <View style={{ flex: 1 }}>
        <View style={styles.modalContainer}>
          <ModalHeader
            title={t.StatusPage2.text0}
            image={require('@/assets/images/SVG/icons8-nas-250 (1).png')} 
          />
          <View style={{maxWidth: '100%', padding: 15, borderRadius: 10, backgroundColor: 'rgb(233, 234, 235)', width: '100%', marginBottom: 30, marginTop: '5%'}}>
            <View style={styles.imageContainer}>
              <Image 
                source={require('@/assets/images/CPU.png')} 
                style={styles.image}
              />
            </View>
          </View>
          <View style={{width: '100%', backgroundColor: 'rgb(233, 234, 235)', borderRadius: 10, marginBottom: 20, marginTop: 30}}>
            <View style={[styles.inputGroup, {flexDirection: 'row'}]}>
              <View style={styles.singleInput}>
                <RobotoText style={styles.label}>
                  {t.StatusPage2.text1}
                </RobotoText>
                <RobotoText style={styles.sectionText}>{status}</RobotoText>
              </View>
            </View>
            <View style={[styles.inputGroup, {flexDirection: 'row'}]}>
              <View style={styles.singleInput}>
                <RobotoText style={styles.label}>
                  {t.StatusPage2.text2}
                </RobotoText>
                <RobotoText style={styles.sectionText}>{datalogger.modelo}</RobotoText>
              </View>
              <View style={styles.singleInput}>
                <RobotoText style={styles.label}>
                  {t.StatusPage2.text3}
                </RobotoText>
                <RobotoText style={styles.sectionText}>{datalogger.versao_firmware}</RobotoText>
              </View>
              <View style={styles.singleInput}>
                <RobotoText style={styles.label}>
                  {t.StatusPage2.text4}
                </RobotoText>
                <RobotoText style={styles.sectionText}>{config.endereco_modbus}</RobotoText>
              </View>
            </View>
            <View style={[styles.inputGroup, {flexDirection: 'row'}]}>
              <View style={styles.smallerSingleInput}>
                <RobotoText style={styles.label}>DI</RobotoText>
                <RobotoText style={styles.sectionText}>
                  {ios.in_dig?.qtd || '-'}
                  </RobotoText>
              </View>
              <View style={styles.smallerSingleInput}>
                <RobotoText style={styles.label}>DO</RobotoText>
                <RobotoText style={styles.sectionText}>{ios.out_dig?.qtd || '-'}</RobotoText>
              </View>
              <View style={styles.smallerSingleInput}>
                <RobotoText style={styles.label}>AI</RobotoText>
                <RobotoText style={styles.sectionText}>{ios.in_ana?.qtd || '-'}</RobotoText>
              </View>
              <View style={styles.smallerSingleInput}>
                <RobotoText style={styles.label}>AO</RobotoText>
                <RobotoText style={styles.sectionText}>-</RobotoText>
              </View>
              <View style={styles.singleInput}>
                <RobotoText style={styles.label}>
                  {t.StatusPage2.text5}
                </RobotoText>
                <RobotoText style={styles.sectionText}>-</RobotoText>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}
export default ScreenTwo

const styles = StyleSheet.create({
  screen: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  modalContainer: {
    borderRadius: 16,
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
  inputGroup: {
    width: '100%',
    position: 'relative',
    borderRadius: 10,
    padding: 5,
    marginBottom: 20
  },
  singleInput: {
    width: '33%',
    position: 'relative',
    borderRadius: 10,
    padding: 5
  },
  smallerSingleInput: {
    width: '12%',
    position: 'relative',
    borderRadius: 10,
    padding: 5,
    marginRight: 5
  },
  sectionText: {
    fontSize: 18,
    fontWeight: 'semibold',
  },
  label: {
    color: '#666',
    marginBottom: 4,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 160,  // Ensure this matches the height of your image
    borderRadius: 10,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',  // Ensure the image covers the container without distorting
  },
})
