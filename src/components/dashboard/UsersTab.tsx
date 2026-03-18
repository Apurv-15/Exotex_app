import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { THEME } from '../../constants/theme';
import GlassPanel from '../GlassPanel';

interface User {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'branch';
    branchId: string;
    region?: string;
    createdAt?: string;
}

interface UsersTabProps {
    allUsers: User[];
    currentUser: any;
    onDelete: (email: string) => void;
    onEdit: (user: User) => void;
}

export const UsersTab = React.memo(({
    allUsers,
    currentUser,
    onDelete,
    onEdit
}: UsersTabProps) => {
    return (
        <View style={{ paddingBottom: 20 }}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>User Management</Text>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{allUsers.length} Users</Text>
                </View>
            </View>

            <GlassPanel style={{ padding: 8 }}>
                {allUsers.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <ActivityIndicator color={THEME.colors.secondary} />
                        <Text style={styles.emptyText}>Loading users...</Text>
                    </View>
                ) : (
                    allUsers.map((u, idx) => {
                        const isMe = currentUser?.email === u.email;
                        const isAdmin = u.role === 'admin';
                        
                        return (
                            <View 
                                key={u.id || u.email} 
                                style={[
                                    styles.listItem, 
                                    idx === allUsers.length - 1 && { borderBottomWidth: 0 }
                                ]}
                            >
                                <View style={[styles.listIcon, { backgroundColor: isAdmin ? '#EDE9FE' : '#F0FDF4' }]}>
                                    <MaterialCommunityIcons 
                                        name={isAdmin ? "shield-check" : "account-outline"} 
                                        size={24} 
                                        color={isAdmin ? '#7C3AED' : '#10B981'} 
                                    />
                                </View>
                                <View style={styles.listContent}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        <Text style={styles.listTitle} numberOfLines={1}>{u.name || 'No Name'}</Text>
                                        {isMe && (
                                            <View style={styles.meBadge}>
                                                <Text style={styles.meBadgeText}>YOU</Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text style={styles.listSub} numberOfLines={1}>{u.email}</Text>
                                    <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                                        <View style={[styles.tag, { backgroundColor: isAdmin ? '#EDE9FE' : '#F0FDF4' }]}>
                                            <Text style={[styles.tagText, { color: isAdmin ? '#7C3AED' : '#10B981' }]}>
                                                {isAdmin ? 'Admin' : 'Branch'}
                                            </Text>
                                        </View>
                                        <View style={[styles.tag, { backgroundColor: '#F1F5F9' }]}>
                                            <Text style={[styles.tagText, { color: THEME.colors.textSecondary }]}>
                                                {u.branchId || u.region || 'All Regions'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                                
                                {!isMe && (
                                    <View style={styles.actionButtons}>
                                        <Pressable 
                                            onPress={() => onEdit(u)}
                                            style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.7 }]}
                                        >
                                            <MaterialCommunityIcons name="pencil-outline" size={20} color={THEME.colors.primary} />
                                        </Pressable>
                                        <Pressable 
                                            onPress={() => onDelete(u.email)}
                                            style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.7 }]}
                                        >
                                            <MaterialCommunityIcons name="trash-can-outline" size={20} color={THEME.colors.error} />
                                        </Pressable>
                                    </View>
                                )}
                            </View>
                        );
                    })
                )}
            </GlassPanel>
        </View>
    );
});

const styles = StyleSheet.create({
    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: THEME.colors.text },
    badge: { backgroundColor: THEME.colors.secondary + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    badgeText: { fontSize: 12, fontWeight: '700', color: THEME.colors.secondary },
    meBadge: { backgroundColor: THEME.colors.primary + '10', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4 },
    meBadgeText: { fontSize: 8, fontWeight: '800', color: THEME.colors.primary },
    listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingHorizontal: 4 },
    listIcon: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    listContent: { flex: 1 },
    listTitle: { fontSize: 16, fontWeight: '700', color: THEME.colors.text },
    listSub: { fontSize: 13, color: THEME.colors.textSecondary, marginTop: 1 },
    tag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    tagText: { fontSize: 11, fontWeight: '700' },
    actionButtons: { flexDirection: 'row', gap: 4 },
    actionBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
    emptyContainer: { padding: 40, alignItems: 'center' },
    emptyText: { fontSize: 14, color: THEME.colors.textSecondary, marginTop: 12 },
});
