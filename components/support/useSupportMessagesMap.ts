import { useT } from '@/hooks/useT'

export type SupportMessageConfig = {
  userMessage: string
  type: 'system' | 'support' | 'device'
  visible: boolean
}

export const useSupportMessageMap = (): Record<
  string,
  SupportMessageConfig
> => {
  const t = useT()

return {
  disconnected_inactivity: {
    userMessage:
      t.SupportMessages.disconnected_inactivity,
    type: 'support',
    visible: true,
  },

  support_connected: {
    userMessage:
      t.SupportMessages.support_connected,
    type: 'support',
    visible: true,
  },

  structure_error: {
    userMessage:
      t.SupportMessages.structure_error,
    type: 'system',
    visible: true,
  },

  discconected_user: {
    userMessage:
      t.SupportMessages.discconected_user,
    type: 'support',
    visible: true,
  },

  req_info_gps: {
    userMessage:
      t.SupportMessages.req_info_gps,
    type: 'support',
    visible: true,
  },

  req_info_gps_response: {
    userMessage:
      t.SupportMessages.req_info_gps_response,
    type: 'device',
    visible: true,
  },

  req_info_config_in_ana: {
    userMessage:
      t.SupportMessages.req_info_config_in_ana,
    type: 'support',
    visible: true,
  },

  req_info_config_in_ana_response: {
    userMessage:
      t.SupportMessages.req_info_config_in_ana_response,
    type: 'device',
    visible: true,
  },

  req_config_in_ana: {
    userMessage:
      t.SupportMessages.req_config_in_ana,
    type: 'support',
    visible: true,
  },

  req_config_in_ana_response: {
    userMessage:
      t.SupportMessages.req_config_in_ana_response,
    type: 'device',
    visible: true,
  },

  req_info_config_ios_pub: {
    userMessage:
      t.SupportMessages.req_info_config_ios_pub,
    type: 'support',
    visible: true,
  },

  req_info_config_ios_pub_response: {
    userMessage:
      t.SupportMessages.req_info_config_ios_pub_response,
    type: 'device',
    visible: true,
  },

  req_config_ios_pub: {
    userMessage:
      t.SupportMessages.req_config_ios_pub,
    type: 'support',
    visible: true,
  },

  req_config_ios_pub_response: {
    userMessage:
      t.SupportMessages.req_config_ios_pub_response,
    type: 'device',
    visible: true,
  },

  req_info_config_celular: {
    userMessage:
      t.SupportMessages.req_info_config_celular,
    type: 'support',
    visible: true,
  },

  req_info_config_celular_response: {
    userMessage:
      t.SupportMessages.req_info_config_celular_response,
    type: 'device',
    visible: true,
  },

  req_config_celular: {
    userMessage:
      t.SupportMessages.req_config_celular,
    type: 'support',
    visible: true,
  },

  req_config_celular_response: {
    userMessage:
      t.SupportMessages.req_config_celular_response,
    type: 'device',
    visible: true,
  },

  req_info_config_mqtt: {
    userMessage:
      t.SupportMessages.req_info_config_mqtt,
    type: 'support',
    visible: true,
  },

  req_info_config_mqtt_response: {
    userMessage:
      t.SupportMessages.req_info_config_mqtt_response,
    type: 'device',
    visible: true,
  },

  req_config_mqtt: {
    userMessage:
      t.SupportMessages.req_config_mqtt,
    type: 'support',
    visible: true,
  },

  req_config_mqtt_response: {
    userMessage:
      t.SupportMessages.req_config_mqtt_response,
    type: 'device',
    visible: true,
  },

  req_info_ios: {
    userMessage:
      t.SupportMessages.req_info_ios,
    type: 'support',
    visible: true,
  },

  req_info_ios_response: {
    userMessage:
      t.SupportMessages.req_info_ios_response,
    type: 'device',
    visible: true,
  },

  req_info_datalogger: {
    userMessage:
      t.SupportMessages.req_info_datalogger,
    type: 'support',
    visible: true,
  },

  req_info_datalogger_response: {
    userMessage:
      t.SupportMessages.req_info_datalogger_response,
    type: 'device',
    visible: true,
  },

  req_info_celular: {
    userMessage:
      t.SupportMessages.req_info_celular,
    type: 'support',
    visible: true,
  },

  req_info_celular_response: {
    userMessage:
      t.SupportMessages.req_info_celular_response,
    type: 'device',
    visible: true,
  },

  req_info_mqtt: {
    userMessage:
      t.SupportMessages.req_info_mqtt,
    type: 'support',
    visible: true,
  },

  req_info_mqtt_response: {
    userMessage:
      t.SupportMessages.req_info_mqtt_response,
    type: 'device',
    visible: true,
  },

  req_info_wifi: {
    userMessage:
      t.SupportMessages.req_info_wifi,
    type: 'support',
    visible: true,
  },

  req_info_wifi_response: {
    userMessage:
      t.SupportMessages.req_info_wifi_response,
    type: 'device',
    visible: true,
  },

  req_info_config_RS232_RS485: {
    userMessage:
      t.SupportMessages.req_info_config_RS232_RS485,
    type: 'support',
    visible: true,
  },

  req_info_config_RS232_RS485_response: {
    userMessage:
      t.SupportMessages.req_info_config_RS232_RS485_response,
    type: 'device',
    visible: true,
  },

  req_config_rs232rs485: {
    userMessage:
      t.SupportMessages.req_config_rs232rs485,
    type: 'support',
    visible: true,
  },

  req_config_rs232rs485_response: {
    userMessage:
      t.SupportMessages.req_config_rs232rs485_response,
    type: 'device',
    visible: true,
  },

  req_info_config_wifi: {
    userMessage:
      t.SupportMessages.req_info_config_wifi,
    type: 'support',
    visible: true,
  },

  req_info_config_wifi_response: {
    userMessage:
      t.SupportMessages.req_info_config_wifi_response,
    type: 'device',
    visible: true,
  },

  req_config_wifi: {
    userMessage:
      t.SupportMessages.req_config_wifi,
    type: 'device',
    visible: true,
  },

  req_config_wifi_response: {
    userMessage:
      t.SupportMessages.req_config_wifi_response,
    type: 'device',
    visible: true,
  },

  req_toggle_out: {
    userMessage:
      t.SupportMessages.req_toggle_out,
    type: 'support',
    visible: true,
  },

  req_toggle_out_response: {
    userMessage:
      t.SupportMessages.req_toggle_out_response,
    type: 'device',
    visible: true,
  },

  req_ajustes_senha: {
    userMessage:
      t.SupportMessages.req_ajustes_senha,
    type: 'support',
    visible: true,
  },

  req_ajustes_senha_response: {
    userMessage:
      t.SupportMessages.req_ajustes_senha_response,
    type: 'device',
    visible: true,
  },

  '-- INICIANDO CONEXÃO --': {
    userMessage:
      t.SupportMessages['-- INICIANDO CONEXÃO --'],
    type: 'system',
    visible: true,
  },

  'Verificando dados móveis...': {
    userMessage:
      t.SupportMessages['Verificando dados móveis...'],
    type: 'device',
    visible: true,
  },

  '- Dados móveis ativos -': {
    userMessage:
      t.SupportMessages['- Dados móveis ativos -'],
    type: 'system',
    visible: true,
  },

  'Conectando ao Servidor...': {
    userMessage:
      t.SupportMessages['Conectando ao Servidor...'],
    type: 'device',
    visible: true,
  },

  'Conectado ao Servidor Allexo!': {
    userMessage:
      t.SupportMessages['Conectado ao Servidor Allexo!'],
    type: 'support',
    visible: true,
  },

  'Enviando numero de serie...': {
    userMessage:
      t.SupportMessages['Enviando numero de serie...'],
    type: 'device',
    visible: true,
  },

  '- Numero de serie enviado -': {
    userMessage:
      t.SupportMessages['- Numero de serie enviado -'],
    type: 'system',
    visible: true,
  },

  'Aguardando Atendimento Remoto...': {
    userMessage:
      t.SupportMessages['Aguardando Atendimento Remoto...'],
    type: 'device',
    visible: true,
  },

  'Aguardando Comandos...': {
    userMessage:
      t.SupportMessages['Aguardando Comandos...'],
    type: 'device',
    visible: true,
  },

  '⚠ CONEXÃO TERMINADA': {
    userMessage:
      t.SupportMessages['⚠ CONEXÃO TERMINADA'],
    type: 'system',
    visible: true,
  },

  '✖ CONEXÃO COM SERVIDOR FALHOU': {
    userMessage:
      t.SupportMessages['✖ CONEXÃO COM SERVIDOR FALHOU'],
    type: 'system',
    visible: true,
  },

  'Numero de serie authenticado!': {
    userMessage:
      t.SupportMessages['Numero de serie authenticado!'],
    type: 'support',
    visible: true,
  },
}
}