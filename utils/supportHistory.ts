import AsyncStorage from '@react-native-async-storage/async-storage'

const STORAGE_KEY = 'SUPPORT_LOG_HISTORY'

export const saveLog = async (text: string, type: string) => {
  try {
    const now = new Date()
    const dateKey = now.toISOString().split('T')[0] // YYYY-MM-DD

    const stored = await AsyncStorage.getItem(STORAGE_KEY)
    const history = stored ? JSON.parse(stored) : {}

    if (!history[dateKey]) history[dateKey] = []

    history[dateKey].push(text)

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  } catch (err) {
    console.log('Error saving log', err)
  }
}

export const getLast30DaysHistory = async () => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY)
    if (!stored) return {}

    const history = JSON.parse(stored)
    const result: Record<string, string[]> = {}

    const now = new Date()

    Object.keys(history).forEach(date => {
      const logDate = new Date(date)
      const diff =
        (now.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24)

      if (diff <= 30) {
        result[date] = history[date]
      }
    })

    return result
  } catch {
    return {}
  }
}