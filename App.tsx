import * as Sentry from '@sentry/react-native';
import React, { useState, useEffect } from 'react';
import { View, LogBox, Alert } from 'react-native';
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
import { SyncService } from './src/services/SyncService';
import { registerBackgroundSync } from './src/services/BackgroundSyncTask';

// 1. Keep splash visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {});

// 2. Initialize Sentry with the DSN from environment
// This prevents Sentry.wrap from hanging or crashing
if (!__DEV__) {
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN || 'https://c95856cca23d9890608273aa4f3821de@o4511118236647424.ingest.us.sentry.io/4511118241300480',
    enableNative: true,
  });
}

// 3. Register system-level listeners (JS & Native unhandled crashes)
registerGlobalHandlers();

function App() {
  const [appReady, setAppReady] = useState(false);
  const [fontsLoaded, fontError] = useFonts({
    'Nunito-Regular': Nunito_400Regular,
    'Nunito-SemiBold': Nunito_600SemiBold,
    'Nunito-Bold': Nunito_700Bold,
    'Nunito-Black': Nunito_900Black,
  });

  useEffect(() => {
    let isMounted = true;

    const prepare = async () => {
      try {
        // Suppress noisy logs in production, but keep visible in Dev for debugging
        if (!__DEV__) {
          LogBox.ignoreAllLogs();
        }
        
        // 1. Initialize Sync Services
        SyncService.init();
        
        // 2. Register Background Task (Non-blocking)
        registerBackgroundSync().catch(e => {
           console.warn('[App] Background task registration failed:', e);
        });

        // 3. Handle Font Resolution
        if (fontsLoaded || fontError) {
          if (fontError) {
            console.error('[App] Font loading failed:', fontError);
          }
          
          // Small delay to ensure everything is mounted
          setTimeout(async () => {
            if (isMounted) {
              setAppReady(true);
              await SplashScreen.hideAsync().catch(() => {});
            }
          }, 100);
        }
      } catch (err) {
        console.error('[App] Critical Initialization Error:', err);
        // Fallback: force app start so it doesn't freeze on splash
        if (isMounted) {
          setAppReady(true);
          await SplashScreen.hideAsync().catch(() => {});
        }
      }
    };

    prepare();

    // 4. Global Safety Timeout: force app to interactive state after 7 seconds
    // This is the "kill switch" for the splash screen freeze.
    const safetyTimeout = setTimeout(async () => {
      if (isMounted && !appReady) {
        console.warn('[App] Font/Service loading timeout. Forcing app start.');
        setAppReady(true);
        await SplashScreen.hideAsync().catch(() => {});
      }
    }, 7000);

    return () => {
      isMounted = false;
      clearTimeout(safetyTimeout);
    };
  }, [fontsLoaded, fontError]);

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
