import React from 'react'
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native'
import RobotoText from '../../RobotoText'
import { containsGatewayError } from '../utils/containsGatewayError'
import { useT } from '@/hooks/useT'

interface ChatProps {
  scrollRef: any
  terminalLogs: any
  sessionToken: any
  setTerminalLogs: any
}

const Chat: React.FC<ChatProps> = ({
  scrollRef,
  terminalLogs,
  sessionToken,
  setTerminalLogs
}) => {

  const t = useT()

  return (
    <View style={styles.chatContainer}>

      <View style={styles.chatScroll}>
        <TouchableOpacity
          onPress={() => setTerminalLogs([])}
          style={{ alignSelf: 'flex-start', marginTop: 2, position: 'absolute', zIndex: 1, backgroundColor: '#ff0000', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 7 }}
        >
          <RobotoText style={{ color: '#ffffff', fontSize: 13, fontWeight: 'bold' }}>
            {t.System.Clear}
          </RobotoText>
        </TouchableOpacity>

      <ScrollView ref={scrollRef}>
        {terminalLogs.map((msg:any, idx:any) => {

          const isDevice = msg.type === 'device'
          const isSupport = msg.type === 'support'
          const isSystem = msg.type === 'system'
          const isGateway = msg.type === 'gateway'
          const isGatewayError =
            msg.type === 'gateway' &&
            containsGatewayError(msg.text)

          return (
            <View
              key={idx}
              style={[
                styles.messageRow,
                isDevice && styles.rowRight,
                isGateway && styles.rowRight,
                isGatewayError && styles.rowRight,
                isSupport && styles.rowLeft,
                isSystem && styles.rowCenter
              ]}
            >
              <View
                style={[
                  styles.bubble,
                  isDevice && styles.deviceBubble,
                  isGateway && styles.gatewayBubble,
                  isGatewayError && styles.gatewayErrorBubble,
                  isSupport && styles.supportBubble,
                  isSystem && styles.systemBubble,
                  msg.type === 'system' && styles.systemBubble
                ]}
              >
                <RobotoText
                 style={[
                  styles.messageText,
                  isDevice && styles.messageText,
                  isGateway && styles.messageText,
                  isGatewayError && styles.messageText,
                  isSupport && styles.messageText,
                  isSystem && styles.messageText,
                  msg.type === 'system' && styles.systemText
                ]}
                >{msg.text}</RobotoText>
              </View>
            </View>
          )
        })}
      </ScrollView>
    </View>
    </View>
  )
}

export default Chat

const styles = StyleSheet.create({

  chatContainer: {
    height: '70%',
    backgroundColor: '#beccf5ff',
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderColor: '#05163fff',
    borderWidth: 1
  },

  chatScroll: {
    flex: 1
  },

  messageRow: {
    flexDirection: 'row',
    marginVertical: 3
  },

  rowRight: {
    justifyContent: 'flex-end'
  },

  rowLeft: {
    justifyContent: 'flex-start'
  },

    rowCenter: {
    justifyContent: 'center'
  },

  bubble: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 15,
    maxWidth: '85%'
  },

  deviceBubble: {
    backgroundColor: '#66afdaff',
    borderBottomRightRadius: 4
  },

  supportBubble: {
    backgroundColor: '#abababff',
    borderBottomLeftRadius: 4

  },

  systemBubble: {
    alignSelf: 'center',
    marginVertical: -5,
    maxWidth: "95%"
  },

  gatewayBubble: {
    backgroundColor: 'rgb(138, 211, 124)',
    borderBottomRightRadius: 4,
  },

  gatewayErrorBubble: {
    backgroundColor: 'rgb(238, 114, 110)',
    borderBottomRightRadius: 4,
  },

  messageText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'semibold'
  },
    systemText: {
    fontSize: 12.3,
    color: '#555'
  },

})