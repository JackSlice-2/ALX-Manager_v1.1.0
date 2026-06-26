import { useLanguage } from '@/contexts/LanguageContext';
import React, { useState } from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  ActivityIndicator
} from 'react-native';

type Props = {
  onChange?: (lang: 'pt-BR' | 'en-US') => void;
};

const LanguageToggle: React.FC<Props> = ({ onChange }) => {
  const { lang, setLang } = useLanguage();
  const [loading, setLoading] = useState(false);

  const toggleLanguage = () => {
    if (loading) return; // prevent spam clicks

    setLoading(true);

    setTimeout(() => {
      const newLang = lang === 'pt-BR' ? 'en-US' : 'pt-BR';
      setLang(newLang);
      onChange?.(newLang);
      setLoading(false);
    }, 1500);
  };

  const isPT = lang === 'pt-BR';

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={toggleLanguage}
      disabled={loading}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="small" />
        ) : (
          <View style={{flexDirection: 'column', alignItems: 'center'}}>
            <Text style={styles.flag}>
              {isPT ? '🇺🇸': '🇧🇷'}
            </Text>
            <Text style={styles.text}>
              {isPT ? 'EN-US' : 'PT-BR'}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default LanguageToggle;

const styles = StyleSheet.create({
  button: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start'
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minWidth: 70
  },
  flag: {
    fontSize: 16
  },
  text: {
    fontSize: 14,
    color: '#111827'
  }
});