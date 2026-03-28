import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Dimensions, StatusBar, SafeAreaView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { logger } from '../logging/Logger';
import { THEME } from '../../constants/theme';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * GlobalErrorBoundary - A high-level safety net for the application UI.
 */
export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('GlobalErrorBoundary', `UI Crash detected: ${error.message}`, {
      stack: errorInfo.componentStack,
    });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="dark-content" />
          <LinearGradient
            colors={['#F8FAFC', '#F1F5F9']}
            style={styles.gradient}
          >
            <View style={styles.content}>
              <View style={styles.iconWrapper}>
                <LinearGradient
                  colors={['#EF4444', '#B91C1C']}
                  style={styles.iconCircle}
                >
                  <MaterialCommunityIcons name="alert-octagon" size={48} color="white" />
                </LinearGradient>
              </View>

              <Text style={styles.title}>Something went wrong</Text>
              <Text style={styles.message}>
                An unexpected error occurred in the application UI. Our team has been notified.
              </Text>

              {__DEV__ && this.state.error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText} numberOfLines={5}>
                    {this.state.error.toString()}
                  </Text>
                </View>
              )}

              <View style={styles.actionContainer}>
                <Pressable
                  style={({ pressed }) => [
                    styles.retryButton,
                    pressed && { transform: [{ scale: 0.98 }] }
                  ]}
                  onPress={this.handleRetry}
                >
                  <LinearGradient
                    colors={['#3B82F6', '#2563EB']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.btnGradient}
                  >
                    <MaterialCommunityIcons name="refresh" size={20} color="white" />
                    <Text style={styles.btnText}>Try to Recover</Text>
                  </LinearGradient>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    pressed && { opacity: 0.7 }
                  ]}
                  onPress={() => logger.info('UserAction', 'User reporting crash manually')}
                >
                  <Text style={styles.secondaryBtnText}>Report to Super Admin</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Warranty Management System v1.0</Text>
            </View>
          </LinearGradient>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  iconWrapper: {
    marginBottom: 24,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontFamily: THEME.fonts.black,
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    fontFamily: THEME.fonts.body,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  errorBox: {
    backgroundColor: '#FFF1F2',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECDD3',
    width: '100%',
    marginBottom: 32,
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#9F1239',
  },
  actionContainer: {
    width: '100%',
    gap: 16,
  },
  retryButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
  },
  btnGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  btnText: {
    fontSize: 16,
    fontFamily: THEME.fonts.bold,
    color: 'white',
  },
  secondaryButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: 15,
    fontFamily: THEME.fonts.bold,
    color: '#3B82F6',
  },
  footer: {
    position: 'absolute',
    bottom: 32,
  },
  footerText: {
    fontSize: 12,
    fontFamily: THEME.fonts.semiBold,
    color: '#94A3B8',
  },
});
