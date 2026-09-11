import AndroidMobileData from '@/modules/AndroidMobileData'
import OpenTCPSocket, {  listenTcpMessages } from '@/modules/OpenTCPSocket'
import React, {  useEffect,  useRef,  useState } from 'react'
import { ScrollView } from 'react-native'
import {  encryptAES,  HOST,  PORT,  SECRET_KEY,  TcpClientWrapper } from '@/components/support/constants'
import { BASE_URL } from '@/utils/constants'
import { useSupportRoutes } from '@/components/support/utils/useSupportRoutes'
import useGetInfo from '@/utils/getEvery5Seconds'

import SupportClient from '@/components/support/client/SupportClient'

import { handleServerMessage } from '@/components/support/handleServerMessage'
import { useCreateSupportLogger } from '@/components/support/utils/useCreateSupportLogger'
import { createRouteHandlers } from '@/components/support/utils/routeHandlers'
import useSupportPost from '@/components/support/utils/useSupportPost'
import useDataloggerPost from '@/hooks/useDataloggerPost'
import { useT } from '@/hooks/useT'

const Support = () => {
  const [terminalLogs, setTerminalLogs] = useState<
    {
      text: string
      type: 'system' | 'support' | 'device' | 'gateway'
    }[]
  >([])

  const [connecting, setConnecting] = useState(false)
  const [connected, setConnected] = useState(false)
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [client, setClient] = useState<TcpClientWrapper | null>(null)

  const scrollRef = useRef<ScrollView>(null)
  const serialSentRef = useRef(false)
  const tcpListenerRef = useRef<(() => void) | null>(null)
  const sessionTokenRef = useRef<string | null>(null)
  const { addLog, addRawLog } = useCreateSupportLogger(setTerminalLogs, scrollRef)

  const dataloggerSerial = useGetInfo('/req_info_datalogger')
  const datalogger = dataloggerSerial.info
  const SERIAL = datalogger.numero_serie
  const t = useT()

  const { routes, postRoutes } = useSupportRoutes()
  const cancelledRef = useRef(false)
  // CLEANUP

  useEffect(() => {
    return () => {
      console.log('Support component unmounted')

      if (tcpListenerRef.current) {
        tcpListenerRef.current()
        tcpListenerRef.current = null
      }

      OpenTCPSocket.closeTcpSocket()
    }
  }, [])


  // POST API
const { postToEndpoint: postForm } =
  useDataloggerPost(
    BASE_URL,
    addLog
  )

const { postToEndpoint: postJson } =
  useSupportPost(
    BASE_URL,
    addLog
  )

  // GET HANDLER
const {
  handleRouteRequest,
  handlePostRouteRequest,
} = createRouteHandlers({
  terminalLogs,

  routes,
  postRoutes,

  postForm,
  postJson,

  addLog,
  sessionTokenRef,
  serial: SERIAL,
})

  // CONNECT

const handleConnect = async () => {

  if (connecting || connected) {
    cancelledRef.current = true

    addLog(t.SupportMessages['Encerrando Conexão...'])

    setConnecting(false)
    setConnected(false)

    serialSentRef.current = false

    setSessionToken(null)
    sessionTokenRef.current = null

    try {
      if (tcpListenerRef.current) {
        tcpListenerRef.current()
        tcpListenerRef.current = null
      }
      await OpenTCPSocket.closeTcpSocket()
    } catch (err) {
      console.log('Socket close error:', err)
    }
    setClient(null)

    addLog(t.SupportMessages['Conexão Encerrada'])
    return
  }

  cancelledRef.current = false

  setConnecting(true)
  setConnected(false)

  setTerminalLogs([])

  setSessionToken(null)
  sessionTokenRef.current = null

  serialSentRef.current = false

  addLog('-- INICIANDO CONEXÃO --')

  try {
    // MOBILE DATA CHECK
    addLog(
      'Verificando dados móveis...',
      'device'
    )

    await AndroidMobileData.fetchUsingCellular(
      'https://clients3.google.com/generate_204'
    )
    
    // IMPORTANT:
    // fetchUsingCellular cannot truly cancel,
    // so we MUST manually stop here.
    if (cancelledRef.current) {
      setConnecting(false)

      addLog(
        'Conexão cancelada',
        'system'
      )

      return
    }

    addLog(
      '- Dados móveis ativos -'
    )

    // OPEN SOCKET
    addLog(
      'Conectando ao Servidor...',
      'device'
    )

    await OpenTCPSocket.openTcpSocket(
      HOST,
      PORT
    )

    if (cancelledRef.current) {
      try {
        await OpenTCPSocket.closeTcpSocket()
      } catch {}

      setConnecting(false)

      addLog(
        'Conexão cancelada',
        'system'
      )

      return
    }

    addLog(
      'Conectado ao Servidor Allexo!',
      'support'
    )

    // TCP WRAPPER
    const tcpWrapper: TcpClientWrapper = {
      write: async (
        data: string
      ) => {
        if (cancelledRef.current) {
          return
        }

        await OpenTCPSocket.sendTcpData(
          data
        )
      },

      close: async () => {
        cancelledRef.current = true

        setConnecting(false)
        setConnected(false)

        serialSentRef.current = false

        setSessionToken(null)
        sessionTokenRef.current = null

        try {
          if (tcpListenerRef.current) {
            tcpListenerRef.current()
            tcpListenerRef.current = null
          }

          await OpenTCPSocket.closeTcpSocket()
        } catch (err) {
          console.log(
            'Socket close error:',
            err
          )
        }

        setClient(null)

        addLog(
          '⚠ CONEXÃO TERMINADA'
        )
      },
    }

    setClient(tcpWrapper)

    // REMOVE OLD LISTENER
    if (tcpListenerRef.current) {
      tcpListenerRef.current()
      tcpListenerRef.current = null
    }

    // CREATE LISTENER
    tcpListenerRef.current =
      listenTcpMessages(
        async msg => {
          if (cancelledRef.current) {
            return
          }

          const rawMsg =
            msg ||
            '[Empty Message Received]'

          //addRawLog(rawMsg)

          await handleServerMessage({
            raw: rawMsg,
            addLog,
            setSessionToken,
            sessionTokenRef,
            serialSentRef,
            client: tcpWrapper,

            handleRouteRequest: (
              route: string
            ) =>
              handleRouteRequest(
                route,
                tcpWrapper
              ),

            handlePostRouteRequest: (
              route: string,
              payload: any
            ) =>
              handlePostRouteRequest(
                route,
                payload,
                tcpWrapper
              ),
          })
        }
      )

    //
    // SEND SERIAL
    //
    if (cancelledRef.current) {
      await tcpWrapper.close()
      return
    }

    addLog(
      'Enviando numero de serie...',
      'device'
    )

    const encryptedSerial =
      await encryptAES(
        SERIAL,
        SECRET_KEY
      )

    if (cancelledRef.current) {
      await tcpWrapper.close()
      return
    }

    await tcpWrapper.write(
      encryptedSerial
    )

    if (cancelledRef.current) {
      await tcpWrapper.close()
      return
    }

    serialSentRef.current = true

    setConnecting(false)
    setConnected(true)

    addLog(
      'Numero de serie authenticado!',
      'support'
    )
  } catch (err: any) {
    console.log(
      'CONNECT ERROR:',
      err
    )

    cancelledRef.current = true

    setConnecting(false)
    setConnected(false)

    serialSentRef.current = false

    setSessionToken(null)
    sessionTokenRef.current = null

    try {
      if (tcpListenerRef.current) {
        tcpListenerRef.current()
        tcpListenerRef.current = null
      }

      await OpenTCPSocket.closeTcpSocket()
    } catch {}

    setClient(null)

    addLog(
      '✖ CONEXÃO COM SERVIDOR FALHOU'
    )

    addLog(
      err?.message ||
        'Erro desconhecido'
    )
  }
}

  return (
    <SupportClient
      connecting={connecting}
      connected={connected}      
      sessionToken={sessionToken}
      scrollRef={scrollRef}
      terminalLogs={terminalLogs}
      setTerminalLogs={setTerminalLogs}
      setSessionToken={setSessionToken}
      addLog={addLog}
      client={client}
      sessionTokenRef={sessionTokenRef}
      serialSentRef={serialSentRef}
      handleConnect={handleConnect}
      setConnecting={setConnecting}
      setConnected={setConnected}
    />
  )
}

export default Support