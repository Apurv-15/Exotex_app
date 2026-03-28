import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

export const GlobalOfflinePopup = () => {
  const { isOnline } = useNetworkStatus();
  const [visible, setVisible] = useState(false);
  const [hasShownThisSession, setHasShownThisSession] = useState(false);

  useEffect(() => {
    // Show the popup if offline and haven't shown it yet in this offline cycle
    if (!isOnline && !hasShownThisSession) {
      setVisible(true);
      setHasShownThisSession(true);
    } else if (isOnline) {
      // Reset the trigger so it can show again if they go offline again later
      setHasShownThisSession(false);
      setVisible(false);
    }
  }, [isOnline, hasShownThisSession]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={() => setVisible(false)}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="wifi-off" size={48} color="#EF4444" />
          </View>
          
          <Text style={styles.title}>You are Offline</Text>
          
          <Text style={styles.description}>
            The app may not load some data, but don't worry! You can still fill out forms and save your work.
          </Text>
          
          <Text style={styles.subtitle}>
            Your data will be securely stored and automatically synced once your connection is restored.
          </Text>

          <Pressable 
            style={styles.button}
            onPress={() => setVisible(false)}
          >
            <Text style={styles.buttonText}>Got It, Continue Offline</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  }
});
