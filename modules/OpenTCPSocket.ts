import { NativeModules, NativeEventEmitter } from 'react-native';

type OpenTCPSocketType = {
  openTcpSocket(host: string, port: number): Promise<string>;
  sendTcpData(data: string): Promise<string>;
  closeTcpSocket(): Promise<string>;
};

const LINKING_ERROR = `
❌ OpenTCPSocket is NOT linked.
Make sure you:
1. Rebuilt the app using: npx expo run:android
2. Added the Kotlin module under package com.jackslice2.ALXMobile
3. Registered the package correctly.
`;

const OpenTCPSocket: OpenTCPSocketType = NativeModules.OpenTCPSocket
  ? NativeModules.OpenTCPSocket
  : new Proxy(
      {},
      { get() { throw new Error(LINKING_ERROR) } }
    ) as OpenTCPSocketType;

const eventEmitter = new NativeEventEmitter(NativeModules.OpenTCPSocket);

export const listenTcpMessages = (callback: (msg: string) => void) => {
  const sub = eventEmitter.addListener('TcpMessage', callback);
  return () => sub.remove();
};

export const listenTcpStatus = (callback: (status: string) => void) => {
  const sub = eventEmitter.addListener('TcpStatus', callback);
  return () => sub.remove();
};

export const listenTcpErrors = (callback: (err: string) => void) => {
  const sub = eventEmitter.addListener('TcpError', callback);
  return () => sub.remove();
};

export default OpenTCPSocket;