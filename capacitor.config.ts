import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ruraleridesgo.app',
  appName: 'Rural ERides GO',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
