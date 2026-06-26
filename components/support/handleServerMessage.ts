type Props = {
  raw: string

  addLog: (
    msg: string,
    type?: any,
    shouldParse?: boolean
  ) => void

  setSessionToken: (
    token: string | null
  ) => void

  sessionTokenRef: React.MutableRefObject<string | null>

  serialSentRef: React.MutableRefObject<boolean>

  client: {
    close: () => Promise<void>
  }

  handleRouteRequest: (
    route: string
  ) => Promise<void>

  handlePostRouteRequest: (
    route: string,
    payload: any
  ) => Promise<void>
}

export const handleServerMessage =
  async ({
    raw,
    addLog,
    setSessionToken,
    sessionTokenRef,
    serialSentRef,
    client,
    handleRouteRequest,
    handlePostRouteRequest,
  }: Props) => {
    const cleanMsg = raw.trim()

    // SESSION TOKEN

    if (cleanMsg.length === 36) {
      setSessionToken(cleanMsg)

      sessionTokenRef.current =
        cleanMsg

      addLog(
        'Aguardando Atendimento Remoto...',
        'device',
        false
      )

      return
    }

    // DISCONNECT

    if (
      cleanMsg ===
      'discconected_user'
    ) {
      addLog(cleanMsg)
      await client.close()
      setSessionToken(null)
      sessionTokenRef.current =
        null
      serialSentRef.current =
        false
      return
    }

    // SUPPORT CONNECTED

    if (
      cleanMsg ===
      'support_connected'
    ) {
      addLog(cleanMsg)
      setTimeout(() => {
        addLog(
          'Aguardando Comandos...',
          'device',
          false
        )
      }, 1000)
      return
    }

    // GET ROUTE

    const routeMatch =
      cleanMsg.match(
        /route=([^;]+)/
      )

    const commandMatch =
      cleanMsg.match(
        /command=([^;]+)/
      )

    const route =
      routeMatch?.[1]?.trim()

    const command =
      commandMatch?.[1]?.trim()

    if (!route || !command) {
      return
    }

    const jsonIndex =
      cleanMsg.indexOf('json=')

    let payload = {}

    if (jsonIndex !== -1) {
      try {
        payload = JSON.parse(
          cleanMsg.substring(
            jsonIndex + 5
          )
        )
      } catch {}
    }

    // LOG REQUEST

    addLog(route, 'support', true)

    // HANDLE

    if (command === 'GET') {
      await handleRouteRequest(
        route
      )
    }

    if (command === 'POST') {
      await handlePostRouteRequest(
        route,
        payload
      )
    }
  }