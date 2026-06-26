import React, { useEffect } from 'react';
import useDataloggerPost from '../hooks/useDataloggerPost';

interface PostSenderProps {
  endpoint: string;
  payload: any;
  onSuccess?: (response: any) => void;
  onError?: (error: any) => void;
  baseUrl?: string;
}

const PostSender: React.FC<PostSenderProps> = ({
  endpoint,
  payload,
  onSuccess,
  onError,
  baseUrl = "http://192.168.4.1"
}) => {

  const { postToEndpoint } = useDataloggerPost(baseUrl);

  useEffect(() => {
    if (!endpoint || !payload) return;

    const successPhrases = [
      "Configuração realizada com sucesso",
      "Configuração salva",
      "Sucesso",
      "OK"
    ];

    const delay = (ms: number) =>
      new Promise(resolve => setTimeout(resolve, ms));

    const send = async () => {
      console.log('🚀 PostSender triggered');
      console.log('📡 Endpoint:', endpoint);
      console.log('📦 Payload:', JSON.stringify(payload, null, 2));

      try {
        const response = await postToEndpoint(endpoint, payload);

        console.log('✅ Response received:', response);

        const text =
          typeof response === "string"
            ? response
            : JSON.stringify(response);

        const isSuccess = successPhrases.some(p =>
          text.toLowerCase().includes(p.toLowerCase())
        );

        // ⏳ wait 2 seconds AFTER request completes
        await delay(2000);

        if (isSuccess) {
          console.log("🎉 Success detected →", text);
          onSuccess?.(response);
          return;
        }

        const failure = {
          message: "Resposta de configuração não confirmada.",
          response
        };

        console.error("❌ Logical failure", failure);
        onError?.(failure);

      } catch (error) {
        console.error('❌ Network/POST error:', error);

        // ⏳ wait 2.5 seconds even on error
        await delay(2500);

        onError?.(error);
      }
    };

    send();

  }, [endpoint, payload, /*onError, onSuccess, postToEndpoint*/]);

  return null;
};

export default PostSender;
