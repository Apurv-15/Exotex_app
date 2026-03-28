import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useOfflineForm } from '../../hooks/useOfflineForm';
import { SyncStatusBanner } from '../../components/sync/SyncStatusBanner';
import { NetworkStatusBadge } from '../../components/sync/NetworkStatusBadge';

export default function ExampleOfflineForm() {
  const { submit, isOffline, syncStatus } = useOfflineForm('registrations');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'User'
  });

  const handleSubmit = async () => {
    if (!formData.name || !formData.email) {
      alert('Please fill all fields');
      return;
    }

    try {
      // The useOfflineForm handles everything: Enqueueing securely, and syncing if online
      await submit(
         { ...formData, created_at: new Date().toISOString() }, 
         { type: 'CREATE', priority: 'high' }
      );
      
      alert(isOffline ? 'Saved offline! Will sync when connection is restored.' : 'Successfully registered!');
      
      setFormData({ name: '', email: '', role: 'User' });
    } catch (err) {
      alert('Error saving data');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Offline Registration Example</Text>
      
      <SyncStatusBanner />

      <ScrollView contentContainerStyle={styles.formContent}>
        <View style={styles.badgeRow}>
          <NetworkStatusBadge />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(v) => setFormData(prev => ({ ...prev, name: v }))}
            placeholder="John Doe"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            value={formData.email}
            onChangeText={(v) => setFormData(prev => ({ ...prev, email: v }))}
            placeholder="john@example.com"
            keyboardType="email-address"
          />
        </View>

        <Pressable 
          style={[styles.submitBtn, syncStatus === 'saving' && styles.disabledBtn]}
          onPress={handleSubmit}
          disabled={syncStatus === 'saving'}
        >
          {syncStatus === 'saving' ? (
             <ActivityIndicator color="#FFF" />
          ) : (
             <Text style={styles.submitBtnText}>Register User</Text>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB'
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    padding: 16,
    paddingTop: 60,
    backgroundColor: '#FFF'
  },
  formContent: {
    padding: 16,
  },
  badgeRow: {
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  submitBtn: {
    backgroundColor: '#4F46E5',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  disabledBtn: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  }
});
