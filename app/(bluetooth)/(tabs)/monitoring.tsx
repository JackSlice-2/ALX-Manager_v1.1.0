import React from 'react';
import { StyleSheet, View } from 'react-native';
import PageContainer from '../../../components/PageContainer';
import RobotoText from '../../../components/RobotoText';
import { useT } from '@/hooks/useT';

const WiFi = () => {

  const inAna = 1
  const inDig = 2
  const count = 3

  const t = useT()


  return (
    <PageContainer
      title={t.Monitoring.text0}
      image={require('@/assets/images/SVG/icons8-monitor-250.png')}
    >
      <View
        style={{
          flexDirection: 'row',
          gap: 20,
          width: '100%',
          backgroundColor: 'rgb(233, 234, 235)',
          padding: 10,
          borderRadius: 10,
          marginBottom: 20,
        }}
      >
        <View style={styles.inputGroupVariant}>
          <RobotoText style={styles.label}>
            {t.Monitoring.text1}
          </RobotoText>
          <RobotoText style={styles.label}>DI 1</RobotoText>
          <RobotoText style={styles.sectionText}>
            OFF
          </RobotoText>
        </View>

        <View style={styles.inputGroupVariant}>
          <RobotoText style={styles.label}></RobotoText>
          <RobotoText style={styles.label}>DI 2</RobotoText>
          <RobotoText style={styles.sectionText}>
            OFF
          </RobotoText>
        </View>
      </View>

      <View
        style={{
          flexDirection: 'row',
          gap: 20,
          width: '100%',
          backgroundColor: 'rgb(233, 234, 235)',
          padding: 10,
          borderTopRightRadius: 16,
          borderTopLeftRadius: 16,
        }}
      >
        <View style={styles.inputGroupVariant}>
          <RobotoText style={styles.topLabel}>Entrada Analógica AI 1</RobotoText>
          <RobotoText style={styles.label}></RobotoText>
          <RobotoText style={styles.sectionText}>
            Escala [V/maA]:
          </RobotoText>
          <RobotoText style={styles.label}></RobotoText>
          <RobotoText style={styles.sectionText}>
            Valor Digital [0-4095]:
          </RobotoText>
          <RobotoText style={styles.label}></RobotoText>
          <RobotoText style={styles.sectionText}>
            Valor Convertido:
          </RobotoText>
        </View>

        <View style={styles.inputGroupVariant}>
          <RobotoText style={styles.label}></RobotoText>
          <RobotoText style={styles.label}></RobotoText>
          <RobotoText style={styles.sectionText}>
            00.00 mA
          </RobotoText>
           <RobotoText style={styles.label}></RobotoText>
          <RobotoText style={styles.sectionText}>
            0
          </RobotoText>
           <RobotoText style={styles.label}></RobotoText>
          <RobotoText style={styles.sectionText}>
            0
          </RobotoText>
        </View>
      </View>

       <View
        style={{
          flexDirection: 'row',
          gap: 20,
          width: '100%',
          backgroundColor: 'rgb(233, 234, 235)',
          padding: 10,
          borderBottomLeftRadius: 16,
          borderBottomRightRadius: 16,
          marginBottom: 20,
        }}
      >
        <View style={styles.inputGroupVariant}>
          <RobotoText style={styles.topLabel}>Entrada Analógica AI 2</RobotoText>
          <RobotoText style={styles.label}></RobotoText>
          <RobotoText style={styles.sectionText}>
            Escala [V/maA]:
          </RobotoText>
          <RobotoText style={styles.label}></RobotoText>
          <RobotoText style={styles.sectionText}>
            Valor Digital [0-4095]:
          </RobotoText>
          <RobotoText style={styles.label}></RobotoText>
          <RobotoText style={styles.sectionText}>
            Valor Convertido:
          </RobotoText>
        </View>

        <View style={styles.inputGroupValue}>
          <RobotoText style={styles.label}></RobotoText>
          <RobotoText style={styles.label}></RobotoText>
          <RobotoText style={styles.sectionText}>
            00.00 V
          </RobotoText>
           <RobotoText style={styles.label}></RobotoText>
          <RobotoText style={styles.sectionText}>
            0
          </RobotoText>
           <RobotoText style={styles.label}></RobotoText>
          <RobotoText style={styles.sectionText}>
            0
          </RobotoText>
          
        </View>
      </View>

       <View
        style={{
          flexDirection: 'row',
          gap: 20,
          width: '100%',
          backgroundColor: 'rgb(233, 234, 235)',
          padding: 10,
          borderRadius: 16,
          marginBottom: 20,
        }}
      >
        <View style={styles.inputGroupVariant}>
          <RobotoText style={styles.label}>{t.Monitoring.text4}</RobotoText>
          <RobotoText style={styles.label}>{t.Monitoring.text5}</RobotoText>
          <RobotoText style={styles.sectionText}>
            0
          </RobotoText>
        </View>

        <View style={styles.inputGroupVariant}>
          <RobotoText style={styles.label}></RobotoText>
          <RobotoText style={styles.label}>{t.Monitoring.text6}</RobotoText>
          <RobotoText style={styles.sectionText}>
            0
          </RobotoText>
        </View>
      </View>

    </PageContainer>
  );
};

export default WiFi;

const styles = StyleSheet.create({
  inputGroupVariant: {
    marginBottom: 20,
    width: '55%',
    position: 'relative',
    borderRadius: 10,
    padding: 5,
  },
    inputGroupValue: {
    marginBottom: 20,
    width: '35%',
    position: 'relative',
    borderRadius: 10,
    padding: 5,
  },
  sectionText: {
    fontSize: 18,
    fontWeight: '600',
  },
  label: {
    color: '#666',
    marginBottom: 4,
  },
  topLabel: {
    color: '#141212',
    width: '170%',
    fontSize: 18,
    fontWeight: 900
  },
});