import { Animated, Dimensions, Easing, Image, StyleSheet, TouchableOpacity, View } from "react-native"
import { useEffect, useRef } from "react";
import { useT } from "@/hooks/useT";
import { router } from "expo-router";
import LanguageToggle from "@/components/login/LanguageToggle";
import RobotoText from "@/components/RobotoText";

const { width, height } = Dimensions.get('window');
const logoSize = width * 0.85;


const IndexAnimation = () => {

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
      <View>
        <View style={{position: 'absolute', top: 40, right: 20, zIndex: 10,}}>
          <LanguageToggle
            onChange={(lang) => {
            console.log('Language changed to:', lang);
            }}
          />
        </View>
        <View style={{ position: 'absolute', top: 50, left: 20, zIndex: 10 }}></View>
      </View>
      <View style={styles.container}>
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Image source={require('@/assets/images/Logo_v101.png')} style={{ width: logoSize, height: logoSize, marginBottom: -60 }} resizeMode="contain" />
          </Animated.View>
          <RobotoText style={{color:'grey', fontSize: 26, position: 'absolute', marginBottom: 20, fontWeight: '400'}}>
            Versão 1.1.0
          </RobotoText>

          <Animated.View style={[styles.buttonRow, { transform: [{ translateY: buttonTranslateY }] }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 20 }}>
              <TouchableOpacity style={styles.button} onPress={() => router.push('/(wifi)')}>
                <Image source={require('@/assets/images/ALX-4x.png')} style={{ width: 120, height: 80, alignSelf: 'center', marginBottom: 10 }} />
                <RobotoText style={styles.buttonText}>
                  {t.Index.Alx4x}
                </RobotoText>
              </TouchableOpacity>
        
              <TouchableOpacity style={styles.button} onPress={() => router.push('/(bluetooth)')}>
                <Image source={require('@/assets/images/ALX-5x.png')} style={{ width: 120, height: 80, alignSelf: 'center', marginBottom: 10 }} />
                <RobotoText style={styles.buttonText}>
                  {t.Index.Alx5x}
                </RobotoText>
              </TouchableOpacity>
            </View>
          </Animated.View>
      </View>
    </>
  )
}
export default IndexAnimation

const styles = StyleSheet.create({
  buttonRow: { 
    flexDirection: 'row' 
},
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: 'rgb(250, 251, 252)',
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
