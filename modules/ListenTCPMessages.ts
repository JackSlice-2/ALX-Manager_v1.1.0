import { NativeEventEmitter, NativeModules } from 'react-native'

const { OpenTCPSocket } = NativeModules

export const ListenTcpMessages = (callback: (msg: string) => void) => {
  const emitter = new NativeEventEmitter(OpenTCPSocket)
  const subscription = emitter.addListener('TcpMessage', callback)

  return () => subscription.remove()
}