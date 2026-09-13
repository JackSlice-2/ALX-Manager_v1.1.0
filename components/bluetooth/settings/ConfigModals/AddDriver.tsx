import useCheckDrivers from '@/hooks/useCheckDrivers';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import ModalContainer from '@/components/utils/modalParts/ModalContainer';
import SaveButton from '@/components/utils/modalParts/SaveButton';
import RobotoText from '@/components/RobotoText';
import { useT } from '@/hooks/useT';

export type Model = {
  name: string;
  file: string;
  rev: number;
};

export type DriverEntry = {
  modl: Model[];
  supp: string;
};

const Drivers = ({ onClose, visible }: any) => {
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>('');
  const [selectedModelFile, setSelectedModelFile] = useState<string>('');
  const [isSaveDisabled, setIsSaveDisabled] = useState(true); 
type Mode = keyof typeof REQUIRED_FIELDS_BY_MODE;

const [selectedOption, setSelectedOption] = useState<Mode>('RTU');
  const [ipAddress, setIpAddress] = useState('');
const [port, setPort] = useState('');
const [modbusAddress, setModbusAddress] = useState('');
const [timeout, setTimeout] = useState('');

const REQUIRED_FIELDS_BY_MODE = {
  RTU: ['selectedManufacturer', 'selectedModelFile', 'modbusAddress', 'timeout'],
  TCP: ['selectedManufacturer', 'selectedModelFile', 'ipAddress', 'port', 'timeout'],
  'RTU/TCP': [
    'selectedManufacturer',
    'selectedModelFile',
    'modbusAddress',
    'ipAddress',
    'port',
    'timeout',
  ],
} as const;


const formValues = {
  selectedManufacturer,
  selectedModelFile,
  ipAddress,
  port,
  modbusAddress,
  timeout,
};


const isFormValid = useMemo(() => {
  const requiredFields = REQUIRED_FIELDS_BY_MODE[selectedOption];

  return requiredFields.every((field: any) => {
    const value = formValues[field as keyof typeof formValues];
    return typeof value === 'string' && value.trim().length > 0;
  });
}, [
  selectedOption,
  selectedManufacturer,
  selectedModelFile,
  ipAddress,
  port,
  modbusAddress,
  timeout,
]);

useEffect(() => {
  setIsSaveDisabled(!isFormValid);
}, [isFormValid]);


const t = useT()

  const { drivers: liveDrivers } = useCheckDrivers() as { drivers: DriverEntry[] };

  const [drivers, setDrivers] = useState<DriverEntry[] | null>(null);

useEffect(() => {
  const loadCachedDrivers = async () => {
    try {
      const stored = await AsyncStorage.getItem("drivers_list");
      if (stored) {
        const { drivers: cachedDrivers } = JSON.parse(stored);
        console.log("🚀 Cached drivers:");
        setDrivers(cachedDrivers);
      } else {
        console.log("⚡ No cached drivers, using liveDrivers:");
        setDrivers(liveDrivers ?? []);
      }
    } catch (e) {
      console.warn("Failed to load cached drivers, using live data", e);
      setDrivers(liveDrivers ?? []);
    }
  };
  loadCachedDrivers();
}, [liveDrivers]);


  const selectedDriver = useMemo(() => {
    return drivers?.find(d => d.supp === selectedManufacturer);
  }, [drivers, selectedManufacturer]);

  const availableModels = selectedDriver?.modl || [];

  useEffect(() => {
    if (selectedManufacturer && availableModels.length > 0) {
      if (!selectedModelFile || !availableModels.some(m => m.file === selectedModelFile)) {
        setSelectedModelFile(availableModels[0].file);
      }
    } else if (availableModels.length === 0) {
      setSelectedModelFile('');
    }
  }, [selectedManufacturer, availableModels, selectedModelFile]);

    
  return (
       <ModalContainer
        visible={visible}
        onClose={onClose}
        data={"Drivers"}
      >     
            
 <View style={styles.inputGroup}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.optionButton,
              selectedOption === 'RTU' && styles.selectedButton,
            ]}
            onPress={() => setSelectedOption('RTU')}
          >
            <RobotoText style={styles.buttonText}>RTU</RobotoText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.optionButton,
              selectedOption === 'RTU/TCP' && styles.selectedButton,
            ]}
            onPress={() => setSelectedOption('RTU/TCP')}
            disabled
          >
            <RobotoText style={styles.buttonText}>RTU/TCP</RobotoText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.optionButton,
              selectedOption === 'TCP' && styles.selectedButton,
            ]}
            onPress={() => setSelectedOption('TCP')}
            disabled
          >
            <RobotoText style={styles.buttonText}>TCP</RobotoText>
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
            <RobotoText style={styles.inputLabel}>{t.DriverSettings.text9}</RobotoText>
            <View style={{ flexDirection: 'row', gap: 10 }}>
                <Picker
                    selectedValue={selectedManufacturer}
                    onValueChange={(itemValue: string) => {
                        setSelectedManufacturer(itemValue);
                    }}
                    style={[styles.input, styles.flexGrow, { color: '#333', padding: 0 }]}
                    dropdownIconColor="#333"
                >
                    <Picker.Item label={t.DriverSettings.text15} value="" />
                    {drivers?.map((driver) => (
                        <Picker.Item 
                            key={driver.supp} 
                            label={driver.supp} 
                            value={driver.supp} 
                        />
                    ))}
                </Picker>
            </View>
        </View>

        <View style={styles.inputGroup}>
            <RobotoText style={styles.inputLabel}>{t.DriverSettings.text10}</RobotoText>
            <View style={{ flexDirection: 'row', gap: 10 }}>
                <Picker
                    selectedValue={selectedModelFile}
                    onValueChange={(itemValue: string) => setSelectedModelFile(itemValue)}
                    enabled={!!selectedManufacturer && availableModels.length > 0} 
                    style={[styles.input, styles.flexGrow, { color: '#333', padding: 0 }]}
                    dropdownIconColor="#333"
                >
                    <Picker.Item label={t.DriverSettings.text11} value="" />

                    {availableModels.map((model) => (
                        <Picker.Item 
                            key={model.file} 
                            label={model.name} 
                            value={model.file}
                        />
                    ))}
                </Picker>
            </View>
        </View>
      
      
        <View style={styles.inputGroup}>
            <RobotoText style={styles.inputLabel}>{t.DriverSettings.text11}</RobotoText>
            <View style={{ flexDirection: 'row', gap: 10 }}>
                <TextInput
                    style={[styles.disabled, styles.flexGrow]}
                    value={ipAddress} 
                    onChangeText={setIpAddress}
                    placeholderTextColor="#cbd5e0"
                    editable={false} 
                />
            </View>
        </View>
      
        <View style={styles.inputGroup}>
            <RobotoText style={styles.inputLabel}>{t.DriverSettings.text12}</RobotoText>
            <View style={{ flexDirection: 'row', gap: 10 }}>
                <TextInput
                    style={[styles.disabled, styles.flexGrow]}
                    value={port} // Use a real state variable for Port
                    onChangeText={setPort}
                    placeholderTextColor="#cbd5e0"
                    editable={false} 
                />
            </View>
        </View>
      
        <View style={styles.inputGroup}>
            <RobotoText style={styles.inputLabel}>{t.DriverSettings.text13}</RobotoText>
            <View style={{ flexDirection: 'row', gap: 10 }}>
               <TextInput
  style={[styles.input, styles.flexGrow]}
  value={modbusAddress}
  onChangeText={setModbusAddress}
  placeholderTextColor="#cbd5e0"
  editable
/>

            </View>
        </View>
      
        <View style={styles.inputGroup}>
            <RobotoText style={styles.inputLabel}>{t.DriverSettings.text14}</RobotoText>
            <View style={{ flexDirection: 'row', gap: 10 }}>
               <TextInput
  style={[styles.input, styles.flexGrow]}
  value={timeout}
  onChangeText={setTimeout}
  placeholderTextColor="#cbd5e0"
  editable
/>

            </View>
        </View>
                
        <SaveButton isSaveDisabled={isSaveDisabled} />
    </View>

    </ModalContainer>
  );
};

export default Drivers;


const styles = StyleSheet.create({
    modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 16,
    padding: 5
  },
  optionButton: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  selectedButton: {
    backgroundColor: '#98caecff',
    borderColor: '#98caecff',
  },
  buttonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
  inputGroup: {
    width: '100%',
    position: 'relative',
    backgroundColor: '#f7f7f7ff',
    borderRadius: 10,
    padding: 5,
    marginTop: 10,
    marginBottom: 20,
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
     disabled: {
    backgroundColor: '#bebdbdff',
    fontWeight: 500,
      padding: 14,
    borderRadius: 8,
    color: '#333',
    minHeight: 50,
    borderWidth: 0,
    fontSize: 16,
  },
  flexGrow: {
    flex: 1,
  },

});
