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
          borderRadius: 16,
          marginBottom: 20,
        }}
      >
        <View style={styles.inputGroupVariant}>
          <RobotoText style={styles.label}>{t.Monitoring.text3}</RobotoText>
          <RobotoText style={styles.label}>AI 1</RobotoText>
          <RobotoText style={styles.sectionText}>
            00.00 mA
          </RobotoText>
        </View>

        <View style={styles.inputGroupVariant}>
          <RobotoText style={styles.label}></RobotoText>
          <RobotoText style={styles.label}>AI 2</RobotoText>
          <RobotoText style={styles.sectionText}>
            00.00 V
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
    width: '45%',
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
    color: '#666',
    marginBottom: 4,
    width: '130%'
  },
});