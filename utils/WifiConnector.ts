import { NativeModules } from "react-native";
const { WifiConnector } = NativeModules;

type WifiConnectorType = {
  openWifiPicker: () => Promise<boolean>;
  connect: (ssid: string, password?: string) => Promise<boolean>;
  suggestNetwork: (ssid: string, password?: string, isWpa2?: boolean) => Promise<boolean>;
  removeSuggestions: () => Promise<boolean>;
  clearBinding: () => Promise<boolean>;
};

const impl: Partial<WifiConnectorType> = WifiConnector ?? {};

export default {
  openWifiPicker: () => (impl.openWifiPicker ? impl.openWifiPicker() : Promise.reject("MODULE_NOT_AVAILABLE")),
  connectToNetwork: (ssid: string, password?: string) =>
    impl.connect ? impl.connect(ssid, password ?? "") : Promise.reject("MODULE_NOT_AVAILABLE"),
  suggestNetwork: (ssid: string, password?: string, isWpa2 = true) =>
    impl.suggestNetwork ? impl.suggestNetwork(ssid, password ?? "", isWpa2) : Promise.reject("MODULE_NOT_AVAILABLE"),
  removeSuggestions: () =>
    impl.removeSuggestions ? impl.removeSuggestions() : Promise.reject("MODULE_NOT_AVAILABLE"),
  clearBinding: () =>
    impl.clearBinding ? impl.clearBinding() : Promise.reject("MODULE_NOT_AVAILABLE"),
};
