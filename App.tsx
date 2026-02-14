import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import { View, Text, ActivityIndicator, LogBox } from 'react-native';

// Ignore specific deprecation warnings from dependencies
LogBox.ignoreLogs(['TouchableMixin is deprecated']);
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation';
import {
  useFonts,
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_900Black
} from '@expo-google-fonts/nunito';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    'Nunito-Regular': Nunito_400Regular,
    'Nunito-SemiBold': Nunito_600SemiBold,
    'Nunito-Bold': Nunito_700Bold,
    'Nunito-Black': Nunito_900Black,
  });

  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Wait for fonts
        if (fontsLoaded || fontError) {
          await SplashScreen.hideAsync();
          setAppReady(true);
        }
      } catch (e) {
        console.warn('Error preparing app:', e);
        // Still try to show the app
        setAppReady(true);
      }
    }

    prepare();
  }, [fontsLoaded, fontError]);

  // Show error if fonts failed to load
  if (fontError) {
    console.error('Font loading error:', fontError);
    // Continue anyway with system fonts
  }

  if (!appReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <PaperProvider>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
