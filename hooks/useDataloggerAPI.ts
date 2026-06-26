import { useCallback, useState } from 'react';

interface FetchState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

/**
 * Generic hook to GET and POST data from a datalogger endpoint.
 * @param baseUrl base URL of your device, e.g. "http://192.168.4.1"
 */
export default function useDataloggerAPI(baseUrl: string) {
  const [state, setState] = useState<FetchState<any>>({
    data: null,
    error: null,
    loading: false,
  });

  // 🔹 GET helper
  const get = useCallback(
    async (path: string) => {
      setState({ data: null, error: null, loading: true });
      try {
        const res = await fetch(`${baseUrl}${path}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setState({ data: json, error: null, loading: false });
        return json;
      } catch (err: any) {
        setState({ data: null, error: err.message || 'GET failed', loading: false });
        throw err;
      }
    },
    [baseUrl]
  );

  // 🔹 POST helper
  const post = useCallback(
    async (path: string, body: any) => {
      setState({ data: null, error: null, loading: true });
      try {
        const res = await fetch(`${baseUrl}${path}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setState({ data: json, error: null, loading: false });
        return json;
      } catch (err: any) {
        setState({ data: null, error: err.message || 'POST failed', loading: false });
        throw err;
      }
    },
    [baseUrl]
  );

  return { ...state, get, post };
}
