import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as Font from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, View } from 'react-native';
import Loader from '../components/Loader';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { StatusBar } from 'expo-status-bar';

export const unstable_settings = {
  anchor: 'index',
};

const fetchFonts = () => {
  return Font.loadAsync({
    'roboto-condensed': require('@/assets/fonts/static/RobotoCondensed-Regular.ttf'),
    'roboto-condensed-bold': require('@/assets/fonts/static/RobotoCondensed-Bold.ttf'),
  });
};

export default function RootLayout() {
  const [fontLoaded, setFontLoaded] = useState(false);
  const [redirecting, setRedirecting] = useState(true);

  useEffect(() => {
    const prepare = async () => {
      await new Promise(resolve => setTimeout(resolve, 2000));

      SplashScreen.hideAsync();
      setRedirecting(false);
    };

    prepare();
  }, []);

  useEffect(() => {
    if (!redirecting) {
      const timeout = setTimeout(() => {
      }, 100); 

      return () => clearTimeout(timeout);
    }
  }, [redirecting]);


  useEffect(() => {
    fetchFonts()
      .then(() => setFontLoaded(true))
      .catch((err) => console.error(err));
  }, []);

  if (!fontLoaded) {
    return (
      <Loader/>
    )
  }

  if (redirecting) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white'}}>
        <Image
          source={require('@/assets/images/splash-icon.png')}
          style={{
            width: '80%',
            height: '100%',
            position: 'absolute',
            justifyContent: 'center',
            alignSelf: 'center',
          }}
          resizeMode='contain'
        />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <LanguageProvider>
        <ThemeProvider value={DefaultTheme}>
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(wifi)/index" options={{ headerShown: false }} />
              <Stack.Screen name="(bluetooth)/index" options={{ headerShown: false }} />
          </Stack>
        </ThemeProvider>
      </LanguageProvider>
    </>
  );
}