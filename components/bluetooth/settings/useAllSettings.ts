import useGetInfo from '@/utils/getEvery5Seconds';

const isNonEmptyObject = (value: any) =>
  value &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  Object.keys(value).length > 0;

export default function useAllSettingsData() {
  const RTC = useGetInfo('/req_info_mqtt');
  const RTCConfig = useGetInfo('/req_info_config_mqtt');
  const RegisterData = useGetInfo('/req_info_celular');
  const RegisterConfigData = useGetInfo('/req_info_config_celular');
  const mobile = useGetInfo('/req_info_celular');
  const mobileConfig = useGetInfo('/req_info_config_celular');
  const datalogger = useGetInfo('/req_info_datalogger');
  const gps = useGetInfo('/req_info_gps');
  const mqtt = useGetInfo('/req_info_mqtt');
  const mqttConfig = useGetInfo('/req_info_config_mqtt');
  const ios = useGetInfo('/req_info_config_in_ana');
  const iosPub = useGetInfo('/req_info_config_ios_pub');
  const drivers = useGetInfo('/req_info_drivers');
  const serial = useGetInfo('/req_info_config_RS232_RS485');
  const commands = useGetInfo('/req_info_ios');

  const all = [
    RTC,
    RTCConfig,
    RegisterData,
    RegisterConfigData,
    mobile,
    mobileConfig,
    datalogger,
    gps,
    mqtt,
    mqttConfig,
    ios,
    iosPub,
    drivers,
    serial,
    commands,
  ];

  const isFetching = all.some(d => d.isFetching);

  const hasEmptyData = all.some(
    d => !isNonEmptyObject(d.info)
  );

  const dataStable = !isFetching && !hasEmptyData;

  return {
    dataStable,
    isFetching,

    RTC,
    RTCConfig,
    RegisterData,
    RegisterConfigData,
    mobile,
    mobileConfig,
    datalogger,
    gps,
    mqtt,
    mqttConfig,
    ios,
    iosPub,
    drivers,
    serial,
    commands,
  };
}
