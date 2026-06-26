import { saveLog } from '@/utils/supportHistory'
import { useSupportMessageMap } from '../useSupportMessagesMap'

type LogType =
  | 'system'
  | 'support'
  | 'device'
  | 'gateway'

type TerminalLog = {
  text: string
  type: LogType
}

type SetLogs = React.Dispatch<
  React.SetStateAction<TerminalLog[]>
>

export const useCreateSupportLogger = (
  setTerminalLogs: SetLogs,
  scrollRef: any
) => {
  const addRawLog = (msg: string) => {
    console.log('📥 RAW SERVER:', msg)

    setTerminalLogs(prev => [
      ...prev,
      {
        text: `RAW SERVER: ${msg}`,
        type: 'support',
      },
    ])
  }

  const supportMessageMap = useSupportMessageMap()

  const addLog = (
    msg: string,
    fallbackType: LogType = 'system'
  ) => {
    const parsed = supportMessageMap[msg]

    const displayText =
      parsed?.userMessage ?? msg

    const displayType =
      parsed?.type ?? fallbackType

    console.log(displayText)

    setTerminalLogs(prev => [
      ...prev,
      {
        text: displayText,
        type: displayType,
      },
    ])

    saveLog(displayText, displayType)

    setTimeout(() => {
      scrollRef.current?.scrollToEnd({
        animated: true,
      })
    }, 100)
  }

  return {
    addLog,
    addRawLog,
  }
}