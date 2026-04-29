import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Dimensions, StatusBar, SafeAreaView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { logger } from '../logging/Logger';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * GlobalErrorBoundary - The last line of defense against UI crashes.
 * It catches render errors and displays a user-friendly recovery screen
 * instead of the OS force-closing the app.
 */
export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    try {
      // Log to our internal system and Sentry
      logger.error('GlobalErrorBoundary', `UI Crash detected: ${error.message}`, {
        stack: errorInfo.componentStack,
      });
    } catch (_) {
      // If logger itself fails, don't crash the error boundary
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // Fallback UI - Rendered when any child component crashes
      return (
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.container}>
            <View style={styles.content}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="alert-circle-outline" size={60} color="#EF4444" />
              </View>

              <Text style={styles.title}>Something went wrong</Text>
              <Text style={styles.message}>
                An unexpected error occurred in the application UI. Our team has been notified.
              </Text>

              {__DEV__ && this.state.error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText} numberOfLines={5}>
                    {String(this.state.error)}
                  </Text>
                </View>
              ) : null}

              <Pressable
                style={({ pressed }) => [
                  styles.btn,
                  pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }
                ]}
                onPress={this.handleReset}
              >
                <Text style={styles.btnText}>Try to Recover</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.secondaryBtn,
                  pressed && { opacity: 0.7 }
                ]}
                onPress={() => {
                  try {
                    logger.info('UserAction', 'User reporting crash manually');
                    alert('Error reported to support team.');
                  } catch (e) {}
                }}
              >
                <Text style={styles.secondaryBtnText}>Report to Super Admin</Text>
              </Pressable>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>EKOTEX Warranty Management v1.2.7</Text>
            </View>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  errorBox: {
    width: '100%',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  errorText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#EF4444',
  },
  btn: {
    backgroundColor: '#7C3AED',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    marginTop: 20,
    padding: 10,
  },
  secondaryBtnText: {
    color: '#7C3AED',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});
