import * as Sentry from '@sentry/react-native';
import React, { useState, useEffect } from 'react';
import { View, LogBox, Alert, Text, ActivityIndicator } from 'react-native';
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

/**
 * App - Entry Point (Debug Hardened)
 */

// 1. Attempt to keep splash visible, but we will hide it aggressively if it hangs
SplashScreen.preventAutoHideAsync().catch(e => console.warn('SplashScreen.preventAutoHideAsync failed', e));

// 2. Safe Sentry Init (DSN fallback to ensures Sentry.wrap works)
try {
  if (!__DEV__) {
    Sentry.init({
      dsn: process.env.EXPO_PUBLIC_SENTRY_DSN || 'https://c95856cca23d9890608273aa4f3821de@o4511118236647424.ingest.us.sentry.io/4511118241300480',
    });
  }
} catch (e) {
  console.error('Sentry init crashed top-level', e);
}

// 3. Register Global Handlers
registerGlobalHandlers();

function App() {
  const [appReady, setAppReady] = useState(false);
  const [bootStatus, setBootStatus] = useState('Initializing...');

  const [fontsLoaded, fontError] = useFonts({
    'Nunito-Regular': Nunito_400Regular,
    'Nunito-SemiBold': Nunito_600SemiBold,
    'Nunito-Bold': Nunito_700Bold,
    'Nunito-Black': Nunito_900Black,
  });

  useEffect(() => {
    let isMounted = true;

    const prepare = async () => {
      console.log('[DEBUG] 🚀 Starting Boot Sequence...');
      
      try {
        // ALWAYS hide splash screen after 2.5 seconds regardless of state 
        // to ensure user isn't stuck forever.
        setTimeout(() => {
          SplashScreen.hideAsync().catch(() => {});
          console.log('[DEBUG] 🛠️ Forced Splash Hide triggered.');
        }, 2500);

        // Init Core Services
        console.log('[DEBUG] 📡 Initializing SyncService...');
        SyncService.init();
        
        // Font Resolution: wait for fonts to be ready before marking appReady
        if (fontsLoaded || fontError) {
          console.log('[DEBUG] 🔠 Fonts Resolved. Status:', fontsLoaded ? 'Success' : 'Error');
          setBootStatus('Ready');
          
          if (isMounted) {
            setAppReady(true);
            await SplashScreen.hideAsync().catch(() => {});
          }
        }
        // If fonts are not loaded yet, the effect will re-run when they are (deps: [fontsLoaded, fontError])
      } catch (err) {
        console.error('[DEBUG] ❌ BOOT CRASHED:', err);
        if (isMounted) {
          setAppReady(true);
          await SplashScreen.hideAsync().catch(() => {});
        }
      }
    };

    prepare();

    // Safety timeout: force app to interactive state after 7 seconds.
    // Uses a ref-like closure check to avoid firing if fonts already resolved.
    const safetyTimeout = setTimeout(async () => {
      if (isMounted && !appReady) {
        console.warn('[App] Font/Service loading timeout. Forcing app start.');
        setBootStatus('Ready (Timeout)');
        setAppReady(true);
        await SplashScreen.hideAsync().catch(() => {});
      }
    }, 7000);

    return () => {
      isMounted = false;
      clearTimeout(safetyTimeout);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fontsLoaded, fontError]);

  if (!appReady) {
    // Show a minimal debug view if it takes too long
    return (
      <View style={{ flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={{ color: '#666', marginTop: 10 }}>{bootStatus}</Text>
      </View>
    );
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

export default Sentry.wrap(App);
