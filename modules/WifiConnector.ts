import { NativeModules, Platform } from "react-native";

// Log 1: Check if the NativeModules object is available/loaded
console.log(`🔌 [NATIVE] Attempting to load WifiConnector module. Platform: ${Platform.OS}`);

// This name must match the name in the Native Module's `getName()` method.
// In our Kotlin file, it is "WifiConnector".
const { WifiConnector } = NativeModules; 

type WifiConnectorType = {
  // openWifiPicker will launch the Android Settings Panel for Wi-Fi (API 29+ action)
  openWifiPicker: () => Promise<boolean>; 
  // connect is a placeholder for your existing logic, but we won't use it for the picker
  connect: (ssid: string, password?: string) => Promise<boolean>;
};

// Log 2: Check if the specific Native Module was found
const impl: Partial<WifiConnectorType> = WifiConnector ?? {};
if (WifiConnector) {
    console.log('✅ [NATIVE] WifiConnector module found in NativeModules.');
} else {
    console.warn('❌ [NATIVE] WifiConnector module NOT found. Native connectivity may fail.');
}

const connector = {
  openWifiPicker: (): Promise<boolean> => {
    console.log('🚀 [PICKER] openWifiPicker called.');
    if (Platform.OS !== 'android') {
      console.log('⚠️ [PICKER] Platform is not Android. Skipping native picker.');
      // On iOS, we just open general settings as there is no public API 
      // for an in-app Wi-Fi picker like Android's.
      return Promise.resolve(false); 
    }
    
    if (impl.openWifiPicker) {
        console.log('🔗 [PICKER] Calling Android native method: openWifiPicker()...');
        return impl.openWifiPicker(); 
    } else {
        console.error('❌ [PICKER] Native method openWifiPicker not found on Android module.');
        return Promise.reject("WIFI_CONNECTOR_MODULE_NOT_AVAILABLE");
    }
  },
  
  // Keep your existing connectToNetwork function wrapper.
  connectToNetwork: (ssid: string, password?: string): Promise<boolean> => {
    console.log(`🔗 [CONNECT] connectToNetwork called for SSID: ${ssid}`);
    if (impl.connect) {
        console.log('🔗 [CONNECT] Calling native method: connect()...');
        return impl.connect(ssid, password ?? "");
    } else {
        console.error('❌ [CONNECT] Native method connect not found.');
        return Promise.reject("MODULE_NOT_AVAILABLE");
    }
  },

};

export default connector;