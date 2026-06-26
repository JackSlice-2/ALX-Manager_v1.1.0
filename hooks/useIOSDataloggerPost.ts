import { useCallback, useState } from 'react';

export default function useIOSDataloggerPost(baseUrl: string, log?: (msg: string) => void) {
  const [postMap, setPostMap] = useState<Record<string, any>>({});
  const [timestamps, setTimestamps] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  /**
   * Helper to convert a plain object to a URL-encoded string suitable 
   * for application/x-www-form-urlencoded.
   */
  const urlEncodeBody = (data: any): string => {
    // Note: The device expects 'true'/'false' for 'hab', which encodeURIComponent handles correctly.
    return Object.keys(data)
      .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
      .join('&');
  };

  /**
   * 🚀 POST to an endpoint with a URL-encoded body (simulating form-data).
   * Returns parsed JSON if possible, otherwise raw text.
   */
  const postToEndpoint = useCallback(
  async (endpoint: string, body: any) => {
    const fullUrl = `${baseUrl}${endpoint}`;

    try {
      setLoading(true);

      log?.(`📤 POST ${fullUrl}`);
      log?.(`📦 JSON body: ${JSON.stringify(body)}`);

      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const text = await response.text();

      let parsed: any = text;
      try {
        parsed = JSON.parse(text);
      } catch {}

      setPostMap(prev => ({ ...prev, [endpoint]: parsed }));
      setTimestamps(prev => ({ ...prev, [endpoint]: Date.now() }));

      return parsed;
    } catch (err) {
      log?.(`❌ POST error: ${String(err)}`);
      throw err;
    } finally {
      setLoading(false);
    }
  },
  [baseUrl]
);


  return { postMap, timestamps, loading, postToEndpoint };
}