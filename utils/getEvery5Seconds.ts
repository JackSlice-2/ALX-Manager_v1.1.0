import useDataloggerFetch from '@/hooks/useDataloggerFetch';
import { useCallback, useEffect, useState } from 'react';

/** Ping the device to check if it is reachable */
async function isDeviceAlive() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1000);

    const res = await fetch("http://192.168.4.1/req_info_datalogger", {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

export default function useGetInfo(endpoint: string) {
  const { dataMap, fetchEndpoint } = useDataloggerFetch("http://192.168.4.1");

  const [isFetching, setIsFetching] = useState(true);
  const [isDeviceOnline, setIsDeviceOnline] = useState(true);
  const [version, setVersion] = useState(0); // forces re-renders when data resets

  /** Manual refresh */
  const refreshData = useCallback(async () => {
    if (!endpoint) return;

    const alive = await isDeviceAlive();
    setIsDeviceOnline(alive);

    if (!alive) {
      setIsFetching(false);
      return;
    }

    // reset data so UI rerenders
    setVersion(v => v + 1);

    setIsFetching(true);
    await fetchEndpoint(endpoint);
    setIsFetching(false);
  }, [endpoint, fetchEndpoint]);

  /** Infinite fetch every 5 seconds */
  useEffect(() => {
    if (!endpoint) return;

    let intervalId: any;

    const loop = async () => {
      const alive = await isDeviceAlive();
      setIsDeviceOnline(alive);

      // reset data every time to force UI refresh
      setVersion(v => v + 1);

      if (alive) {
        setIsFetching(true);
        await fetchEndpoint(endpoint);
        setIsFetching(false);
      } else {
      }
    };

    // immediate fetch on mount
    loop();

    // fetch every 5 seconds forever
    intervalId = setInterval(loop, 5000);

    return () => clearInterval(intervalId);
  }, [endpoint, fetchEndpoint]);

  return {
    info: dataMap[endpoint] || {},
    refreshData,
    isFetching,
    isDeviceOnline,
    version
  };
}
