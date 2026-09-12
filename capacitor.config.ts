import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize, KeyboardStyle } from '@capacitor/keyboard';

const config: CapacitorConfig = {
  appId: 'com.blackjack.trainer',
  appName: 'Blackjack Trainer',
  webDir: 'dist/trainer/browser',
  backgroundColor: '#071116',
  plugins: {
    StatusBar: {
      overlaysWebView: true,
      style: 'DARK',
    },
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      launchFadeOutDuration: 250,
      backgroundColor: '#071116',
      showSpinner: false,
    },
    Keyboard: {
      resize: KeyboardResize.Body,
      style: KeyboardStyle.Dark,
      resizeOnFullScreen: true,
      autoBackdropColor: 'auto',
    },
  },
};

export default config;
