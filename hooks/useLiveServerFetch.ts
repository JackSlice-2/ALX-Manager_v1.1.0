import { useEffect, useState } from "react";

export const useLiveServerFetch = (url: string | null, intervalMs: number = 2000) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!url) return;

    let mounted = true;

    const fetchData = async () => {
      setLoading(true);
      setData(null);
      setError(null);

      try {
        const res = await fetch(url);
        const json = await res.json();
        if (mounted) setData(json);
      } catch (err: any) {
        if (mounted) setError(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, intervalMs);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [url, intervalMs]);

  return { data, loading, error };
};
