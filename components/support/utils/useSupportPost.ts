import { useCallback, useState } from 'react'

export default function useSupportPost(
  baseUrl: string,
  addLog?: (
    msg: string,
    type?: 'system' | 'support' | 'device' | 'gateway',
    shouldParse?: boolean

  ) => void
) {
  const [loading, setLoading] =
    useState(false)

  const [postMap, setPostMap] =
    useState<Record<string, any>>({})

  const [timestamps, setTimestamps] =
    useState<Record<string, number>>(
      {}
    )

  const postToEndpoint =
    useCallback(
      async (
        endpoint: string,
        payload: any
      ) => {
        const fullUrl =
          `${baseUrl}${endpoint}`

        try {
          setLoading(true)

          //
          // RAW JSON BODY
          //
          const rawBody =
            JSON.stringify(
              payload,
              null,
              2
            )

          // LOG REQUEST

          //addLog?.(
          //  `JSON PAYLOAD:\n${rawBody}`,
          //  'support'
          //)

          // FETCH
          const response =
            await fetch(fullUrl, {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body: rawBody,
            })
          // RAW RESPONSE
          const text =
            await response.text()

          //addLog?.(
          //  text,
          //  'gateway'
          //)
          // PARSE RESPONSE
          let parsed: any = text

          // STORE
          setPostMap(prev => ({
            ...prev,
            [endpoint]: parsed,
          }))

          setTimestamps(prev => ({
            ...prev,
            [endpoint]: Date.now(),
          }))

          return parsed
        } catch (err: any) {
          addLog?.(
            `❌ POST ERROR:\n${err.message}`,
            'system'
          )

          throw err
        } finally {
          setLoading(false)
        }
      },
      [baseUrl, addLog]
    )

  return {
    loading,
    postMap,
    timestamps,
    postToEndpoint,
  }
}