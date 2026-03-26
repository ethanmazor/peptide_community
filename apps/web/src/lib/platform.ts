import { Capacitor } from '@capacitor/core'

/** True when running inside a native iOS/Android app shell */
export const isNative = Capacitor.isNativePlatform()

/** True when running in a web browser (including PWA) */
export const isWeb = !isNative
