import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSyncStore } from '../../store/SyncStore';
import { THEME } from '../../constants/theme';
import GlassPanel from '../GlassPanel';

export const SyncAuditLogsTab: React.FC = () => {
    const { logs, clearLogs } = useSyncStore();

    const getLevelColor = (level: string) => {
        switch (level) {
            case 'success': return THEME.colors.success;
            case 'error': return THEME.colors.error;
            case 'warn': return THEME.colors.warning;
            default: return THEME.colors.textSecondary;
        }
    };

    const getLevelIcon = (level: string) => {
        switch (level) {
            case 'success': return 'check-circle';
            case 'error': return 'alert-circle';
            case 'warn': return 'alert';
            default: return 'information';
        }
    };

    const renderLogItem = ({ item }: { item: any }) => (
        <View style={styles.logItem}>
            <View style={styles.logHeader}>
                <View style={[styles.levelBadge, { backgroundColor: getLevelColor(item.level) + '20' }]}>
                    <MaterialCommunityIcons 
                        name={getLevelIcon(item.level) as any} 
                        size={14} 
                        color={getLevelColor(item.level)} 
                    />
                    <Text style={[styles.levelText, { color: getLevelColor(item.level) }]}>
                        {item.level.toUpperCase()}
                    </Text>
                </View>
                <Text style={styles.timestamp}>
                    {new Date(item.timestamp).toLocaleTimeString()}
                </Text>
            </View>

            <Text style={styles.message}>{item.message}</Text>
            
            {(item.table || item.localId) && (
                <View style={styles.detailsRow}>
                    {item.table && <Text style={styles.detailTag}>Table: {item.table}</Text>}
                    {item.localId && <Text style={styles.detailTag}>ID: {item.localId}</Text>}
                </View>
            )}

            {item.details && (
                <Text style={styles.errorDetails} numberOfLines={2}>
                    {item.details}
                </Text>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>System Audit Logs</Text>
                    <Text style={styles.subtitle}>Real-time tracking of data uploads & errors</Text>
                </View>
                <Pressable onPress={clearLogs}>
                    <GlassPanel style={styles.clearBtn}>
                        <MaterialCommunityIcons name="delete-sweep-outline" size={20} color={THEME.colors.error} />
                    </GlassPanel>
                </Pressable>
            </View>

            {logs.length === 0 ? (
                <View style={styles.emptyState}>
                    <MaterialCommunityIcons name="clipboard-text-outline" size={48} color={THEME.colors.textSecondary + '40'} />
                    <Text style={styles.emptyText}>No logs recorded yet</Text>
                </View>
            ) : (
                <FlatList
                    data={logs}
                    keyExtractor={(item) => item.id}
                    renderItem={renderLogItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontFamily: THEME.fonts.bold,
        color: THEME.colors.text,
    },
    subtitle: {
        fontSize: 12,
        fontFamily: THEME.fonts.body,
        color: THEME.colors.textSecondary,
    },
    clearBtn: {
        padding: 8,
        borderRadius: 10,
    },
    listContent: {
        paddingBottom: 20,
    },
    logItem: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
        borderLeftWidth: 3,
        borderLeftColor: 'rgba(255,255,255,0.1)',
    },
    logHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    levelBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        gap: 4,
    },
    levelText: {
        fontSize: 10,
        fontFamily: THEME.fonts.bold,
    },
    timestamp: {
        fontSize: 10,
        color: THEME.colors.textSecondary,
    },
    message: {
        fontSize: 14,
        fontFamily: THEME.fonts.bold,
        color: THEME.colors.text,
        marginBottom: 4,
    },
    detailsRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 4,
    },
    detailTag: {
        fontSize: 10,
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        color: THEME.colors.textSecondary,
    },
    errorDetails: {
        fontSize: 11,
        fontFamily: THEME.fonts.body,
        color: THEME.colors.error,
        fontStyle: 'italic',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: 0.8,
    },
    emptyText: {
        marginTop: 12,
        fontSize: 14,
        color: THEME.colors.textSecondary,
        fontFamily: THEME.fonts.body,
    }
});
