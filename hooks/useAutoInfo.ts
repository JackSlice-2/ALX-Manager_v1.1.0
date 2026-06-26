import { useEffect, useState } from "react";

const DEFAULTS: any = {
  datalogger: {
    versao_firmware: "—",
    data_atual: "",
    hora_atual: "",
    memoria_ram: 0,
    uso_por_cento: 0,
    sts_spiffs: "—",
    sts_eeprom: "—",
    sts_gnss: "—",
    sts_wifi: false,
  },
  cel: {
    cel_sinal: -120,
    cel_stat: "-",
    cel_tec: "—",
  },
  mqtt: {
    mqtt_stat: "-",
    mqtt_ult_con: "—",
    mqtt_ult_pub: "—",
  }
};

async function safeFetch(url: string) {
  try {
    const res = await fetch("http://192.168.4.1" + url);
    return await res.json();
  } catch {
    return null; // keep previous values if failed
  }
}

export const useAutoInfo = () => {
  const [state, setState] = useState(DEFAULTS);

  useEffect(() => {
    let mounted = true;

    const poll = async () => {
      const [datalogger, cel, mqtt] = await Promise.all([
        safeFetch("/req_info_datalogger"),
        safeFetch("/req_info_celular"),
        safeFetch("/req_info_mqtt"),
      ]);

      if (!mounted) return;

      setState((prev: any) => ({
        datalogger: datalogger ?? prev.datalogger,
        cel:        cel        ?? prev.cel,
        mqtt:       mqtt       ?? prev.mqtt,
      }));
    };

    poll();
    const interval = setInterval(poll, 5000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return state;
};
