// hooks/useDataloggerFetch.ts
import { useCallback, useEffect, useState } from 'react';

export default function useDataloggerFetch(
  baseUrl: string,
  log?: (msg: string) => void,
  // ADDED: A trigger array to control when the endpoint fetching runs
  trigger: any[] = [] 
) {
  const [dataMap, setDataMap] = useState<Record<string, any>>({});
  const [timestamps, setTimestamps] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  const fetchEndpoint = useCallback(
    async (endpoint: string) => {
      log?.("🔵 fetchEndpoint called with: " + endpoint);

      const url = `${baseUrl}${endpoint}`;
      log?.(`🌐 Full URL: ${url}`);

      try {
        setLoading(true);
        log?.("📡 Sending GET request...");
        const response = await fetch(url, { method: "GET" });

        log?.("📥 Response received. Status: " + response.status);

        if (!response.ok) {
          log?.("❗ Bad status code: " + response.status);
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const json = await response.json();
        log?.("📦 JSON parsed successfully.");

        setDataMap((prev) => {
          const updated = { ...prev, [endpoint]: json };
          log?.("🧭 Updated dataMap for " + endpoint);
          return updated;
        });
        setTimestamps((prev) => ({ ...prev, [endpoint]: Date.now() }));
        return json;
      } catch (err) {
        log?.("🔥 fetchEndpoint ERROR: " + String(err));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [baseUrl, log]
  );
  
  // NEW: useEffect to handle the trigger (not used in InfoCards, but useful for other components)
  // The InfoCards implementation uses manual fetchEndpoint calls, so this is mainly for structure.
  useEffect(() => {
    if (trigger.length > 0) {
      log?.("useDataloggerFetch triggered externally.");
    }
  }, [trigger, log]);


  return { dataMap, timestamps, loading, fetchEndpoint };
}