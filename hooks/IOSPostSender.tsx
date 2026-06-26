import React, { useEffect, useRef } from 'react';
import useIOSDataloggerPost from './useIOSDataloggerPost';

interface PostSenderProps {
  endpoint: string;
  payload: any;
  onSuccess?: (response: any) => void;
  onError?: (error: any) => void;
  baseUrl?: string;
}

const IOSPostSender: React.FC<PostSenderProps> = ({
  endpoint,
  payload,
  onSuccess,
  onError,
  baseUrl = 'http://192.168.4.1',
}) => {
  const { postToEndpoint } = useIOSDataloggerPost(baseUrl);

  // prevents re-sending on re-render
  const hasSentRef = useRef(false);

  useEffect(() => {
    if (!endpoint || !payload) return;
    if (hasSentRef.current) return;

    hasSentRef.current = true;

    const successPhrases = [
      'configuração realizada',
      'configuração salva',
      'sucesso',
      'ok',
    ];

    const send = async () => {
      console.log('🚀 PostSender triggered');
      console.log('📡 Endpoint:', endpoint);
      console.log('📦 Payload (object):', payload);

      try {
        const response = await postToEndpoint(endpoint, payload);

        console.log('✅ Response received:', response);

        // normalize response to text
        const text =
          typeof response === 'string'
            ? response
            : JSON.stringify(response);

        const isSuccess = successPhrases.some(p =>
          text.toLowerCase().includes(p)
        );

        if (isSuccess) {
          console.log('🎉 Success detected');
          onSuccess?.(response);
          return;
        }

        // logical failure (server answered but rejected payload)
        const failure = {
          message: 'Resposta de configuração não confirmada.',
          response,
        };

        console.error('❌ Logical failure', failure);
        onError?.(failure);

      } catch (error) {
        console.error('❌ Network/POST error:', error);
        onError?.(error);
      }
    };

    send();
  }, [endpoint, payload, postToEndpoint, onSuccess, onError]);

  return null;
};

export default IOSPostSender;
