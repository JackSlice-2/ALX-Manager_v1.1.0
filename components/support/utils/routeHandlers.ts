import { buildResponse } from '@/components/support/utils/buildResponse'
import formatJsonTable from './formatJsonTable';
import type {
  SupportPostRoutes,
  SupportRoutes,
} from './useSupportRoutes'
import { containsGatewayError } from './containsGatewayError';

type Props = {
  routes: SupportRoutes
  postRoutes: SupportPostRoutes

  postForm: (
    endpoint: string,
    payload: any
  ) => Promise<any>

  postJson: (
    endpoint: string,
    payload: any
  ) => Promise<any>

  addLog: (
    text: string,
    type?: 'system' | 'support' | 'device' | "gateway",
    shouldParse?: boolean
  ) => void

  terminalLogs: any[]

  sessionTokenRef: React.MutableRefObject<string | null>

  serial: string
}

export const createRouteHandlers = ({
  routes,
  postRoutes,

  postForm,
  postJson,

  addLog,
  sessionTokenRef,
  serial,
}: Props) => {

  //
  // GET ROUTES
  //
  const handleRouteRequest = async (
    route: string,
    client: any
  ) => {

    const routeHook =
      routes[
        route as keyof typeof routes
      ]

    if (!routeHook) {

      addLog(
        `Rota GET não encontrada: ${route}`
      )

      return
    }

    try {

const payload =
  await routeHook.getFreshData()

  const isEmptyPayload =
  payload &&
  typeof payload === 'object' &&
  !Array.isArray(payload) &&
  Object.keys(payload).length === 0

  const hasGatewayError =
  containsGatewayError(payload)

const httpCode =
  hasGatewayError || isEmptyPayload
    ? 500
    : 200
    
    const response =
  buildResponse({
    sessionToken:
      sessionTokenRef.current || '',
    command: route,
    serial,
    httpCode,
    payload,
  })

  if (!isEmptyPayload) {
        addLog(
          formatJsonTable(payload),
          'device'
        )

        addLog(`${route}_response`, 'device', true)
      } 

  if (isEmptyPayload) {
    addLog(
      `Gateway retornou payload vazio, tente novamente`,
      'gateway'
    )
  }

      await client.write(response)

    } catch (err: any) {

      addLog(
        `Erro GET ${route}: ${err?.message}`
      )
    }
  }

  //
  // POST ROUTES
  //

  const JSON_ROUTES = new Set([
  'req_config_ios_pub',
  'req_config_in_ana',
])

 const handlePostRouteRequest = async (
  route: string,
  payload: any,
  tcpClient: any
) => {

  const endpoint =
    postRoutes[
      route as keyof typeof postRoutes
    ]

  if (!endpoint) {
    addLog(route, 'system')
    return
  }

  try {

    const useJson = JSON_ROUTES.has(route)

const result = useJson
  ? await postJson(endpoint, payload)
  : await postForm(endpoint, payload)

const hasGatewayError =
  containsGatewayError(result)

const httpCode =
  hasGatewayError
    ? 500
    : 200

const response =
  buildResponse({
    sessionToken:
      sessionTokenRef.current,
    serial,
    command: route,
    httpCode,
    payload: result,
  })

await tcpClient.write(response)

    //
    // SAME LOGS AS BEFORE
    //
        addLog(
          formatJsonTable(payload),
          'support'
        )
        addLog(
          `${route}_response`,
          'device',
          true
        )
        addLog(
          formatJsonTable(result),
          'gateway'
        )

  } catch (err: any) {

    const response =
      buildResponse({
        sessionToken:
          sessionTokenRef.current,
        serial,
        command: route,
        httpCode: 500,
        payload: {
          error: err.message,
        },
      })

    console.log(
      'Response from BUILDRESPONSE:',
      {
        command: route,
        httpCode: 500,
        payload: {
          error: err.message,
        },
        serial,
        sessionToken:
          sessionTokenRef.current,
      }
    )

    await tcpClient.write(response)

    addLog(
      `Erro POST ${route}: ${err.message}`,
      'device'
    )

    addLog(
      `POST ${route} payload: ${JSON.stringify(payload)}`,
      'device'
    )
  }
}

  return {
    handleRouteRequest,
    handlePostRouteRequest,
  }
}