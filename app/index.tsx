import { router } from 'expo-router';
import { View, Text, TouchableOpacity } from 'react-native';

export default function Index() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 30 }}>
      
      <Text style={{ fontSize: 28, textAlign: 'center', marginBottom: 40 }}>
        Como deseja conectar?
      </Text>

      <TouchableOpacity
        onPress={() => router.push('/(wifi)')}
        style={{
          padding: 20,
          marginBottom: 20,
          borderRadius: 10,
          backgroundColor: '#eee',
        }}
      >
        <Text style={{ textAlign: 'center', fontSize: 20 }}>
          WiFi
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push('/(bluetooth)')}
        style={{
          padding: 20,
          borderRadius: 10,
          backgroundColor: '#eee',
        }}
      >
        <Text style={{ textAlign: 'center', fontSize: 20 }}>
          Bluetooth
        </Text>
      </TouchableOpacity>

    </View>
  );
}