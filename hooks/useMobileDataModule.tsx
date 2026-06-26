import { NativeModules, Platform } from 'react-native';
import { useEffect, useState } from 'react';

const DRIVERS_URL = "http://tsocket.allexo.com.br:5000/drivers_list";

export default function useMobileDataModule() {
  const [cellularResult, setCellularResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDrivers();
  }, []);

  async function fetchDrivers() {
    try {
      setError(null);
      setCellularResult("Fetching drivers...");

      // Check if the module exists
      const MobileDataModule = NativeModules.AndroidMobileData;
      if (!MobileDataModule || !MobileDataModule.fetchUsingCellular) {
        throw new Error("AndroidMobileData module not found");
      }

      console.log("📡 Fetching using AndroidMobileData...");

      // Fetch using cellular
      const res = await MobileDataModule.fetchUsingCellular(DRIVERS_URL);

      console.log("📡 Result:", res);
      setCellularResult(res);

    } catch (e: any) {
      console.error("❌ Cellular fetch failed:", e);

      // Fallback: normal fetch over default network
      try {
        console.log("🌐 Falling back to default fetch...");
        const response = await fetch(DRIVERS_URL);
        const data = await response.text();
        setCellularResult(data);
      } catch (fallbackError: any) {
        setError(fallbackError?.message || "Unknown error fetching drivers");
      }
    }
  }

  return { cellularResult, error };
}
