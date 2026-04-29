import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import { View, ActivityIndicator, LogBox, Alert, AppState, AppStateStatus } from 'react-native';

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
import * as Sentry from '@sentry/react-native';
import { SyncService } from './src/services/SyncService';
import { registerBackgroundSync } from './src/services/BackgroundSyncTask';
import { GlobalOfflinePopup } from './src/components/sync/GlobalOfflinePopup';

import { registerGlobalHandlers } from './src/core/errors/GlobalHandlers';
import { GlobalErrorBoundary } from './src/core/errors/GlobalErrorBoundary';
import { logger } from './src/core/logging/Logger';

// 🚀 SENTRY INITIALIZATION — wrapped in try/catch: a bad DSN must never freeze the app
try {
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    debug: __DEV__,
    enableLogs: true,
  });
} catch (e) {
  console.warn('[App] Sentry init failed (non-fatal):', e);
}

// Register system-level listeners — wrapped so setup failure never blocks startup
try {
  registerGlobalHandlers();
} catch (e) {
  console.warn('[App] registerGlobalHandlers failed (non-fatal):', e);
}

// Prevent auto-hide — wrapped because this can throw if native module not ready
try {
  SplashScreen.preventAutoHideAsync();
} catch (e) {
  console.warn('[App] SplashScreen.preventAutoHideAsync failed (non-fatal):', e);
}

function App() {
  const [fontsLoaded, fontError] = useFonts({
    'Nunito-Regular': Nunito_400Regular,
    'Nunito-SemiBold': Nunito_600SemiBold,
    'Nunito-Bold': Nunito_700Bold,
    'Nunito-Black': Nunito_900Black,
  });

  const [appReady, setAppReady] = useState(false);

  // Step 1: Initialize services once on mount (NOT tied to font state)
  useEffect(() => {
    try { SyncService.init(); } catch (e) { console.warn('[App] SyncService.init failed:', e); }
    try { registerBackgroundSync(); } catch (e) { console.warn('[App] registerBackgroundSync failed:', e); }
  }, []);

  // Step 2: Hide splash only when fonts are definitively done loading
  useEffect(() => {
    let isMounted = true;

    if (!fontsLoaded && !fontError) {
      // Fonts still loading — keep waiting, but add an absolute safety timeout
      // so the app never stays on the splash screen forever if fonts hang.
      const fontTimeout = setTimeout(() => {
        if (isMounted) {
          console.warn('[App] Font loading timed out after 8s, forcing app ready.');
          setAppReady(true);
          SplashScreen.hideAsync().catch(() => {});
        }
      }, 8000);
      return () => {
        isMounted = false;
        clearTimeout(fontTimeout);
      };
    }

    async function finishLoading() {
      try {
        if (isMounted) {
          setAppReady(true);
        }
        await SplashScreen.hideAsync();
      } catch (e) {
        // SplashScreen.hideAsync can throw if splash was already hidden — safe to ignore
        console.warn('SplashScreen.hideAsync error (non-critical):', e);
      }
    }

    finishLoading();

    return () => {
      isMounted = false;
    };
  }, [fontsLoaded, fontError]);

  // Step 3: Check for OTA updates ONLY after app is fully interactive
  useEffect(() => {
    if (!appReady) return;
    if (__DEV__) return;

    let isMounted = true;

    async function handleCheckUpdates() {
      try {
        const Updates = require('expo-updates');
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable && isMounted) {
          await Updates.fetchUpdateAsync();
          Alert.alert(
            'Important Update Available',
            'A new version of EKOTEX is ready. Restarting now will apply the latest dashboard and data fixes.\n\nWould you like to restart now?',
            [
              { text: 'Later', style: 'cancel' },
              { text: 'Restart Now', style: 'default', onPress: () => Updates.reloadAsync() }
            ]
          );
        }
      } catch (e) {
        console.warn('Update check failed:', e);
      }
    }

    // Delay initial check by 3s to avoid blocking the freshly-rendered UI
    const initialCheckTimer = setTimeout(handleCheckUpdates, 3000);

    // Listen for foreground updates only after app is ready
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && isMounted) {
        handleCheckUpdates();
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(initialCheckTimer);
      subscription.remove();
    };
  }, [appReady]);

  // Show error if fonts failed to load
  if (fontError) {
    console.error('Font loading error:', fontError);
    // Continue anyway with system fonts
  }

  if (!appReady) {
    return null;
  }

  return (
    <GlobalErrorBoundary>
      <SafeAreaProvider>
        <PaperProvider>
          <AuthProvider>
            <RootNavigator />
            <GlobalOfflinePopup />
          </AuthProvider>
        </PaperProvider>
      </SafeAreaProvider>
    </GlobalErrorBoundary>
  );
}

export default Sentry.wrap(App);
