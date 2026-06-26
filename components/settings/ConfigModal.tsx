import { Ionicons } from '@expo/vector-icons';
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
import RobotoText from '../RobotoText';
import { handleSave } from '../utils/constants';
import { ConfigField, ConfigModalProps, ConfigSection } from '../utils/types';

const ConfigModal: React.FC<ConfigModalProps> = ({
  visible,
  title,
  status,
  fields,
  sections,
  onClose,
  onSave,
  image,
  children,
  onConnect,
  disableSaveUntilFilled = false,
}) => {
  const [localFields, setLocalFields] = useState<ConfigField[]>(fields || []);
  const [localSections, setLocalSections] = useState<ConfigSection[]>(sections || []);
  const [showPassword, setShowPassword] = useState(false);
  const [hour, setHour] = useState('12');
  const [minute, setMinute] = useState('00'); 

  const isFormComplete = () => {
  const fieldsToCheck = localFields.concat(localSections.flatMap(section => section.fields));

  return fieldsToCheck.every(field => field.value.trim() !== '');
};

  const updateFieldValue = (sectionIndex: number, fieldIndex: number, newValue: string) => {
    const updatedSections = [...localSections];
    updatedSections[sectionIndex].fields[fieldIndex].value = newValue;
    setLocalSections(updatedSections);
  };

  const updateFlatFieldValue = (index: number, newValue: string) => {
    const updated = [...localFields];
    updated[index].value = newValue;
    setLocalFields(updated);
  };

  const renderField = (
    field: ConfigField,
    index: number,
    sectionIndex?: number
  ) => {
    const onChange = (val: string) => {
      if (typeof sectionIndex === 'number') {
        updateFieldValue(sectionIndex, index, val);
      } else {
        updateFlatFieldValue(index, val);
      }
    };


if (field.type === 'time') {

  const onHourChange = (text: string) => {
    // Ensure the hour is valid (1-12)
    if (/^[0-9]*$/.test(text)) {
      setHour(text);
    }
  };

  const onMinuteChange = (text: string) => {
    // Ensure the minute is valid (00-59)
    if (/^[0-9]*$/.test(text)) {
      setMinute(text);
    }
  };

  return (
    <View key={index} style={styles.inputGroup}>
      <RobotoText style={styles.label}>{field.label}</RobotoText>
      <View style={styles.timeInputGroup}>
        {/* Hour input */}
        <TextInput
          style={styles.timeInput}
          value={hour}
          onChangeText={onHourChange}
          keyboardType="numeric"
          maxLength={2}
        />
        <RobotoText style={styles.separator}>:</RobotoText>

        {/* Minute input */}
        <TextInput
          style={styles.timeInput}
          value={minute}
          onChangeText={onMinuteChange}
          keyboardType="numeric"
          maxLength={2}
        />


        <View style={{justifyContent: 'flex-end', alignItems:'flex-end', marginLeft: 'auto'}}>
      {field.trailingComponent}
      </View>

      </View>
    </View>
  );
}




if (field.type === 'password') {
  return (
    <View key={index} style={styles.inputGroup}>
      <RobotoText style={styles.label}>{field.label}</RobotoText>
      <View style={styles.inputWithTrailing}>
        <TextInput
          style={[
            styles.input,
            field.bold && styles.bold,
            field.editable === false && styles.disabled,
            styles.flexGrow,
          ]}
          secureTextEntry={!showPassword} // Toggle secureTextEntry based on showPassword
          value={field.value}
          editable={field.editable !== false}
          placeholder={field.placeholder || ''}
          onChangeText={onChange}
        />
        {field.trailingComponent &&
        <TouchableOpacity
          onPress={() => setShowPassword((prev) => !prev)} // Toggle password visibility
          style={styles.trailing}
        >
          <Ionicons
            name={showPassword ? 'eye-off' : 'eye'} // Change icon based on state
            size={20}
            color="#007ACC"
          />
        </TouchableOpacity>
        }
      </View>
    </View>
  );
}

if (field.type === 'dropdown') {
  return (
    <View key={index} style={styles.inputGroup}>
      <RobotoText style={styles.label}>{field.label}</RobotoText>
      <View style={styles.inputWithTrailing}>
        <View style={[styles.pickerWrapper, styles.flexGrow]}>
          <Picker
            selectedValue={field.value}
            onValueChange={(itemValue) => onChange(itemValue)}
            enabled={field.editable !== false}
            style={styles.picker}
            dropdownIconColor="#333"
          >
            {field.options?.map((opt) => (
              <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
            ))}
          </Picker>
        </View>
        {field.trailingComponent && (
          <View style={styles.trailing}>{field.trailingComponent}</View>
        )}
      </View>
    </View>
  );
}

if (field.type === 'radio') {
  return (
    <View key={index} style={styles.inputGroup}>
      <RobotoText style={styles.label}>{field.label}</RobotoText>
      <View style={styles.toggleGroupRow}>
        {field.options?.map((option) => {
          const selected = field.value === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.toggleLikeRadio,
                selected ? styles.toggleLikeRadioSelected : styles.toggleLikeRadioUnselected
              ]}
              onPress={() => onChange(option.value)}
              disabled={field.editable === false}
            >
              <RobotoText style={styles.toggleLikeRadioText}>
                {option.label}
              </RobotoText>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}


  if (field.type === 'toggle') {
      const enabledText = field.enabledText || 'Habilitado';  // Default if not provided
      const disabledText = field.disabledText || 'Desabilitado'; // Default if not provided

      return (
        <View key={index} style={styles.toggleItem}>
          {field.label &&
          <RobotoText style={styles.label}>{field.label}</RobotoText>
          }
          <View style={styles.toggleRow}>
            <RobotoText style={styles.toggleText}>
              {field.value === 'true' ? enabledText : disabledText}
            </RobotoText>
            <Switch
              value={field.value === 'true'}
              onValueChange={(val) => onChange(val ? 'true' : 'false')}
            />
          </View>
        </View>
      );
    }

    if (field.type === 'information') {
      return (
                <View key={index} style={styles.inputGroup}>
              <RobotoText style={styles.label}>{field.label}</RobotoText>
      <View style={styles.inputWithTrailing}>
          <TextInput
            style={[
              field.bold && styles.bold,
              styles.information,
              styles.flexGrow,
            ]}
            secureTextEntry={field.secureTextEntry}
            value={field.value}
            editable={field.editable !== false}
            onChangeText={onChange}
          />
          {field.trailingComponent && (
            <View style={styles.trailing}>{field.trailingComponent}</View>
          )}
        </View>
      </View>
      )
    }

    if (field.isButton) {
      return (
        <TouchableOpacity
          key={index}
          onPress={field.onPress}
          style={[styles.buttonField]}
        >
          <RobotoText
            style={[styles.buttonFieldText, field.bold && styles.bold]}
          >
            {field.value}
          </RobotoText>
        </TouchableOpacity>
      );
    }

    return (
      <View key={index} style={styles.inputGroup}>
              <RobotoText style={styles.label}>{field.label}</RobotoText>
      <View style={styles.inputWithTrailing}>
          <TextInput
            style={[
              styles.input,
              field.bold && styles.bold,
              field.editable === false && styles.disabled,
              styles.flexGrow,
            ]}
            secureTextEntry={field.secureTextEntry}
            value={field.value}
            editable={field.editable !== false}
            onChangeText={onChange}
          />
          {field.trailingComponent && (
            <View style={styles.trailing}>{field.trailingComponent}</View>
          )}
        </View>
      </View>
    );
  };

  const renderFieldsGroup = (
    fields: ConfigField[],
    sectionIndex?: number
  ) => {
    const elements: React.ReactNode[] = [];

    let i = 0;
    while (i < fields.length) {
      const field = fields[i];

      if (field.type === 'toggle') {
        const toggleGroup: ConfigField[] = [];
        let j = i;
        while (j < fields.length && fields[j].type === 'toggle') {
          toggleGroup.push(fields[j]);
          j++;
        }

        if (toggleGroup.length > 1) {
          elements.push(
            <View key={`toggle-group-${i}`} style={styles.toggleGroupRow}>
              {toggleGroup.map((toggleField, idx) =>
                renderField(toggleField, i + idx, sectionIndex)
              )}
            </View>
          );
          i = j;
          continue;
        }
      }

      elements.push(renderField(field, i, sectionIndex));
      i++;
    }

    return elements;
  };

  const renderContent = () => {
    if (sections && sections.length) {
      return localSections.map((section, sectionIndex) => (
        <View key={section.id} style={styles.section}>
          <View style={styles.sectionHeader}>
            {title &&
            <View style={styles.sectionTitle}>
              {section.icon && <View style={styles.icon}>{section.icon}</View>}
              <RobotoText style={styles.sectionText}>{section.title}</RobotoText>
            </View>
    }
            {section.mode && (
              <TouchableOpacity
                style={styles.modeToggle}
                onPress={() =>
                  section.onToggleMode?.(
                    section.mode === '' ? '' : ''
                  )
                }
              >
                <RobotoText style={styles.modeText}>{section.mode}</RobotoText>
              </TouchableOpacity>
            )}
          </View>
          {renderFieldsGroup(section.fields, sectionIndex)}
        </View>
      ));
    }

    return renderFieldsGroup(localFields);
  };

// Determine whether to disable the Save button
const isSaveDisabled = disableSaveUntilFilled && !isFormComplete();


    return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.headerRow}>
            {image && <Image source={image} style={styles.headerImage} />}
            <RobotoText style={styles.header}>{title}</RobotoText>
          </View>

          {status && (
            <RobotoText style={styles.status}>
              Conectado: {status}
            </RobotoText>
          )}

          <ScrollView showsVerticalScrollIndicator={false}>
            {children} 
            {renderContent()}
          </ScrollView>
          <View style={styles.buttonRow}>
{onClose &&

            <TouchableOpacity onPress={onClose} style={styles.backButton}>
              <Ionicons name="arrow-back" size={20} color="white" />
              <RobotoText style={styles.buttonText}>Voltar</RobotoText>
            </TouchableOpacity>
}
{onSave && (
<TouchableOpacity
  onPress={handleSave}
  style={[styles.saveButton, isSaveDisabled && styles.saveButtonDisabled]} // Apply disabled style
  disabled={isSaveDisabled}  // Disable the button
>
  <RobotoText style={styles.buttonText}>Salvar</RobotoText>
</TouchableOpacity>

)}

{onConnect &&

            <TouchableOpacity onPress={onClose} style={styles.connectButton}>
              <RobotoText style={styles.buttonText}>Connectar</RobotoText>
            </TouchableOpacity>
}
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ConfigModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    padding: '5%',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 10,
    maxHeight: '90%',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 14,
    textAlign: 'center',
  },
  status: {
    marginBottom: 5,
    marginLeft: 'auto'
    },
  bold: {
    fontWeight: 'bold',
  },
  inputGroup: {
    marginBottom: 14,
  },
    timeInputGroup: {
    marginBottom: 14,
    flexDirection: 'row',
  },
  label: {
    color: '#666',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#f0f0f0',
    padding: 14,
    borderRadius: 8,
    color: '#333',
  },
   timeInput: {
    backgroundColor: '#f0f0f0',
    padding: 14,
    borderRadius: 8,
    color: '#333',
    width: 150,
    marginRight: 8
  },
  disabled: {
    backgroundColor: '#bebdbdff',
    color: '#000000ff',
    fontWeight: 500
  },
    information: {
    color: '#000000ff',
    fontWeight: 500
  },
  inputWithTrailing: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trailing: {
    marginLeft: 10,
  },
  flexGrow: {
    flex: 1,
  },
  toggleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
  },
  toggleText: {
    color: '#333',
  },

  toggleButton: {
    backgroundColor: '#007ACC',
    padding: 8,
    borderRadius: 8,
    marginLeft: 10,
  },
    toggleTimeButton: {
    backgroundColor: '#86bde2ff',
    paddingHorizontal: 10,
    borderRadius: 8,
    marginLeft: 10,
    textAlign: 'center',
    justifyContent: 'center'
  },

  separator: {
    fontSize: 18,
    color: '#333',
    marginHorizontal: 8,
  },
  toggleGroupRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  toggleItem: {
    flex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  backButton: {
    flexDirection: 'row',
    backgroundColor: '#007ACC',
    padding: 12,
    borderRadius: 8,
  },
    connectButton: {
    flexDirection: 'row',
    backgroundColor: '#007ACC',
    padding: 12,
    borderRadius: 8,
    width: '80%',
    justifyContent: 'center',
    alignSelf: 'center'
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#007ACC',
    padding: 12,
    borderRadius: 8,
  },
  buttonField: {
    backgroundColor: '#007ACC',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 25,
    width: '80%',
    margin: 10,
    alignSelf: 'center'
  },
  buttonFieldText: {
    color: 'white',
    fontWeight: 'bold',
    paddingVertical: 5,
    textAlign: 'center'
  },
  buttonText: {
    color: 'white',
    marginLeft: 6,
    fontSize: 18,
    fontWeight: 500,
  },
  // Section styles
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  icon: {
    marginRight: 8,
  },
  modeToggle: {
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 6,
    backgroundColor: '#e0e0e0',
  },
  modeText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 15
  },
  pickerWrapper: {
  backgroundColor: '#f0f0f0',
  borderRadius: 8,
  overflow: 'hidden',
},
picker: {
  color: '#333',
  height: 55,
  width: '100%',
},
radioGroup: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  marginTop: 8,
  justifyContent: 'space-around'
},
radioOption: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 10,
  paddingHorizontal: 14,
  backgroundColor: '#f0f0f0',
  borderRadius: 8,
},
radioCircle: {
  width: 16,
  height: 16,
  borderRadius: 8,
  borderWidth: 2,
  borderColor: '#007ACC',
  marginRight: 8,
  backgroundColor: 'white',
},
radioSelected: {
  backgroundColor: '#007ACC',
},
saveButtonDisabled: {
    backgroundColor: '#bebdbd', // Grayed-out disabled state
  },
radioLabel: {
  color: '#333',
  fontSize: 14,
  fontWeight: '500'
},
toggleLikeRadio: {
  flex: 1,
  paddingVertical: 10,
  paddingHorizontal: 12,
  borderRadius: 8,
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: 8,
},

toggleLikeRadioSelected: {
  backgroundColor: '#007ACC',
},

toggleLikeRadioUnselected: {
  backgroundColor: '#f0f0f0',
},

toggleLikeRadioText: {
  color: 'white',
  fontWeight: 'bold',
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

});
