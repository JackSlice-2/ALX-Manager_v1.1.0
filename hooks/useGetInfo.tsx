import { useCallback, useEffect, useState } from 'react';
import useDataloggerFetch from './useDataloggerFetch';

/** Ping the device to check if it is reachable */
async function isDeviceAlive() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 100);

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

  /** Manual refresh */
  const refreshData = useCallback(async () => {
    if (!endpoint) return;

    const alive = await isDeviceAlive();
    setIsDeviceOnline(alive);

    if (!alive) {
      console.log("❌ Device is offline — skipping manual fetch.");
      setIsFetching(false);
      return;
    }

    setIsFetching(true);
    await fetchEndpoint(endpoint);
    setIsFetching(false);
  }, [endpoint, fetchEndpoint]);

  /** Initial fetch with retry-on-failure */
  useEffect(() => {
    if (!endpoint) return;

    let isMounted = true;

    const fetchOnce = async () => {
      if (!isMounted) return;

      const alive = await isDeviceAlive();
      setIsDeviceOnline(alive);

      if (!alive) {
        console.log(`⚠️ Device offline — retrying in 5s for ${endpoint}`);
        setIsFetching(false);
        // Retry once after 5 seconds
        setTimeout(fetchOnce, 5000);
        return;
      }

      setIsFetching(true);
      await fetchEndpoint(endpoint);
      setIsFetching(false);
      console.log(`✅ Successfully fetched ${endpoint} — stopping retries`);
      // Do not set another interval — stop after success
    };

    fetchOnce();

    return () => {
      isMounted = false;
    };
  }, [endpoint, fetchEndpoint]);

  /** Stop loading indicator when fresh data arrives */
  useEffect(() => {
    if (dataMap[endpoint]) {
      setIsFetching(false);
    }
  }, [dataMap, endpoint]);

  return {
    info: dataMap[endpoint] || {},
    refreshData,
    isFetching,
    isDeviceOnline,
  };
}
