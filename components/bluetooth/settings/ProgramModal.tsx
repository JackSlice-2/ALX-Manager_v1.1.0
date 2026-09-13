import { Picker } from '@react-native-picker/picker';
import React, { useState } from 'react';
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import RobotoText from '@/components/RobotoText';
import { handleSave, screenWidth } from '@/components/utils/constants';
import { ProgramModelProps } from '@/components/utils/types';

const ProgramModel: React.FC<ProgramModelProps> = ({ visible, onClose }) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isRegEnabled, setIsRegEnabled] = useState(false);

  const [selectedEntradaDI1, setSelectedEntradaDI1] = useState('Desabilitada');
  const [selectedEntradaDI2, setSelectedEntradaDI2] = useState('Desabilitada');
  const [selectedEntradaAI1, setSelectedEntradaAI1] = useState('Desabilitada');
  const [selectedEntradaAI2, setSelectedEntradaAI2] = useState('Desabilitada');

  const [entradaDI1, setEntradaDI1] = useState('');
  const [entradaDI2, setEntradaDI2] = useState('');
  const [entradaAI1, setEntradaAI1] = useState('');
  const [entradaAI2, setEntradaAI2] = useState('');

  const regEnabledText = 'Habilitado';
  const pubEnabledText = 'Habilitado';
  const regDisabledText = 'Desabilitado';
  const pubDisabledText = 'Desabilitado';

const isEntradaDI1Disabled = selectedEntradaDI1 === 'Desabilitada' || selectedEntradaDI1 === 'Transição';
const isEntradaDI2Disabled = selectedEntradaDI2 === 'Desabilitada' || selectedEntradaDI2 === 'Transição';
const isEntradaAI1Disabled = selectedEntradaAI1 === 'Desabilitada';
const isEntradaAI2Disabled = selectedEntradaAI2 === 'Desabilitada';

  const toggleSwitch = () => setIsEnabled((previousState) => !previousState);
  const toggleSwitchReg = () => setIsRegEnabled((previousState) => !previousState);
  const [selectedAnalogInput, setSelectedAnalogInput] = useState('entrada1');

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ScrollView>
             <View style={styles.headerRow}>
                            <Image source={require('@/components/@/components/assets/images/ios.png')} style={styles.headerImage} />
                          <RobotoText style={styles.title}>IO´s</RobotoText>
                                    </View>
            <View style={styles.section}>
              <RobotoText style={styles.analogButtonText}>Entradas Analógicas</RobotoText>
              <RobotoText style={styles.sectionTitle}>Entradas Analógicas</RobotoText>

              <View style={styles.inputGroup}>
                <RobotoText style={styles.pickerLabel}>AI 1</RobotoText>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={selectedAnalogInput}
                    onValueChange={(itemValue) => setSelectedAnalogInput(itemValue)}
                    style={styles.picker}
                    dropdownIconColor="#333"
                  >
                    <Picker.Item label="4-20 mA" value="entrada1" />
                    <Picker.Item label="0-10 V" value="entrada2" />
                  </Picker>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <RobotoText style={styles.pickerLabel}>AI 2</RobotoText>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={selectedAnalogInput}
                    onValueChange={(itemValue) => setSelectedAnalogInput(itemValue)}
                    style={styles.picker}
                    dropdownIconColor="#333"
                  >
                    <Picker.Item label="4-20 mA" value="entrada1" />
                    <Picker.Item label="0-10 V" value="entrada2" />
                  </Picker>
                </View>
              </View>
            </View>

            {/* Registro de dados */}
            <View style={styles.switchRow}>
              <Image source={require('@/components/@/components/assets/images/MemoryData.png')} style={styles.icon} />
              <RobotoText style={styles.label}>Registro de dados</RobotoText>
            </View>
            <View style={styles.toggleRow}>
              <RobotoText style={styles.toggleText}>
                {isRegEnabled ? regEnabledText : regDisabledText}
              </RobotoText>
              <Switch value={isRegEnabled} onValueChange={toggleSwitchReg} />
            </View>

            {/* MQTT Switch */}
            <View style={styles.switchRow}>
              <Image source={require('@/components/@/components/assets/images/Cloud.png')} style={styles.icon} />
              <RobotoText style={styles.label}>Publicação MQTT</RobotoText>
            </View>
            <View style={styles.toggleRow}>
              <RobotoText style={styles.toggleText}>
                {isEnabled ? pubEnabledText : pubDisabledText}
              </RobotoText>
              <Switch value={isEnabled} onValueChange={toggleSwitch} />
            </View>

            {/* Publicação por tempo */}
          <View style={styles.inputRow}>
  <RobotoText style={styles.periodicidadeLabel}>Periodicidade</RobotoText>
  <TextInput
    style={isEnabled ? styles.periodicidadeInput : styles.periodicidadeDisabled} // Apply disabled style when MQTT is disabled
    value="30"
    keyboardType="numeric"
    editable={isEnabled} // Disable editing when MQTT is disabled
  />
  <RobotoText>segundos</RobotoText>
</View>


            <View style={styles.groupPicker}>
              <View style={{ flex: 1, width: '100%' }}>
                <RobotoText style={styles.pickerLabel}>Entrada DI 1</RobotoText>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={selectedEntradaDI1}
                    onValueChange={(itemValue) => {
                      setSelectedEntradaDI1(itemValue);
                      if (itemValue === 'Desabilitada') setEntradaDI1('');
                    }}
                    style={styles.secondPicker}
                    dropdownIconColor="#333"
                  >
                    <Picker.Item label="Desabilitada" value="Desabilitada" />
                    <Picker.Item label="Frequência <=" value="Frequência<=" />
                    <Picker.Item label="Frequência >=" value="Frequência>=" />
                    <Picker.Item label="Pulsos" value="Pulsos" />
                    <Picker.Item label="Transição" value="Transição" />
                  </Picker>
                </View>
              </View>
              {/* Entrada DI 2 */}
              
              <View style={{ flex: 1, width: '100%' }}>
                <RobotoText style={styles.pickerLabel}>Entrada DI 2</RobotoText>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={selectedEntradaDI2}
                    onValueChange={(itemValue) => {
                      setSelectedEntradaDI2(itemValue);
                      if (itemValue === 'Desabilitada') setEntradaDI2('');
                    }}
                    style={styles.secondPicker}
                    dropdownIconColor="#333"
                  >
                    <Picker.Item label="Desabilitada" value="Desabilitada" />
                    <Picker.Item label="Frequência <=" value="Frequência<=" />
                    <Picker.Item label="Frequência >=" value="Frequência>=" />
                    <Picker.Item label="Pulsos" value="Pulsos" />
                    <Picker.Item label="Transição" value="Transição" />
                  </Picker>
                </View>
              </View>
            </View>

              <View style={{ flex: 1, width: '100%', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <TextInput
                style={isEntradaDI1Disabled ? styles.disabled : styles.input}
                onChangeText={(text) => setEntradaDI1(text)}
                editable={!isEntradaDI1Disabled}
                placeholder={isEntradaDI1Disabled ? '' : ''}
                value={entradaDI1}
              />
              <TextInput
                style={isEntradaDI2Disabled ? styles.disabled : styles.input}
                onChangeText={(text) => setEntradaDI2(text)}
                editable={!isEntradaDI2Disabled}
                placeholder={isEntradaDI2Disabled ? '' : ''}
                value={entradaDI2}
              />
            </View>

            <View style={styles.groupPicker}>
              {/* Entrada AI 1 */}
              <View style={{ flex: 1, width: '100%' }}>
                <RobotoText style={styles.pickerLabel}>Entrada AI 1</RobotoText>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={selectedEntradaAI1}
                    onValueChange={(itemValue) => {
                      setSelectedEntradaAI1(itemValue);
                      if (itemValue === 'Desabilitada') setEntradaAI1('');
                    }}
                    style={styles.secondPicker}
                    dropdownIconColor="#333"
                  >
                    <Picker.Item label="Desabilitada" value="Desabilitada" />
                    <Picker.Item label="Valor <=" value="Frequência<=" />
                    <Picker.Item label="Valor >=" value="Frequência>=" />
                  </Picker>
                </View>
              </View>
              {/* Entrada AI 2 */}
              <View style={{ flex: 1, width: '100%' }}>
                <RobotoText style={styles.pickerLabel}>Entrada AI 2</RobotoText>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={selectedEntradaAI2}
                    onValueChange={(itemValue) => {
                      setSelectedEntradaAI2(itemValue);
                      if (itemValue === 'Desabilitada') setEntradaAI2('');
                    }}
                    style={styles.secondPicker}
                    dropdownIconColor="#333"
                  >
                    <Picker.Item label="Desabilitada" value="Desabilitada" />
                    <Picker.Item label="Valor <=" value="Frequência<=" />
                    <Picker.Item label="Valor >=" value="Frequência>=" />
                  </Picker>
                </View>
              </View>
            </View>

              <View style={{ flex: 1, width: '100%', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <TextInput
                style={isEntradaAI1Disabled ? styles.disabled : styles.input}
                onChangeText={(text) => setEntradaAI1(text)}
                editable={!isEntradaAI1Disabled}
                keyboardType="numeric"
                placeholder={isEntradaAI1Disabled ? '' : ''}
                value={entradaAI1}
              />
              <TextInput
                style={isEntradaAI2Disabled ? styles.disabled : styles.input}
                onChangeText={(text) => setEntradaAI2(text)}
                editable={!isEntradaAI2Disabled}
                keyboardType="numeric"
                placeholder={isEntradaAI2Disabled ? '' : ''}
                value={entradaAI2}
              />
            </View>
          </ScrollView>

          {/* Footer Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} style={styles.footerButton}>
              <RobotoText style={styles.buttonText}>Voltar</RobotoText>
            </TouchableOpacity>
            <TouchableOpacity
  onPress={handleSave}
  style={styles.saveButton}
>
  <RobotoText style={styles.buttonText}>Salvar</RobotoText>
</TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ProgramModel;


const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '90%',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 10,
    flexWrap: 'wrap', // To allow for wrapping on smaller screens
  },
  icon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  groupPicker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginVertical: 6,
    flexWrap: 'wrap', // To allow for wrapping on smaller screens
  },
  sectionTitle: {
    fontSize: screenWidth > 360 ? 16 : 14,
    fontWeight: 'bold',
    color: '#222',
  },
  label: {
    fontSize: screenWidth > 360 ? 14 : 12,
    color: '#333',
    flex: 1,
  },
  periodicidadeLabel: {
    fontSize: screenWidth > 360 ? 14 : 12,
    color: '#333',
    flex: 1,
    textAlign: 'right'
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 6,
    flexWrap: 'wrap', 
    flex: 1
  },
  switchRow: {
    gap: 10,
    flexDirection: 'row',
    marginVertical: 6,
    marginHorizontal: 10,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#f4f4f4',
    minWidth: 90,
    alignItems: 'center',
  },
  periodicidadeInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingVertical: 14,
    marginHorizontal: 3.5,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    minWidth: 80,
    textAlign: 'center',
    fontSize: 16,
    height: '100%',
    width: screenWidth > 360 ? 120 : 250,
    color: 'black'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingVertical: 14,
    marginHorizontal: 3.5,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    minWidth: 80,
    textAlign: 'center',
    fontSize: 16,
    height: '100%',
    width: '48%',
    color: 'black'
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 20,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007ACC',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },

  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#007ACC',
    padding: 12,
    borderRadius: 8,
  },
  footerIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
    tintColor: '#fff',
  },
  buttonText: {
    color: 'white',
    marginLeft: 6,
    fontSize: 18,
    fontWeight: 500,
  },
  inputGroup: {
    marginTop: 12,
    paddingHorizontal: 5,
  },
  pickerLabel: {
    fontSize: screenWidth > 360 ? 14 : 12,
    color: '#333',
    marginBottom: 6,
  },
  pickerWrapper: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    overflow: 'hidden',
    width: '100%'
  },
  picker: {
    height: 60,
    width: '100%',
    color: '#000',
  },
  secondPicker: {
    height: 60,
    width: '100%', // Responsive width for smaller screens
    color: '#000',
  },
  analogButton: {
    backgroundColor: '#007ACC',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'center',
  },
  analogButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: screenWidth > 360 ? 14 : 12, // Adjust font size for responsiveness
  },
  table: {
    width: '100%',
    paddingHorizontal: 16,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ccc',
  },
  tableLabel: {
    fontSize: screenWidth > 360 ? 14 : 12,
    color: '#333',
  },
  tableValue: {
    fontSize: screenWidth > 360 ? 14 : 12,
    fontWeight: 'bold',
    color: '#000',
  },
  section: {
    width: '100%',
    marginVertical: 8,
    flex: 1,
  },
    toggleItem: {
    flex: 1,
    marginBottom: 14,
  },
  toggleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
    marginBottom: 7
  },
  toggleText: {
    color: '#333',
  },
  periodicidadeDisabled: {
    backgroundColor: '#bebdbdff',
    color: '#918f8fff',
    fontWeight: 500,
    borderWidth: 1,
    borderColor: '#979595ff',
    borderRadius: 6,
    paddingVertical: 14,
    marginHorizontal: 3.5,
    paddingHorizontal: 16,
    minWidth: 80,
    textAlign: 'center',
    fontSize: 16,
    height: '100%',
    width: screenWidth > 360 ? 120 : 250,
  },

  disabled: {
    backgroundColor: '#bebdbdff',
    color: '#918f8fff',
    fontWeight: 500,
    borderWidth: 1,
    borderColor: '#979595ff',
    borderRadius: 6,
    paddingVertical: 14,
    marginHorizontal: 3.5,
    paddingHorizontal: 16,
    minWidth: 80,
    textAlign: 'center',
    fontSize: 16,
    height: '100%',
    width: '48%'
  },

    headerRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 14,
},
headerImage: {
  width: 70,
  height: 70,
  resizeMode: 'contain',
  marginRight: 2,
  marginBottom: 6
},
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
});
