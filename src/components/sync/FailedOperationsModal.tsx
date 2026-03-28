import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, Pressable, SafeAreaView, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSyncQueue } from '../../hooks/useSyncQueue';

interface FailedOperationsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const FailedOperationsModal: React.FC<FailedOperationsModalProps> = ({ visible, onClose }) => {
  const { failedOperations, removeOperation, retryFailed, clearFailed, isSyncing } = useSyncQueue();
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const handleRetry = async (id: string) => {
    setRetryingId(id);
    await retryFailed(id);
    setRetryingId(null);
  };

  const handleClearAll = async () => {
    await clearFailed();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Failed Syncs ({failedOperations.length})</Text>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <MaterialCommunityIcons name="close" size={24} color="#4B5563" />
          </Pressable>
        </View>

        {failedOperations.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="check-circle-outline" size={64} color="#10B981" />
            <Text style={styles.emptyText}>No failed operations!</Text>
          </View>
        ) : (
          <ScrollView style={styles.list}>
             {failedOperations.map(op => (
               <View key={op.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                     <View style={styles.typeBadge}>
                        <Text style={styles.typeText}>{op.type}</Text>
                     </View>
                     <Text style={styles.tableText}>{op.table}</Text>
                  </View>
                  
                  <Text style={styles.errorText} numberOfLines={2}>
                    {op.lastError || 'Unknown Error'}
                  </Text>
                  
                  <View style={styles.cardFooter}>
                    <Text style={styles.dateText}>
                       {new Date(op.timestamp).toLocaleString()}
                    </Text>
                    
                    <View style={styles.actions}>
                       <Pressable 
                         style={[styles.actionBtn, styles.deleteBtn]} 
                         onPress={() => removeOperation(op.id)}>
                          <MaterialCommunityIcons name="delete-outline" size={16} color="#EF4444" />
                          <Text style={styles.deleteBtnText}>Discard</Text>
                       </Pressable>

                       <Pressable 
                         style={[styles.actionBtn, styles.retryBtn]} 
                         onPress={() => handleRetry(op.id)}
                         disabled={retryingId === op.id}>
                          {retryingId === op.id || isSyncing ? (
                             <ActivityIndicator size="small" color="#FFF" />
                          ) : (
                             <>
                              <MaterialCommunityIcons name="refresh" size={16} color="#FFF" />
                              <Text style={styles.retryBtnText}>Retry</Text>
                             </>
                          )}
                       </Pressable>
                    </View>
                  </View>
               </View>
             ))}

             <Pressable style={styles.clearAllBtn} onPress={handleClearAll}>
                <Text style={styles.clearAllBtnText}>Clear All Failed</Text>
             </Pressable>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  closeBtn: {
    padding: 8,
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  typeBadge: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4F46E5',
  },
  tableText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  dateText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  deleteBtn: {
    backgroundColor: '#FEE2E2',
  },
  deleteBtnText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
  },
  retryBtn: {
    backgroundColor: '#3B82F6',
    minWidth: 70,
    justifyContent: 'center',
  },
  retryBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
  clearAllBtn: {
    marginTop: 16,
    marginBottom: 40,
    padding: 16,
    alignItems: 'center',
  },
  clearAllBtnText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  }
});
