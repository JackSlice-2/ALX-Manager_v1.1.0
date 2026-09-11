import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Tabs } from 'expo-router';
import React from 'react';
import { Image } from 'react-native';
import Header from '../../../components/Header';
import { HapticTab } from '../../../components/haptic-tab';
import { Colors } from '../../../constants/theme';
import { useT } from '@/hooks/useT';

export default function TabLayout() {
  const t = useT();

  const tabBarLabelStyle = {
    fontFamily: 'roboto-condensed',
    fontSize: 14,
    color: 'black',
  };

  return (
    <ThemeProvider value={DefaultTheme}>
      <Header
        titleTextColor='black'
        subTitleTextColor='#7a7676ff'
      />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors['light'].tint,
          tabBarInactiveTintColor: 'black',
          headerShown: false,
          tabBarLabelStyle: tabBarLabelStyle,
          tabBarStyle: {
            backgroundColor: 'rgb(233, 234, 235)',
            borderTopWidth: 0,
          },
          tabBarButton: HapticTab,
        }}
      >
        <Tabs.Screen
          name="disconnect"
          options={{
            title: t.Tabs.disconnect,
            tabBarIcon: ({ color }) => (
              <Image
                source={require('@/assets/images/SVG/icons8-qr-code-250.png')}
                style={{ width: 28, height: 28, tintColor: color }}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="status"
          options={{
            title: t.Tabs.status,
            tabBarIcon: ({ color }) => (
              <Image
                source={require('@/assets/images/SVG/icons8-info-250.png')}
                style={{ width: 28, height: 28, tintColor: color }}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: t.Tabs.settings,
            tabBarIcon: ({ color }) => (
              <Image
                source={require('@/assets/images/SVG/icons8-tools-250.png')}
                style={{ width: 28, height: 28, tintColor: color }}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="monitoring"
          options={{
            title: t.Tabs.monitoring,
            tabBarIcon: ({ color }) => (
              <Image
                source={require('@/assets/images/SVG/icons8-monitor-250.png')}
                style={{ width: 28, height: 28, tintColor: color }}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="support"
          options={{
            title: t.Tabs.support,
            tabBarIcon: ({ color }) => (
              <Image
                source={require('@/assets/images/SVG/icons8-support-250.png')}
                style={{ width: 28, height: 28, tintColor: color }}
              />
            ),
          }}
        />
      </Tabs>
    </ThemeProvider>
  );
}
