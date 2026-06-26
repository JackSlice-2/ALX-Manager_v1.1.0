import useGETTCPInfo from '@/components/support/useGETTCPInfo'

export const postRoutes = {
  req_config_wifi: '/req_config_wifi',
  req_config_rs232rs485: '/req_config_rs232rs485',
  req_config_mqtt: '/req_config_mqtt',
  req_config_celular: '/req_config_celular',
  req_config_in_ana: '/req_config_in_ana',
  req_config_ios_pub: '/req_config_ios_pub',
  req_toggle_out: '/req_toggle_out',
  req_ajustes_senha: '/req_ajustes_senha',
} as const

export const useSupportRoutes = () => {
  const routes = {
    req_info_datalogger: useGETTCPInfo('/req_info_datalogger'),
    req_info_celular: useGETTCPInfo('/req_info_celular'),
    req_info_gps: useGETTCPInfo('/req_info_gps'),
    req_info_mqtt: useGETTCPInfo('/req_info_mqtt'),
    req_info_wifi: useGETTCPInfo('/req_info_wifi'),
    req_info_ios: useGETTCPInfo('/req_info_ios'),

    req_info_config_celular: useGETTCPInfo('/req_info_config_celular'),
    req_info_config_mqtt: useGETTCPInfo('/req_info_config_mqtt'),
    req_info_config_wifi: useGETTCPInfo('/req_info_config_wifi'),
    req_info_config_in_ana: useGETTCPInfo('/req_info_config_in_ana'),
    req_info_config_ios_pub: useGETTCPInfo('/req_info_config_ios_pub'),
    req_info_config_RS232_RS485: useGETTCPInfo('/req_info_config_RS232_RS485'),
  } as const

  return { routes, postRoutes }
}

export type SupportRoutes =
  ReturnType<typeof useSupportRoutes>['routes']

export type SupportPostRoutes =
  typeof postRoutes