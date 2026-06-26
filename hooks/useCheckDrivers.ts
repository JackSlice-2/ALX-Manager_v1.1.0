import useServerFetch from '@/hooks/useServerfetch';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

const DRIVERS_URL = "http://tsocket.allexo.com.br:5000/drivers_list";

const useCheckDrivers = (maxRetries = 3, retryDelay = 2000) => {
  const [triggerFetch, setTriggerFetch] = useState(true);
  const serverData = useServerFetch(triggerFetch ? DRIVERS_URL : null);

  const [retryCount, setRetryCount] = useState(0);

  const isLoading = serverData.loading;
  const error = serverData.error;
  const drivers = serverData.data?.drvs ?? null;

  let errorMessage = null;

  // ====== HANDLE ERRORS / RETRY ======
  if (error) {
    const errorMsg = error.message;

    if (errorMsg.includes("Network request failed") && retryCount < maxRetries) {
      errorMessage = `Tentando novamente... (Tentativa ${retryCount + 1})`;

      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setTriggerFetch(true);
      }, retryDelay);

    } else {
      if (retryCount >= maxRetries) {
        errorMessage = `Erro: não foi possível obter a lista de drivers após ${maxRetries} tentativas.`;
      } else {
        errorMessage = `Erro: ${errorMsg}`;
      }
    }
  }

  // Reset retry count if success
  useEffect(() => {
    if (!isLoading && retryCount > 0) {
      setRetryCount(0);
    }
  }, [isLoading]);

  // ====== SAVE DRIVERS TO COOKIE (AsyncStorage) ======
  useEffect(() => {
    if (drivers) {
      const payload = {
        drivers,
        timestamp: Date.now(),
      };

      AsyncStorage.setItem("drivers_list", JSON.stringify(payload));
    }
  }, [drivers]);

  return {
    drivers,
    isLoading,
    errorMessage,
    retryCount,
  };
};

export default useCheckDrivers;
