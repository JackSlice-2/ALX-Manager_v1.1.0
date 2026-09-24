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

interface AlarmConfigsProps {
  onClose: () => void;
  mobileData: MobileInfo;
  mobileConfigData: MobileConfigData;
}

interface FormValues {
  // Alarme Entrada Analógica 1
  analogica1_hab: boolean;
  analogica1_limiteInferior: string;
  analogica1_limiteSuperior: string;

  // Alarme Entrada Analógica 2
  analogica2_hab: boolean;
  analogica2_limiteInferior: string;
  analogica2_limiteSuperior: string;

  // Alarme Entrada Digital 1
  digital1_hab: boolean;
  digital1_interromperHibernacao: boolean;
  digital1_statusAlarme: boolean;

  // Alarme Entrada Digital 2
  digital2_hab: boolean;
  digital2_interromperHibernacao: boolean;
  digital2_statusAlarme: boolean;
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

const AlarmConfigs: React.FC<AlarmConfigsProps> = ({
  onClose,
  mobileData,
  mobileConfigData,
}) => {
  const t = useT();

  const [sendPayload, setSendPayload] = useState<any>(null);

  const [form, setForm] = useState<FormValues>({
    // Alarme Entrada Analógica 1
    analogica1_hab: false,
    analogica1_limiteInferior: '',
    analogica1_limiteSuperior: '',

    // Alarme Entrada Analógica 2
    analogica2_hab: false,
    analogica2_limiteInferior: '',
    analogica2_limiteSuperior: '',

    // Alarme Entrada Digital 1
    digital1_hab: false,
    digital1_interromperHibernacao: false,
    digital1_statusAlarme: false,

    // Alarme Entrada Digital 2
    digital2_hab: false,
    digital2_interromperHibernacao: false,
    digital2_statusAlarme: false,
  });

  const hasInitialized = useRef(false);

  const sections: FormSection[] = [
    {
      id: 'entrada-alarme-a1',
      title: 'Alarme Entrada Analógica 1',

      fields: [
        {
          id: 'alarme-a1-hab',
          type: 'switch',
          key: 'analogica1_hab',
          title: 'Habilitar',
        },
        {
          id: 'alarme-a1-limite-inferior',
          type: 'input',
          key: 'analogica1_limiteInferior',
          title: t.DataRegistrySettings.text2,
        },
        {
          id: 'alarme-a1-limite-superior',
          type: 'input',
          key: 'analogica1_limiteSuperior',
          title: t.DataRegistrySettings.text3,
        },
      ],

      subsections: [],
    },

    {
      id: 'entrada-alarme-a2',
      title: 'Alarme Entrada Analógica 2',

      fields: [
        {
          id: 'alarme-a2-hab',
          type: 'switch',
          key: 'analogica2_hab',
          title: 'Habilitar',
        },
        {
          id: 'alarme-a2-limite-inferior',
          type: 'input',
          key: 'analogica2_limiteInferior',
          title: t.DataRegistrySettings.text2,
        },
        {
          id: 'alarme-a2-limite-superior',
          type: 'input',
          key: 'analogica2_limiteSuperior',
          title: t.DataRegistrySettings.text3,
        },
      ],

      subsections: [],
    },

    {
      id: 'entrada-alarme-d1',
      title: 'Alarme Entrada Digital 1',

      fields: [
        {
          id: 'alarme-d1-hab',
          type: 'switch',
          key: 'digital1_hab',
          title: 'Habilitar',
        },
        {
          id: 'alarme-d1-interromper-hibernacao',
          type: 'switch',
          key: 'digital1_interromperHibernacao',
          title: 'Interromper Hibernação',
        },
        {
          id: 'alarme-d1-status-alarme',
          type: 'switch',
          key: 'digital1_statusAlarme',
          title: 'Status para Alarme [ON/OFF]',
        },
      ],

      subsections: [],
    },

    {
      id: 'entrada-alarme-d2',
      title: 'Alarme Entrada Digital 2',

      fields: [
        {
          id: 'alarme-d2-hab',
          type: 'switch',
          key: 'digital2_hab',
          title: 'Habilitar',
        },
        {
          id: 'alarme-d2-interromper-hibernacao',
          type: 'switch',
          key: 'digital2_interromperHibernacao',
          title: 'Interromper Hibernação',
        },
        {
          id: 'alarme-d2-status-alarme',
          type: 'switch',
          key: 'digital2_statusAlarme',
          title: 'Status para Alarme [ON/OFF]',
        },
      ],

      subsections: [],
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

      // Alarme Entrada Analógica 1
      analogica1_hab: Boolean(
        config.analogica1_hab ?? false
      ),
      analogica1_limiteInferior: '',
      analogica1_limiteSuperior: '',

      // Alarme Entrada Analógica 2
      analogica2_hab: Boolean(
        config.analogica2_hab ?? false
      ),
      analogica2_limiteInferior: '',
      analogica2_limiteSuperior: '',

      // Alarme Entrada Digital 1
      digital1_hab: Boolean(
        config.digital1_hab ?? false
      ),
      digital1_interromperHibernacao: Boolean(
        config.digital1_interromperHibernacao ?? false
      ),
      digital1_statusAlarme: Boolean(
        config.digital1_statusAlarme ?? false
      ),

      // Alarme Entrada Digital 2
      digital2_hab: Boolean(
        config.digital2_hab ?? false
      ),
      digital2_interromperHibernacao: Boolean(
        config.digital2_interromperHibernacao ?? false
      ),
      digital2_statusAlarme: Boolean(
        config.digital2_statusAlarme ?? false
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
          value={String(form[field.key] ?? '')}
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

  const renderSubsection = (
    subsection: FormSubsection
  ) => {
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

export default AlarmConfigs;

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