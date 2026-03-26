import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'community.peptide.app',
  appName: 'Peptide Tracker',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 800,
      backgroundColor: '#0a0a0a',
      showSpinner: false,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#0a0a0a',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    Camera: {
      permissions: ['photos', 'camera'],
    },
  },
  ios: {
    scheme: 'peptidetracker',
    contentInset: 'always',
  },
  android: {
    allowMixedContent: false,
  },
}

export default config
