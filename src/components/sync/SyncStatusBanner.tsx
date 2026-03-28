import React from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useSyncQueue } from '../../hooks/useSyncQueue';

export const SyncStatusBanner = () => {
  const { isOnline, isSyncing } = useNetworkStatus();
  const { pendingCount, failedCount, forceSync } = useSyncQueue();
  const [expanded, setExpanded] = React.useState(false);

  // Auto-collapse if empty
  if (pendingCount === 0 && failedCount === 0 && isOnline) return null;

  return (
    <View style={styles.container}>
      <Pressable style={styles.header} onPress={() => setExpanded(!expanded)}>
        <View style={styles.leftGroup}>
           {!isOnline ? (
               <MaterialCommunityIcons name="cloud-off-outline" size={24} color="#EF4444" />
           ) : isSyncing ? (
               <MaterialCommunityIcons name="cloud-sync-outline" size={24} color="#F59E0B" />
           ) : failedCount > 0 ? (
               <MaterialCommunityIcons name="cloud-alert-outline" size={24} color="#EF4444" />
           ) : (
               <MaterialCommunityIcons name="cloud-upload-outline" size={24} color="#3B82F6" />
           )}
           <View style={styles.textStack}>
               {!isOnline ? (
                 <Text style={[styles.title, { color: '#EF4444' }]}>You are offline</Text>
               ) : isSyncing ? (
                 <Text style={[styles.title, { color: '#F59E0B' }]}>Syncing data...</Text>
               ) : (
                 <Text style={styles.title}>Pending Sync</Text>
               )}
               <Text style={styles.subtitle}>
                  {pendingCount} pending, {failedCount} failed
               </Text>
           </View>
        </View>
        <MaterialCommunityIcons name={expanded ? "chevron-up" : "chevron-down"} size={24} color="#6B7280" />
      </Pressable>

      {expanded && (
         <View style={styles.expandedContent}>
             {!isOnline && (
                 <Text style={styles.offlineWarning}>
                    Data will sync automatically when connection is restored.
                 </Text>
             )}
             {isOnline && !isSyncing && pendingCount > 0 && (
                 <Pressable style={styles.syncButton} onPress={forceSync}>
                     <Text style={styles.syncButtonText}>Sync Now</Text>
                 </Pressable>
             )}
         </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  textStack: {
    flexDirection: 'column',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  expandedContent: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  offlineWarning: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
  },
  syncButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  syncButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  }
});
