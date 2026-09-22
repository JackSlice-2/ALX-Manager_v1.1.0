import PostSender from '@/hooks/PostSender';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';

import RobotoText from '@/components/RobotoText';
import LoaderOverlay from '@/components/LoaderOverlay';

import { MobileConfigData, MobileInfo } from '@/components/utils/types';
import { useT } from '@/hooks/useT';

interface AlarmOperationProps {
  onClose: () => void;
  mobileData: MobileInfo;
  mobileConfigData: MobileConfigData;
}

interface FormValues {
  cel_hab: boolean;
  cel_apn: string;
  cel_user: string;
  cel_senha: string;

  memoria_hab: boolean;
  memoria_parametro1: boolean;
  memoria_parametro2: boolean;
  memoria_parametro3: boolean;
  memoria_parametro4: boolean;

  broker_hab: boolean;
  broker_parametro1: boolean;
  broker_parametro2: boolean;
  broker_parametro3: boolean;
  broker_parametro4: boolean;
}

type SwitchField = {
  id: string;
  type: 'switch';
  key: keyof FormValues;
  title: string;
};

type InputField = {
  id: string;
  type: 'input';
  key: keyof FormValues;
  title: string;
  placeholder?: string;
  secureTextEntry?: boolean;
};

type FormField = SwitchField | InputField;

interface FormSubsection {
  id: string;
  title: string;
  fields: FormField[];
}

interface FormSection {
  id: string;
  title: string;
  fields: FormField[];
  subsections: FormSubsection[];
}

const AlarmOperation: React.FC<AlarmOperationProps> = ({
  onClose,
  mobileData,
  mobileConfigData,
}) => {
  const t = useT();

  const [sendPayload, setSendPayload] = useState<any>(null);

  const [form, setForm] = useState<FormValues>({
    cel_hab: false,
    cel_apn: '',
    cel_user: '',
    cel_senha: '',

    memoria_hab: false,
    memoria_parametro1: false,
    memoria_parametro2: false,
    memoria_parametro3: false,
    memoria_parametro4: false,

    broker_hab: false,
    broker_parametro1: false,
    broker_parametro2: false,
    broker_parametro3: false,
    broker_parametro4: false,
  });

  const hasInitialized = useRef(false);

  const sections: FormSection[] = [
   
    {
      id: 'operacao-alarme',
      title: 'Operação em Alarme',
      fields: [
        {
          id: 'alarme-cel-hab',
          type: 'switch',
          key: 'cel_hab',
          title: 'Habilitar Alarme',
        },
        {
          id: 'alarme-cel-apn1',
          type: 'input',
          key: 'cel_apn',
          title: t.DataRegistrySettings.text0,
          placeholder: 'APN',
        },
      ],
      subsections: [
        {
          id: 'alarme-memoria',
          title: 'Registro em Memória',
          fields: [
            {
              id: 'alarme-memoria-hab',
              type: 'switch',
              key: 'memoria_hab',
              title: 'Habilitar registro',
            },
            {
              id: 'alarme-cel-user',
              type: 'input',
              key: 'cel_user',
              title: t.DataRegistrySettings.text1,
              placeholder: 'Usuário',
            },
            {
              id: 'alarme-memoria-parametro1',
              type: 'switch',
              key: 'memoria_parametro1',
              title: 'Registrar Entradas Analógicas',
            },
            {
              id: 'alarme-memoria-parametro2',
              type: 'switch',
              key: 'memoria_parametro2',
              title: 'Registrar Entradas Digitais',
            },
            {
              id: 'alarme-memoria-parametro3',
              type: 'switch',
              key: 'memoria_parametro3',
              title: 'Registrar Rede i2C',
            },
            {
              id: 'alarme-memoria-parametro4',
              type: 'switch',
              key: 'memoria_parametro4',
              title: 'Registrar Drivers MODBUS',
            },
          ],
        },
        {
          id: 'alarme-broker',
          title: 'Publicação no Broker',
          fields: [
            {
              id: 'alarme-broker-hab',
              type: 'switch',
              key: 'broker_hab',
              title: 'Habilitar publicação',
            },
            {
              id: 'alarme-broker-user',
              type: 'input',
              key: 'cel_user',
              title: t.DataRegistrySettings.text1,
              placeholder: 'Usuário',
            },
            {
              id: 'alarme-broker-parametro1',
              type: 'switch',
              key: 'memoria_parametro1',
              title: 'Registrar Entradas Analógicas',
            },
            {
              id: 'alarme-broker-parametro2',
              type: 'switch',
              key: 'memoria_parametro2',
              title: 'Registrar Entradas Digitais',
            },
            {
              id: 'alarme-broker-parametro3',
              type: 'switch',
              key: 'memoria_parametro3',
              title: 'Registrar Rede i2C',
            },
            {
              id: 'alarme-broker-parametro4',
              type: 'switch',
              key: 'memoria_parametro4',
              title: 'Registrar Drivers MODBUS',
            },
          ],
        },
      ],
    },
     
  ];

  useEffect(() => {
    if (hasInitialized.current) return;

    if (
      !mobileConfigData ||
      Object.keys(mobileConfigData).length === 0
    ) {
      return;
    }

    if (
      !mobileData ||
      Object.keys(mobileData).length === 0
    ) {
      return;
    }

    const config = mobileConfigData as any;

    setForm((previous) => ({
      ...previous,
      cel_hab: Boolean(config.cel_hab),
      cel_apn: config.cel_apn ?? '',
      cel_user: config.cel_user ?? '',
      cel_senha: config.cel_senha ?? '',

      memoria_hab: Boolean(config.memoria_hab ?? false),
      memoria_parametro1: Boolean(
        config.memoria_parametro1 ?? false
      ),
      memoria_parametro2: Boolean(
        config.memoria_parametro2 ?? false
      ),
      memoria_parametro3: Boolean(
        config.memoria_parametro3 ?? false
      ),
      memoria_parametro4: Boolean(
        config.memoria_parametro4 ?? false
      ),

      broker_hab: Boolean(config.broker_hab ?? false),
      broker_parametro1: Boolean(
        config.broker_parametro1 ?? false
      ),
      broker_parametro2: Boolean(
        config.broker_parametro2 ?? false
      ),
      broker_parametro3: Boolean(
        config.broker_parametro3 ?? false
      ),
      broker_parametro4: Boolean(
        config.broker_parametro4 ?? false
      ),
    }));

    const fullData = {
      ...mobileData,
      ...mobileConfigData,
    };

    console.log('Full Mobile Data:', fullData);

    hasInitialized.current =
      Object.keys(fullData).length > 0;
  }, [mobileConfigData, mobileData]);

  const updateField = <K extends keyof FormValues>(
    key: K,
    value: FormValues[K]
  ) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  };


  const renderField = (field: FormField) => {
    if (field.type === 'switch') {
      const value = form[field.key];

      return (
        <View
          style={styles.toggleItem}
          key={field.id}
        >
          <View style={styles.toggleRow}>
            <Switch
              thumbColor={
                Boolean(value)
                  ? 'rgba(163, 188, 216, 0.6)'
                  : 'rgba(200, 200, 200, 0.5)'
              }
              trackColor={{
                false: 'rgba(200, 200, 200, 0.5)',
                true: 'rgba(32, 62, 107, 0.66)',
              }}
              value={Boolean(value)}
              onValueChange={(newValue) =>
                updateField(
                  field.key,
                  newValue as FormValues[typeof field.key]
                )
              }
            />

            <RobotoText style={styles.toggleLabel}>
              {field.title}
            </RobotoText>
          </View>
        </View>
      );
    }


    return (
      <View
        style={styles.inputGroup}
        key={field.id}
      >
        <RobotoText style={styles.inputLabel}>
          {field.title}
        </RobotoText>

        <TextInput
          style={[styles.input, styles.flexGrow]}
          value={String('')}
          placeholder={field.placeholder}
          secureTextEntry={field.secureTextEntry}
          onChangeText={(newValue) =>
            updateField(
              field.key,
              newValue as FormValues[typeof field.key]
            )
          }
        />
      </View>
    );
  };

  const renderSubsection = (subsection: FormSubsection) => {
    return (
      <View key={subsection.id}>
        <View style={styles.subsectionContainer}>
          <RobotoText style={styles.subsectionText}>
            {subsection.title}
          </RobotoText>
        </View>

        {subsection.fields.map(renderField)}
      </View>
    );
  };

  return (
<>
      {sendPayload && (
        <View style={styles.loaderContainer}>
          <LoaderOverlay visible={Boolean(sendPayload)} />
        </View>
      )}

      {sendPayload && (
        <PostSender
          endpoint="/req_config_celular"
          payload={sendPayload}
          onSuccess={() => {
            Alert.alert(
              'Sucesso',
              'Dados salvos corretamente no gateway'
            );

            setSendPayload(null);
            onClose();
          }}
          onError={(err) => {
            Alert.alert(
              'Falha',
              'Não foi possível salvar os dados no gateway'
            );

            console.log(
              'Error saving configuration:',
              err
            );

            setSendPayload(null);
          }}
        />
      )}

      <View style={styles.container}>
        {sections.map((section) => (
          <View key={section.id}>
            <View style={styles.sectionContainer}>
              <RobotoText style={styles.sectionText}>
                {section.title}
              </RobotoText>
            </View>

            {section.fields.map(renderField)}

            {section.subsections.map(renderSubsection)}
          </View>
        ))}

      </View>
      </>
  );
};

export default AlarmOperation;

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },

  sectionContainer: {
    width: '100%',
    backgroundColor: '#f7f7f7',
    borderRadius: 10,
    padding: 8,
    marginBottom: 15,
  },

  subsectionContainer: {
    width: '100%',
    backgroundColor: '#eeeeee',
    borderRadius: 10,
    padding: 8,
    marginTop: 5,
    marginBottom: 15,
  },

  inputGroup: {
    width: '100%',
    position: 'relative',
    backgroundColor: '#f7f7f7',
    borderRadius: 10,
    padding: 5,
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

  flexGrow: {
    flex: 1,
  },

  sectionText: {
    fontSize: 20,
    fontWeight: '600',
  },

  subsectionText: {
    fontSize: 18,
    fontWeight: '600',
  },

  toggleItem: {
    width: '100%',
    padding: 8,
    marginBottom: 10,
  },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },

  toggleLabel: {
    color: '#333',
    marginLeft: 5,
  },

  loaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
});