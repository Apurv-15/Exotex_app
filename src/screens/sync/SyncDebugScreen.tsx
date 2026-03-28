import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch } from 'react-native';
import { useSyncStore } from '../../store/SyncStore';
import { useSyncQueue } from '../../hooks/useSyncQueue';
import { SyncService } from '../../services/SyncService';
import { OfflineQueueService } from '../../services/OfflineQueueService';
import { NetworkStatusBadge } from '../../components/sync/NetworkStatusBadge';

export default function SyncDebugScreen() {
  const { isOnline, setIsOnline, queue, stats } = useSyncStore();
  const { forceSync, retryFailed } = useSyncQueue();
  const [networkConditioner, setNetworkConditioner] = useState(false);

  const handleCreateMockFailure = async () => {
    await OfflineQueueService.enqueue('CREATE', 'mock_testing_table', { test: 'data' }, 'mock-123', 'high');
    const queueData = await OfflineQueueService.loadQueue();
    const op = queueData.find(q => q.localId === 'mock-123');
    if (op) {
       await OfflineQueueService.handleFailure(op.id, 'Simulated forced network error');
    }
    await OfflineQueueService.loadQueue();
  };

  const toggleNetworkConditioner = () => {
     setNetworkConditioner(!networkConditioner);
     // Simulate forcing the app to drop network
     if (!networkConditioner) {
        setIsOnline(false); // Force offline
     } else {
        setIsOnline(true);
     }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Sync Debug & Monitoring</Text>
      
      <View style={styles.card}>
         <Text style={styles.sectionTitle}>Network Link Conditioner</Text>
         <View style={styles.row}>
            <Text style={styles.label}>Force Offline Mode</Text>
            <Switch value={networkConditioner} onValueChange={toggleNetworkConditioner} />
         </View>
         <View style={styles.mt}>
           <NetworkStatusBadge />
         </View>
      </View>

      <View style={styles.card}>
         <Text style={styles.sectionTitle}>Actions</Text>
         
         <Pressable style={styles.btn} onPress={forceSync}>
            <Text style={styles.btnText}>Force Background Sync</Text>
         </Pressable>
         <Pressable style={[styles.btn, { backgroundColor: '#EF4444' }]} onPress={handleCreateMockFailure}>
            <Text style={styles.btnText}>Inject Failed Operation</Text>
         </Pressable>
      </View>

      <View style={styles.card}>
         <Text style={styles.sectionTitle}>Analytics</Text>
         <Text>Total Operations: {stats.totalOperations}</Text>
         <Text>Successful: {stats.successfulOperations}</Text>
         <Text>Failed: {stats.failedOperations}</Text>
         <Text>Last Sync: {stats.lastSyncTime ? new Date(stats.lastSyncTime).toLocaleString() : 'Never'}</Text>
      </View>

      <View style={styles.card}>
         <Text style={styles.sectionTitle}>Raw Queue Inspection ({queue.length})</Text>
         {queue.map(item => (
            <View key={item.id} style={styles.queueItem}>
               <Text style={styles.queueId}>ID: {item.id}</Text>
               <Text>Status: {item.status}</Text>
               <Text>Type: {item.type}</Text>
               <Text>Table: {item.table}</Text>
               <Text>Retries: {item.retryCount} / {item.maxRetries}</Text>
               {item.lastError && (
                 <Text style={{ color: 'red' }}>Error: {item.lastError}</Text>
               )}
            </View>
         ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    color: '#111827',
  },
  card: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    elevation: 2,
    shadowOffset: { width: 0, height: 1}
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
  },
  mt: {
    marginTop: 12,
  },
  btn: {
    backgroundColor: '#3B82F6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  btnText: {
    color: '#FFF',
    fontWeight: '600'
  },
  queueItem: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  queueId: {
    fontWeight: '700',
    fontSize: 12,
    marginBottom: 4,
  }
});
