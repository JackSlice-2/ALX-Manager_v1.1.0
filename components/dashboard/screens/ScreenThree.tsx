import { router } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import RobotoText from '../../../components/RobotoText';
import ModalHeader from '../../../components/utils/modalParts/ModalHeader';
import { useT } from '@/hooks/useT';

 interface ScreenThreeProps {
    screenWidth?: any;
    raw: any
  }

const ScreenThree: React.FC<ScreenThreeProps> = ({
  screenWidth, 
  raw
}) => {

  const t = useT()
  const drivers = Array.isArray(raw) ? raw : raw ? [raw] : [];

  if (drivers.length === 0) {
    const addDriver = () => {
    router.push(`/settings?selectedOption=Configurar Drivers`);
  };

    return (
    <View style={[styles.screen, { width: screenWidth }]}>
      <View style={{ flex: 1 }}>
        <View style={styles.modalContainer}>
          <ModalHeader
            title='Drivers de Comunicação' 
            image={require('../../../assets/images/SVG/icons8-ph-meter-250.png')} 
          />
          <View
            style={{
              width: '100%',
              borderRadius: 10,
              marginBottom: 10,
              marginTop: 10
            }}
          >
          <RobotoText style={{ fontSize: 18, textAlign: 'center' }}>
            {t.StatusPage3.text0}
          </RobotoText>
        </View>
        </View>
     <View style={{backgroundColor: '#f7f7f7ff', padding: 10, borderRadius: 40, alignSelf: 'flex-end', margin: 5 }}>
         <TouchableOpacity onPress={addDriver}>
          <Image source={require('../../../assets/images/Tools.png')} style={{ width: 35, height: 35}} />
          <RobotoText>
            {t.StatusPage3.text1}
          </RobotoText>
        </TouchableOpacity>
        </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { width: screenWidth }]}>
      <View style={{ flex: 1 }}>
        <View style={styles.modalContainer}>
          <ModalHeader
            title={t.StatusPage3.text10}
            image={require('../../../assets/images/SVG/icons8-ph-meter-250.png')} 
          />

          <View
            style={{
              width: '100%',
              borderRadius: 10,
              marginBottom: 10,
              marginTop: 10
            }}
          >
            {drivers.map((driver: any, index: number) => (
              <View
                key={index}
                style={{
                  width: '100%',
                  backgroundColor: 'rgb(233, 234, 235)',
                  borderRadius: 10,
                  marginBottom: 10,
                  marginTop: 10
                }}
              >
                <TouchableOpacity
                  style={{ alignSelf: 'flex-end', margin: 2, padding: 5 }}
                  onPress={() => router.navigate('/settings?selectedOption=Configurar Drivers')}
                >
                  <Image 
                    source={require('../../../assets/images/Tools.png')} 
                    style={{ width: 31, height: 31 }} 
                  />
                </TouchableOpacity>

                {/* Row 1 */}
                <View style={[styles.inputGroup, { flexDirection: 'row' }]}>
                  <View style={[styles.singleInput,{width: "70%"}]}>
                    <RobotoText style={styles.label}>
                      {t.StatusPage3.text3}
                    </RobotoText>
                    <RobotoText style={[styles.sectionText,{width: "100%"}]}>{driver.driver}</RobotoText>
                  </View>


                  <View style={[styles.singleInputIPLine, {width: "30%"}]}>
                    <RobotoText style={styles.label}>
                      {t.StatusPage3.text4}
                    </RobotoText>
                    <RobotoText style={styles.sectionText}>{driver.rev}</RobotoText>
                  </View>
                </View>

                {/* Row 2 */}
                <View style={[styles.inputGroup, { flexDirection: 'row' }]}>
                  <View style={styles.singleInput}>
                    <RobotoText style={styles.label}>{t.StatusPage3.text2}</RobotoText>
                    <RobotoText style={styles.sectionText}>
                      {driver.rtu === true && "RTU"}
                      {driver.tcp  === true && driver.rtu === true && "/"}
                      {driver.tcp === true && "TCP"}
                      </RobotoText>
                  </View>

                  <View style={styles.singleInputIP}>
                    <RobotoText style={styles.label}>
                      {t.StatusPage3.text5}
                    </RobotoText>
                    <RobotoText style={styles.IPsectionText}>{driver.ip || '-'}</RobotoText>
                  </View>

                  <View style={styles.singleInputIPLine}>
                    <RobotoText style={styles.label}>
                      {t.StatusPage3.text6}
                    </RobotoText>
                    <RobotoText style={styles.sectionText}>{driver.port}</RobotoText>
                  </View>
                </View>

                {/* Row 3 */}
                <View style={[styles.inputGroup, { flexDirection: 'row' }]}>
                  <View style={styles.singleInput}>
                    <RobotoText style={styles.label}>
                      {t.StatusPage3.text7}
                    </RobotoText>
                    <RobotoText style={styles.sectionText}>{driver.end}</RobotoText>
                  </View>

                  <View style={styles.singleInputIP}>
                    <RobotoText style={styles.label}>
                      {t.StatusPage3.text8}
                    </RobotoText>
                    <RobotoText style={styles.sectionText}>{driver.tmout}</RobotoText>
                  </View>

                  <View style={styles.singleInputIPLine}>
                    <RobotoText style={styles.label}>
                      {t.StatusPage3.text9}
                    </RobotoText>
                    <RobotoText style={styles.sectionText}>{driver.erro}</RobotoText>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
};

export default ScreenThree;

const styles = StyleSheet.create({
  scrollContainer: {
    flexDirection: 'row', 
  },
  screen: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  modalContainer: {
    borderRadius: 16,
    width: '95%',
    alignItems: 'center',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  inputGroup: {
    width: '100%',
    borderRadius: 10,
    padding: 5,
    marginBottom: 20
  },
  singleInput: {
    width: '33%',
    borderRadius: 10,
    padding: 5
  },
  singleInputIPLine: {
    width: '30%',
    borderRadius: 10,
    padding: 5
  },
  singleInputIP: {
    width: '39%',
    borderRadius: 10,
    padding: 5
  },
  sectionText: {
    fontSize: 18,
    fontWeight: '600',
  },
  IPsectionText: {
    fontSize: 15,
  },
  label: {
    color: '#666',
    marginBottom: 4,
  },
});
