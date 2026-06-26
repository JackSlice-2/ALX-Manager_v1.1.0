import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import ModalContainer from '../../../components/utils/modalParts/ModalContainer';
import RobotoText from '../../RobotoText';
import AddDriver, { DriverEntry } from './AddDriver';
import useCheckDrivers from '@/hooks/useCheckDrivers';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useT } from '@/hooks/useT';

interface DriversProps {
  onClose: () => void
  drivers: any
}

const Drivers: React.FC<DriversProps> = ({ onClose, drivers: raw }) => {
  const [showAddDriverModal, setShowAddDriverModal] = useState(false);
  const { drivers: liveDrivers } = useCheckDrivers() as { drivers: DriverEntry[] };
  const [drivers, setDrivers] = useState<DriverEntry[] | null>(null);
  const driversList = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const t = useT()
  useEffect(() => {
    const loadCachedDrivers = async () => {
      try {
        const stored = await AsyncStorage.getItem("drivers_list");
        if (stored) {
          const { drivers: cachedDrivers } = JSON.parse(stored);
          console.log("🚀 Using cached drivers:", cachedDrivers);
          setDrivers(cachedDrivers);
        } else if (liveDrivers?.length) {
          console.log("⚡ No cache found, using live drivers:", liveDrivers);
          setDrivers(liveDrivers);
        } else {
          console.log("❌ No cached or live drivers available.");
          setDrivers([]);
        }
      } catch (e) {
        console.warn("Failed to load cache, falling back to live drivers", e);
        setDrivers(liveDrivers ?? []);
      }
    };

    loadCachedDrivers();
  }, [liveDrivers]);

  const handleAddDriverModal = () => {
    setShowAddDriverModal(!showAddDriverModal)
  }
  
     if (driversList.length === 0) {
    return (
      <>
      <ModalContainer 
      visible 
      onClose={onClose} 
      title={t.SettingsOptions.Drivers}
      image={require('../../../assets/images/Drivers.png')} 
      headerButton onPress={handleAddDriverModal} 
      data={'Drivers'}
      >
        <View style={{ width: '100%', padding: 20, alignItems: 'center' }}>
          <RobotoText style={{ fontSize: 18, textAlign: 'center' }}>{t.DriverSettings.text0}</RobotoText>
        </View>
      </ModalContainer>
          <AddDriver 
      onClose={handleAddDriverModal}
      visible={showAddDriverModal}
      />
      </>
    );
  }

  return (
    <>
       <ModalContainer
        visible
        onClose={onClose} 
        title={t.SettingsOptions.Drivers}
        image={require('../../../assets/images/Drivers.png')} 
        headerButton={drivers ? true : false}
        onPress={handleAddDriverModal}
        data={raw}
      >
        <View
            style={{
              width: '100%',
              borderRadius: 10,
              marginBottom: 10,
              marginTop: 10
            }}
          >
            {driversList.map((driver: any, index: number) => (
              <View
                key={index}
                style={{
                  width: '100%',
                  backgroundColor: 'rgb(233, 234, 235)',
                  borderRadius: 10,
                  marginBottom: 10,
                  marginTop: 10,
                  padding: 10
                }}
              >

                <View style={[styles.inputGroup, { flexDirection: 'row' }]}>
                  <View style={[styles.singleInput,{width: '70%'}]}>
                    <RobotoText style={styles.label}>{t.DriverSettings.text1}</RobotoText>
                    <RobotoText style={styles.sectionText}>{driver.driver}</RobotoText>
                  </View>

                  <View style={styles.singleInputIP}>
                    <RobotoText style={styles.label}>{t.DriverSettings.text2}</RobotoText>
                    <RobotoText style={styles.sectionText}>{driver.rev}</RobotoText>
                  </View>

                  <View style={styles.singleInputIPLine}>
                  </View>
                </View>

                {/* Row 2 */}
                <View style={[styles.inputGroup, { flexDirection: 'row' }]}>
                  <View style={styles.singleInput}>
                    <RobotoText style={styles.label}>{t.DriverSettings.text3}</RobotoText>
                    <RobotoText style={styles.sectionText}>
                  {driver.rtu === true && "RTU"}
                  {driver.tcp  === true && driver.rtu === true && "/"}
                  {driver.tcp === true && "TCP"}
                  </RobotoText>                                 
                  </View>

                  <View style={styles.singleInputIP}>
                <RobotoText style={styles.label}>{t.DriverSettings.text4}</RobotoText>
                <RobotoText style={styles.IPsectionText}>{driver.ip || '-'}</RobotoText>
              </View>

              <View style={styles.singleInputIPLine}>
                <RobotoText style={styles.label}>{t.DriverSettings.text5}</RobotoText>
                <RobotoText style={styles.sectionText}>{driver.port}</RobotoText>
              </View>
            </View>

            <View style={[styles.inputGroup, { flexDirection: 'row' }]}>
              <View style={styles.singleInput}>
                <RobotoText style={styles.label}>{t.DriverSettings.text6}</RobotoText>
                <RobotoText style={styles.sectionText}>{driver.end}</RobotoText>
              </View>

              <View style={styles.singleInputIP}>
                <RobotoText style={styles.label}>{t.DriverSettings.text7}</RobotoText>
                <RobotoText style={styles.sectionText}>{driver.tmout}</RobotoText>
              </View>

                  <View style={styles.singleInputIPLine}>
                    <RobotoText style={styles.label}>{t.DriverSettings.text8}</RobotoText>
                    <RobotoText style={styles.sectionText}>{driver.erro}</RobotoText>
                  </View>
                </View>
              </View>
            ))}
          </View>
      </ModalContainer>
      <AddDriver 
      onClose={handleAddDriverModal}
      visible={showAddDriverModal}
      />
      </>
  );
};

export default Drivers;

const styles = StyleSheet.create({

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
  singleInputIPLine: {
    width: '27%',
    position: 'relative',
    borderRadius: 10,
    padding: 5
  },
  singleInputIP: {
    width: '39%',
    position: 'relative',
    borderRadius: 10,
    padding: 5
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
    IPsectionText: {
    fontSize: 15,
  },
  label: {
    color: '#666',
    marginBottom: 4,
  },
});
