import useServerFetch from '@/hooks/useServerfetch'; // Assuming this is a custom hook for fetching data
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

type UrlParams = {
  codigo: string;
  versao: string;
  serial: string;
};

const useCheckAppUpdate = (urlParams: UrlParams | null, maxRetries = 3, retryDelay = 2000) => {
  const [triggerFetch, setTriggerFetch] = useState(false);
  const [firmwareCheckUrl, setFirmwareCheckUrl] = useState<string | null>(null);
  const serverData = useServerFetch(triggerFetch ? firmwareCheckUrl : null);

  // Track retry attempts
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (urlParams) {
      const url = `http://192.168.4.1:5000/check_app_mobile`;
      setFirmwareCheckUrl(url);
      setTriggerFetch(true);
    }
  }, [urlParams]);

  // Handle the response logic
  const isAppUpdateAvailable = serverData.data?.status === 'atualizacao_disponivel';
  const isLoading = serverData.loading;
  const error = serverData.error;

  let updateErrorMessage = null;
  if (error) {
    const errorMsg = error.message;

    // Retry logic if network request failed
    if (errorMsg.includes('Network request failed') && retryCount < maxRetries) {
      updateErrorMessage = `Tentando novamente... (Tentativa ${retryCount + 1})`;

      // Retry after a delay
      setTimeout(() => {
        setRetryCount(prevCount => prevCount + 1); // Increase retry count
        setTriggerFetch(true); // Trigger the fetch again
      }, retryDelay);
    } else {
      // If the max retries are reached or error is different
      if (retryCount >= maxRetries) {
        updateErrorMessage = `Erro ao verificar atualização: Não foi possível conectar após ${maxRetries} tentativas.`;
      } else {
        updateErrorMessage = `Erro ao verificar atualização: ${errorMsg}`;
      }
    }
  }

  // Reset retry count if the fetch was successful
  useEffect(() => {
    if (!isLoading && retryCount > 0) {
      setRetryCount(0); // Reset retry count after a successful request
    }
  }, [isLoading]);

  //save data to reuse
  useEffect(() => {
  if (serverData.data) {
    const payload = {
      isAppUpdateAvailable,
      versionAvailable: serverData.data?.novo_firmware?.versao ?? null,
      rawData: serverData.data,
      timestamp: Date.now(),
    };

    AsyncStorage.setItem("update_info", JSON.stringify(payload));
  }
}, [serverData.data]);

  return {
    isAppUpdateAvailable,
    isLoading,
    updateErrorMessage,
    retryCount, // Track retry count
  };
};

export default useCheckAppUpdate;
