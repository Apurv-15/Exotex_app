import { registerRootComponent } from 'expo';

// Register background tasks before the app starts
// Wrapped in try-catch to prevent startup freeze if native modules are missing
try {
  require('./src/services/BackgroundSyncTask');
} catch (e) {
  console.error('[index] Failed to load BackgroundSyncTask:', e);
}

import App from './App';


// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
