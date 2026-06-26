type BuildResponseParams = {
  sessionToken: string | null
  serial: string

  command: string
  httpCode: number
  payload: any
}

export const buildResponse = ({
  sessionToken,
  serial,
  command,
  httpCode,
  payload,
}: BuildResponseParams) => {
  console.log('Response from BUILDRESPONSE:', {
    sessionToken,
    serial,
    command,
    httpCode,
    payload,
  })

  return (
    `token=${sessionToken};` +
    `command=${command};` +
    `serial_id=${serial};` +
    `http_code=${httpCode};` +
    `json=${JSON.stringify(payload)}`
  )
}