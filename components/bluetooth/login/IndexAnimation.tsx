import { Animated, Dimensions, Easing, Image, StyleSheet, Text, TouchableOpacity } from "react-native"
import RobotoText from "../../RobotoText"
import { useEffect, useRef } from "react";
import { useT } from "@/hooks/useT";
import { router } from "expo-router";

const { width, height } = Dimensions.get('window');
const logoSize = width * 0.85;

interface IndexAnimationProps {
    openNetworkModal: () => void;
    openQRScanner: () => void;
    openManualConnect: () => void;
    openBluetoothConnect: () => void;
  }

const IndexAnimation: React.FC<IndexAnimationProps> = ({
    openQRScanner,
    openNetworkModal,
    openManualConnect,
    openBluetoothConnect
  }) => {
  const t = useT();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const buttonTranslateY = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 100, useNativeDriver: true }).start(() => {
        Animated.timing(buttonTranslateY, { toValue: 0, duration: 500, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
      });
    }, 250);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Image source={require('@/assets/images/Logo_v101.png')} style={{ width: logoSize, height: logoSize, marginBottom: -60 }} resizeMode="contain" />
      </Animated.View>
            <RobotoText style={{color:'grey', fontSize: 26, position: 'absolute', marginBottom: 46, fontWeight: '400'}}>Versão 1.1.0</RobotoText>

      <Animated.View style={[styles.buttonRow, { transform: [{ translateY: buttonTranslateY }] }]}>
        <TouchableOpacity style={styles.button} onPress={openQRScanner}>
          <Image source={require('@/assets/images/qrcode.png')} style={{ width: 80, height: 80, alignSelf: 'center' }} />
          <RobotoText style={styles.buttonText}>
            {t.Login.connectQR}
          </RobotoText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => router.push('/(bluetooth)/(tabs)/status')}>
          <Image source={require('@/assets/images/Bluetooth.png')} style={{ width: 97, height: 70, alignSelf: 'center', marginBottom: 10 }} />
          <RobotoText style={styles.buttonText}>
            {t.Login.connectBluetooth}
          </RobotoText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={openBluetoothConnect}>
          <Image source={require('@/assets/images/Senha.png')} style={{ width: 70, height: 70, alignSelf: 'center', marginBottom: 10 }} />
          <RobotoText style={styles.buttonText}>
            {t.Login.connectPassword}
          </RobotoText>
        </TouchableOpacity>
      </Animated.View>
    </>
  )
}
export default IndexAnimation

const styles = StyleSheet.create({
  buttonRow: { 
    flexDirection: 'row' 
},
  button: {
    paddingVertical: 16,
    borderRadius: 9999,
    marginHorizontal: 8,
  },
  buttonText: {
    fontWeight: 'semibold',
    width: 128,
    textAlign: 'center',
    color: '#000',
    fontSize: 18,
    letterSpacing: 0.5,
  },
});
