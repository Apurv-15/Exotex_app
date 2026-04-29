import * as Sentry from '@sentry/react-native';
import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, LogBox, Alert, AppState, AppStateStatus } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import * as SplashScreen from 'expo-splash-screen';
import { 
  useFonts, 
  Nunito_400Regular, 
  Nunito_600SemiBold, 
  Nunito_700Bold,
  Nunito_900Black
} from '@expo-google-fonts/nunito';

import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation';
import { GlobalOfflinePopup } from './src/components/sync/GlobalOfflinePopup';
import { GlobalErrorBoundary } from './src/core/errors/GlobalErrorBoundary';
import { registerGlobalHandlers } from './src/core/errors/GlobalHandlers';

// Keep splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {});

// Initialize Global Handlers (JS-level error swallowing)
registerGlobalHandlers();

/**
 * App - Entry Point
 * Hardened with try/catch and safety timeouts for production stability.
 */
function App() {
  const [appReady, setAppReady] = useState(false);
  const [fontsLoaded, fontError] = useFonts({
    'Nunito-Regular': Nunito_400Regular,
    'Nunito-SemiBold': Nunito_600SemiBold,
    'Nunito-Bold': Nunito_700Bold,
    'Nunito-Black': Nunito_900Black,
  });

  // Step 1: Initialize services once on mount
  useEffect(() => {
    let isMounted = true;
    
    const initApp = async () => {
      try {
        // Suppress noisy logs in production
        LogBox.ignoreAllLogs();
        
        // Wrap Sentry initialization in try-catch
        try {
          // Note: DSN is provided via environment or kept as-is
          // Sentry.init({ dsn: 'YOUR_DSN' });
        } catch (sentryErr) {
          console.warn('[App] Sentry init failed:', sentryErr);
        }
      } catch (err) {
        console.error('[App] Root initialization error:', err);
      }
    };

    initApp();

    // Font loading safety timeout: force ready after 8 seconds
    // prevents permanent splash screen freeze on low-end devices
    const fontTimeout = setTimeout(() => {
      if (isMounted && !appReady) {
        console.warn('[App] Font loading timeout, forcing app start.');
        finishLoading();
      }
    }, 8000);

    return () => {
      isMounted = false;
      clearTimeout(fontTimeout);
    };
  }, []);

  // Step 2: Handle font resolution
  useEffect(() => {
    if (fontsLoaded || fontError) {
      finishLoading();
    }
  }, [fontsLoaded, fontError]);

  const finishLoading = () => {
    setAppReady(true);
    SplashScreen.hideAsync().catch(() => {});
  };

  // Step 3: Check for OTA updates ONLY after app is interactive
  useEffect(() => {
    if (!appReady) return;

    const checkUpdates = async () => {
      try {
        const Updates = require('expo-updates');
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          Alert.alert(
            'Update Available',
            'A new version is ready. Restart now to apply?',
            [
              { text: 'Later', style: 'cancel' },
              { text: 'Restart', style: 'default', onPress: () => Updates.reloadAsync() }
            ]
          );
        }
      } catch (e) {
        // Silent: update check failures shouldn't bother user
      }
    };

    // Check 2 seconds after ready
    const timer = setTimeout(checkUpdates, 2000);
    return () => clearTimeout(timer);
  }, [appReady]);

  if (!appReady) {
    return null;
  }

  return (
    <GlobalErrorBoundary>
      <SafeAreaProvider>
        <PaperProvider>
          <AuthProvider>
            <View style={{ flex: 1 }}>
              <RootNavigator />
              <GlobalOfflinePopup />
            </View>
          </AuthProvider>
        </PaperProvider>
      </SafeAreaProvider>
    </GlobalErrorBoundary>
  );
}

// Sentry.wrap provides additional error context for UI crashes
export default Sentry.wrap(App);
