

export type ConfigField = {
  label?: string;
  value: string;
  placeholder?: string;
  editable?: boolean;
  bold?: boolean;
  isButton?: boolean;
  onPress?: () => void;
  type?: 'text' | 'toggle' | 'button' | 'password' | 'dropdown' | 'radio' | 'time' | 'information';
  trailingComponent?: React.ReactNode;
  secureTextEntry?: boolean;
  options?: { label: string; value: string }[];

  enabledText?: string; 
  disabledText?: string;
};

export type ConfigSection = {
  id: string;
  title?: string;
  icon?: React.ReactNode;
  mode?: string;
  onToggleMode?: (mode: string) => void;
  fields: ConfigField[];
};

export type ConfigModalProps = {
  visible: boolean;
  title: string;
  status?: string;
  image?: any; // ✅ Add this line (can be a local image source or a URI)
  fields?: ConfigField[];
  sections?: ConfigSection[];
  onClose?: () => void;
  onSave?: (data: ConfigField[] | ConfigSection[]) => void;
    children?: React.ReactNode;
    onConnect?: any
    disableSaveUntilFilled?: boolean;
    
};

export type IOsModalProps = {
  visible: boolean;
  onClose: () => void;
};




type DriverRow = {
  driver: string;
  versao: string;
  id: string;
  comunicacao: string;
  ip?: string;
  porta?: string;
  endereco: string;
  timeout: string;
  status: string;
  editar?: string;
  apagar?: string;
};
  export const baseData: DriverRow[] = [
    {
      driver: 'GC315',
      versao: '2',
      id: '2',
      comunicacao: 'RTU',
      ip: '',
      porta: '',
      endereco: '1',
      timeout: '1000',
      status: '200 🟢',
    },
    {
      driver: 'CG315',
      versao: '5',
      id: '5',
      comunicacao: 'RTU over TCP',
      ip: '192.168.10.18',
      porta: '502',
      endereco: '',
      timeout: '1000',
      status: '53 🟡',
    },
  ];
  
  // Fill up to 10 rows
  export const filledData: DriverRow[] = [
    ...baseData,
    ...Array.from({ length: 10 - baseData.length }).map(() => ({
      driver: '',
      versao: '',
      id: '',
      comunicacao: '',
      ip: '',
      porta: '',
      endereco: '',
      timeout: '',
      status: '',
    })),
  ];
  

  export type ProgramModelProps = {
    visible: boolean;
    onClose: () => void;
  };
  
  export interface ComunicationDriverConfigField {
    label?: string;
    value: string;
    placeholder?: string;
    editable?: boolean;
    type?: 'text' | 'dropdown';
    options?: { label: string; value: string }[];
  }
  
  export interface AddDriverModalProps {
    visible: boolean;
    onClose: () => void;
    onSave?: (data: ConfigField[]) => void;
  }
  


  // Define the structure for a WiFi network item
  export type NetworkItem = {
      id: number;
      name: string;
      signalStrength: React.ReactNode;
  };
  
// Convert RSSI (dBm) to signal level (0–5 bars)
export const rssiToLevel = (rssi: number): number => {
  if (rssi >= -49) return 5;     // Excellent
  if (rssi >= -59) return 4;     // Very good
  if (rssi >= -69) return 3;     // Good
  if (rssi >= -79) return 2;     // Fair
  if (rssi >= -100) return 1;    // Weak

  return 0; // -101 to -115 → No signal
};


export interface RenderModalsProps {
  selectedOption: string | null;
  setSelectedOption: (option: string | null) => void;

  wifi: WifiData;
  refreshWifi: () => void;

  mobileData: MobileInfo;
  gpsData: GPSData;
  datalogger: DataloggerData;

  mqttData: MQTTData;
  drivers: Driver[];

  serialData: SerialInfo;
  iosData: IOSData;
  commandsData: CommandsData;
  iosPubData: IOSPubData;
  mobileConfigData: MobileConfigData
  mqttConfigData: MqttConfigData
}

export interface RenderBluetoothModalsProps {
  selectedOption: string | null;
  setSelectedOption: (option: string | null) => void;

  RTC: MQTTData;
  RTCConfig: MqttConfigData;

  RegisterData: MobileInfo;
  RegisterConfigData: MobileConfigData;

  mobileData: MobileInfo;
  gpsData: GPSData;
  datalogger: DataloggerData;

  mqttData: MQTTData;
  drivers: Driver[];

  serialData: SerialInfo;
  iosData: IOSData;
  commandsData: CommandsData;
  iosPubData: IOSPubData;
  mobileConfigData: MobileConfigData
  mqttConfigData: MqttConfigData

  I2c: Driver[];
  General: Driver[];
}

export interface MqttConfigData {
  "hab_mqtt": boolean, 
  "host_mqtt": string, 
  "porta_mqtt": number, 
  "qos": number, 
  "retain": number, 
  "senha_mqtt": string, 
  "topico_pub": string, 
  "topico_sub": string, 
  "usuario_mqtt": string
}

export interface MobileConfigData {
  "cel_apn": string, 
  "cel_hab": boolean, 
  "cel_rede": string, 
  "cel_senha": string, 
  "cel_user": string
}

export interface WifiData {
  wifi_habilitado: string;
  wifi_sinal: number;
  wifi_ssid: string;
  wifi_status: string;
}

export interface MobileInfo {
  cel_hab: string;
  cel_iccid: string;
  cel_rede: string;
  cel_sinal: string;
  cel_stat: string;
  cel_tec: string;
}

export interface MobileData {
  info: MobileInfo;
  isDeviceOnline: boolean;
  isFetching: boolean;
  refreshData: () => void;
  version: number;
}

export interface GPSData {
  gps_alt: string;
  gps_azim: string;
  gps_clock: string;
  gps_err: string;
  gps_hab: string;
  gps_lat: string;
  gps_lon: string;
  gps_n_sat: number;
  gps_vel: string;
}

export interface DataloggerData {
  data_atual: string;
  hora_atual: string;
  mac: string;
  memoria_ram: string;
  modelo: string;
  numero_serie: string;
  spiffs_tamanho: number;
  spiffs_usado: number;
  sts_celular: string;
  sts_eeprom: string;
  sts_gnss: string;
  sts_spiffs: string;
  sts_wifi: string;
  uso_por_cento: number;
  versao_firmware: string;
}

export interface MQTTData {
  mqtt_hab: string;
  mqtt_host: string;
  mqtt_stat: string;
  mqtt_tecno: string;
  mqtt_ult_con: string;
  mqtt_ult_pub: string;
}

export interface Driver {
  driver: string;
  end: string;
  erro: string;
  ip: string;
  port: number;
  rev: number;
  rtu: boolean;
  sts: string;
  tcp: boolean;
  tmout: number;
}


export interface SerialInfo {
  baud_rate_serial: number;
  endereco_modbus: number;
  inter_frames: number;
  paridade: string;
  stop_bits_serial: number;
}

export interface SerialData {
  info: SerialInfo;
  isDeviceOnline: boolean;
  isFetching: boolean;
  refreshData: () => void;
  version: number;
}


export interface IOSData {
  configs: boolean[];
  qtd: number;
}

export interface CommandsData {
  info: {
    count: { qtd: number; value: any[] };
    freq: { qtd: number; value: any[] };
    in_ana: { config: any[]; qtd: number; valor: any[] };
    in_dig: { estados: any[]; qtd: number };
    out_dig: { estados: any[]; qtd: number };
  };
  isDeviceOnline: boolean;
  isFetching: boolean;
  refreshData: () => void;
  version: number;
}

export interface IOSPubData {
  ios_pub: {
    cpu: {
      ct_values: any[];
      di_mask: any[];
      ea_mask: any[];
      ea_values: any[];
      freq_values: any[];
    };
    time: number;
  };
}

