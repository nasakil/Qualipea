import React, { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { useFonts } from 'expo-font';
import { AppProvider } from './src/AppContext';
import Navigator from './src/Navigator';

export default function App() {
  const [fontsLoaded] = useFonts({
    'OpenRunde-Regular': require('./assets/fonts/OpenRunde-Regular.otf'),
    'OpenRunde-Medium': require('./assets/fonts/OpenRunde-Medium.otf'),
    'OpenRunde-Semibold': require('./assets/fonts/OpenRunde-Semibold.otf'),
    'OpenRunde-Bold': require('./assets/fonts/OpenRunde-Bold.otf'),
  });

  useEffect(() => {
    if (Platform.OS === 'web' && fontsLoaded && typeof document !== 'undefined') {
      const id = 'open-runde-global';
      if (!document.getElementById(id)) {
        const style = document.createElement('style');
        style.id = id;
        style.textContent = "body, input, textarea, button, [dir='auto'] { font-family: 'OpenRunde-Regular', system-ui, -apple-system, sans-serif; }";
        document.head.appendChild(style);
      }
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: '#08130d' }} />;
  }

  return <AppProvider><Navigator /></AppProvider>;
}
