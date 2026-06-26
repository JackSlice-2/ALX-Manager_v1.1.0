import { useEffect, useState } from 'react';
import WifiManager from 'react-native-wifi-reborn';

export default function useCurrentSSID() {
  const [ssid, setSSID] = useState<string | null>(null);

  useEffect(() => {
    const fetchSSID = async () => {
      try {
        const currentSSID = await WifiManager.getCurrentWifiSSID();
        console.log('📡 Current SSID:', currentSSID);
        setSSID(currentSSID);
      } catch (err) {
        console.warn('📡 Could not get SSID:', err);
        setSSID(null);
      }
    };

    fetchSSID();
  }, []);

  return ssid;
}
