import { NativeModules } from 'react-native';

type AndroidMobileDataType = {
  fetchUsingCellular(url: string): Promise<string>;
};

const LINKING_ERROR =
  `❌ AndroidMobileData is NOT linked.\n` +
  `Make sure you:\n` +
  `1. Rebuilt the app using: npx expo run:android\n` +
  `2. Added the Kotlin module under package com.allexo.alxmobile\n` +
  `3. Registered the package correctly.\n`;

const AndroidMobileData: AndroidMobileDataType =
  NativeModules.AndroidMobileData
    ? NativeModules.AndroidMobileData
    : new Proxy(
        {},
        {
          get() {
            throw new Error(LINKING_ERROR);
          },
        }
      ) as AndroidMobileDataType;

export default AndroidMobileData;
