import React, { useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import Chat from '@/components/support/client/Chat'
import { useT } from '@/hooks/useT'
import SupportHistory from './SupportHistory'

interface SupportCLientProps {
    connecting: boolean
    connected: boolean
    sessionToken: string | null
    scrollRef: any
    terminalLogs: any
    setTerminalLogs: any
    setSessionToken: any
    addLog: any
    client: any
    sessionTokenRef: any
    serialSentRef: any
    handleConnect: any
    setConnecting: any
    setConnected: any
}

const SupportClient: React.FC<SupportCLientProps> = ({
    connecting,
    sessionToken,
    scrollRef,
    terminalLogs,
    setTerminalLogs,
    setSessionToken,
    addLog,
    client,
    sessionTokenRef,
    serialSentRef,
    handleConnect,
    setConnecting,
    setConnected,
    connected
}) => {
    const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({})
    const [showHistory, setShowHistory] = useState(false)
      
    const t = useT()

    const toggleDate = (date: string) => {
        setExpandedDates(prev => ({
          ...prev,
          [date]: !prev[date],
        }))
      }

     const handleConnectToggle = async () => {
  // DISCONNECT

  if (connected || connecting) {
    try {
      addLog(
        'Encerrando conexão...',
        'system',
        false
      )

      setConnecting(false)
      setConnected(false)

      if (client) {
        await client.close()
      }

      setSessionToken(null)

      sessionTokenRef.current =
        null

      serialSentRef.current =
        false

      addLog(
        'Conexão encerrada',
        'support',
        false
      )
    } catch (err: any) {
      addLog(
        `Erro ao desconectar: ${err.message}`,
        'system',
        false
      )
    }

    return
  }

  // CONNECT

  await handleConnect()
}

  return (
    <>
      <View style={styles.container}>
        <View style={styles.formContainer}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={styles.pageTitle}>{t.Support.text0}</Text>

            <TouchableOpacity
              style={styles.button}
              onPress={() => setShowHistory(true)}
            >
              <Text style={styles.buttonText}>{t.Support.text1}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.descriptionText}>
            {t.Support.text2}
          </Text>

            <TouchableOpacity
              style={[
                styles.button
              ]}
              onPress={handleConnectToggle}
            >
            <Text style={styles.buttonText}>
              {connecting
                ? 'Cancelar'
                : connected
                ? t.System.Disconnect
                : t.Support.text3}
            </Text>
          </TouchableOpacity>

          <Chat
            scrollRef={scrollRef}
            terminalLogs={terminalLogs}
            sessionToken={sessionToken}
            setTerminalLogs={setTerminalLogs}
          />
        </View>
      </View>

      <SupportHistory
        visible={showHistory}
        onClose={() => setShowHistory(false)}
        showHistory={showHistory}
        setShowHistory={setShowHistory}
        expandedDates={expandedDates}
        toggleDate={toggleDate}
      />
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f4',
  },

  formContainer: {
    backgroundColor: '#fff',
    padding: 20,
    flex: 1,
  },

  pageTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
  },

  button: {
    backgroundColor: '#0b82c7',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
    padding: 10,
  },

  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  descriptionText: {
    color: '#555',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
})

export default SupportClient