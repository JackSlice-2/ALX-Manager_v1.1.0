import formatJsonTable from '@/components/support/utils/formatJsonTable';
import { useCallback, useState } from 'react';

export default function useDataaddLoggerPost(baseUrl: string, addLog?: (msg: string, type: 'system' | 'support' | 'device', shouldParse?: boolean) => void) {
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

        // --- FIX IMPLEMENTED HERE ---
        const formBody = urlEncodeBody(body);
        console.log(`📤 POST ${fullUrl} with FORM body:`, formBody);
        // ----------------------------

        const response = await fetch(fullUrl, {
          method: 'POST',
          // --- FIX IMPLEMENTED HERE ---
          // Use application/x-www-form-urlencoded to mimic simple form-data structure
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, 
          body: formBody,
          // ----------------------------
        });

        const text = await response.text();
        let parsed: any = text;

        try {
          parsed = JSON.parse(text);
          console.log?.(`✅ ${endpoint} parsed as JSON`);
          addLog?.(formatJsonTable(text), 'support')
        } catch {
          console.log?.(`⚠️ ${endpoint} returned non-JSON, stored raw text`);
        }

        // Store the response under POST map
        setPostMap(prev => ({ ...prev, [endpoint]: parsed }));
        setTimestamps(prev => ({ ...prev, [endpoint]: Date.now() }));

        console.log(parsed)
        return parsed;
      } catch (err: any) {
        const msg = err.message || String(err);
        console.log?.(`❌ POST error for ${endpoint}: ${msg}`);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [baseUrl]
  );

  return { postMap, timestamps, loading, postToEndpoint };
}