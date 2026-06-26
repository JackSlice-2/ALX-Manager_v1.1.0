import { useEffect, useRef, useState, useCallback } from "react";

export default function useServerFetch(url: string | null) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const controllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (!url) {
      console.log("⚠️ Fetch skipped - URL is null or empty.");
      return;
    }

    // Cancel previous request if still running
    if (controllerRef.current) {
      controllerRef.current.abort();
    }

    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      setLoading(true);
      setError(null);

      //console.log("🌐 FETCH START:", url);

      const response = await fetch(url, {
        method: "GET",
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "User-Agent": "ALX-Mobile-App",
        },
      });

      //console.log("📡 RESPONSE:", url, response.status);

      // Accept normal success OR your special 410 case
      if (!response.ok && response.status !== 410) {
        throw new Error(`Request failed with status: ${response.status}`);
      }

      const json = await response.json();

      if (!isMountedRef.current) return;

      //console.log("✅ FETCH SUCCESS:", url, json);

      setData(json);
    } catch (err: any) {
      if (err.name === "AbortError") {
        //console.log("⚠️ REQUEST ABORTED:", url);
        return;
      }

      //console.log("❌ FETCH ERROR:", url, err);

      if (!isMountedRef.current) return;

      setError(err);
      setData(null);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [url]);

  useEffect(() => {
    isMountedRef.current = true;

    if (url) {
      fetchData();
    }

    return () => {
      isMountedRef.current = false;

      if (controllerRef.current) {
        controllerRef.current.abort();
      }
    };
  }, [url, fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}