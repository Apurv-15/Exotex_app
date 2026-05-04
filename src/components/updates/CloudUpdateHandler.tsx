import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ActivityIndicator } from 'react-native';
import * as Updates from 'expo-updates';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { logger } from '../../core/logging/Logger';

/**
 * CloudUpdateHandler - Professional OTA Update Prompt
 * This component monitors for new updates from Expo Cloud and 
 * prompts the user to reload the app when an update is downloaded.
 */
export const CloudUpdateHandler = () => {
  const {
    isUpdateAvailable,
    isUpdatePending,
  } = Updates.useUpdates();

  const [visible, setVisible] = useState(false);

  // 1. If an update is available on the server, fetch it automatically
  useEffect(() => {
    if (isUpdateAvailable) {
      logger.info('Updates', 'Update available on server, fetching...');
      Updates.fetchUpdateAsync().catch((err) => {
        logger.error('Updates', 'Failed to fetch update', { details: err });
      });
    }
  }, [isUpdateAvailable]);

  // 2. Once the update is downloaded (pending), show the professional prompt
  useEffect(() => {
    if (isUpdatePending) {
      logger.info('Updates', 'Update downloaded and pending, showing prompt');
      setVisible(true);
    }
  }, [isUpdatePending]);

  const handleReload = async () => {
    try {
      logger.info('Updates', 'User confirmed update, reloading app...');
      await Updates.reloadAsync();
    } catch (error) {
      logger.error('Updates', 'Failed to reload app', { details: error });
    }
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="rocket-launch" size={40} color="#7C3AED" />
          </View>
          
          <Text style={styles.title}>Update Available!</Text>
          
          <Text style={styles.description}>
            A new version of Ekotex is ready with improvements and fixes. Restart now to get the best experience.
          </Text>

          <View style={styles.buttonContainer}>
            <Pressable 
              style={[styles.button, styles.primaryButton]}
              onPress={handleReload}
            >
              <Text style={styles.buttonText}>Restart Now</Text>
            </Pressable>
            
            <Pressable 
              style={[styles.button, styles.secondaryButton]}
              onPress={() => setVisible(false)}
            >
              <Text style={styles.secondaryButtonText}>Later</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#7C3AED',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  }
});
