import { useCallback, useState } from 'react'

const BASE_URL = 'http://192.168.4.1'

/** Fast ping before doing GET */
async function isDeviceAlive() {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 1000)

    const res = await fetch(`${BASE_URL}/req_info_datalogger`, {
      method: 'GET',
      signal: controller.signal,
    })

    clearTimeout(timeout)
    return res.ok
  } catch {
    return false
  }
}

export default function useGETTCPInfo(endpoint: string) {
  const [isFetching, setIsFetching] = useState(false)
  const [isDeviceOnline, setIsDeviceOnline] = useState(true)

  /**
   * 🔥 MAIN FUNCTION: fetch fresh data ON DEMAND
   * returns data directly (NO state delay)
   */
  const getFreshData = useCallback(async () => {
    if (!endpoint) return {}

    const alive = await isDeviceAlive()
    setIsDeviceOnline(alive)

    if (!alive) {
      return {}
    }

    try {
      setIsFetching(true)

      const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'GET',
      })

      const text = await res.text()

console.log(
  `RAW GET (${endpoint}):`,
  text
)

if (!text) {
  return {}
}

try {

  const data =
    JSON.parse(text)

  return data ?? {}

} catch (err) {

  console.log(
    `INVALID JSON (${endpoint}):`,
    text
  )

  return {
    raw: text
  }
}
    } catch (err) {
      console.log(`GET TCP ERROR (${endpoint})`, err)
      return {}
    } finally {
      setIsFetching(false)
    }
  }, [endpoint])

  return {
    getFreshData,
    isFetching,
    isDeviceOnline,
  }
}