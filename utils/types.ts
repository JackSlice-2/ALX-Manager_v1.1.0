

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
  

 export type ChartModalProps = {
    visible: boolean;
    onClose: () => void;
    onAddDriver: () => void;
  };

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