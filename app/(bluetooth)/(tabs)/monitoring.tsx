import React from 'react';
import { StyleSheet, View } from 'react-native';
import PageContainer from '../../../components/PageContainer';
import RobotoText from '../../../components/RobotoText';
import useGetInfo from '@/utils/getEvery5Seconds';
import LoaderOverlay from '@/components/LoaderOverlay';
import { useT } from '@/hooks/useT';

const WiFi = () => {

  const ios = useGetInfo('/req_info_ios').info
  const inAna = ios.in_ana
  const inDig = ios.in_dig
  const outDig = ios.out_dig
  const count = ios.count
  const freq = ios.freq

  const t = useT()

  if (!ios || !inAna || !inDig || !outDig || !count || !freq) {
    return <LoaderOverlay visible message={t.System.LoadingData} />
  }

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
            {inDig?.estados?.[0] ? 'ON' : 'OFF'}
          </RobotoText>
        </View>

        <View style={styles.inputGroupVariant}>
          <RobotoText style={styles.label}></RobotoText>
          <RobotoText style={styles.label}>DI 2</RobotoText>
          <RobotoText style={styles.sectionText}>
            {inDig?.estados?.[1] ? 'ON' : 'OFF'}
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
          <RobotoText style={styles.label}>{t.Monitoring.text2}</RobotoText>
          <RobotoText style={styles.label}>DO 1</RobotoText>
          <RobotoText style={styles.sectionText}>
            {outDig?.estados?.[0] ? 'ON' : 'OFF'}
          </RobotoText>
        </View>

        <View style={styles.inputGroupVariant}>
          <RobotoText style={styles.label}></RobotoText>
          <RobotoText style={styles.label}>DO 2</RobotoText>
          <RobotoText style={styles.sectionText}>
            {outDig?.estados?.[1] ? 'ON' : 'OFF'}
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
            {inAna.valor?.[0] || '-'}
          </RobotoText>
        </View>

        <View style={styles.inputGroupVariant}>
          <RobotoText style={styles.label}></RobotoText>
          <RobotoText style={styles.label}>AI 2</RobotoText>
          <RobotoText style={styles.sectionText}>
            {inAna.valor?.[1] || '-'}
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
            {count.value[0]}
          </RobotoText>
        </View>

        <View style={styles.inputGroupVariant}>
          <RobotoText style={styles.label}></RobotoText>
          <RobotoText style={styles.label}>{t.Monitoring.text6}</RobotoText>
          <RobotoText style={styles.sectionText}>
            {count.value[1]}
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
          <RobotoText style={styles.topLabel}>{t.Monitoring.text7}</RobotoText>
          <RobotoText style={styles.label}>{t.Monitoring.text8}</RobotoText>
          <RobotoText style={styles.sectionText}>
            {freq.value[0]}
          </RobotoText>
        </View>

        <View style={styles.inputGroupVariant}>
          <RobotoText style={styles.label}></RobotoText>
          <RobotoText style={styles.label}>{t.Monitoring.text9}</RobotoText>
          <RobotoText style={styles.sectionText}>
            {freq.value[1]}
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