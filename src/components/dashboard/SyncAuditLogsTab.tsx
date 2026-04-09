import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Modal, TouchableOpacity, Platform, Dimensions, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSyncStore } from '../../store/SyncStore';
import { THEME } from '../../constants/theme';
import { supabase } from '../../config/supabase';
import GlassPanel from '../GlassPanel';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const SyncAuditLogsTab: React.FC = () => {
    const { logs, clearLogs } = useSyncStore();
    const [selectedLog, setSelectedLog] = useState<any>(null);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [syncStatus, setSyncStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = async () => {
        if (!selectedLog) return;
        const json = JSON.stringify(selectedLog, null, 2);
        await Clipboard.setStringAsync(json);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const copyToClipboard = async (text: string, type: string) => {
        await Clipboard.setStringAsync(text);
        // We can reuse the isCopied or have a specific toast
        Alert.alert('Copied!', `${type} has been copied to clipboard.`);
    };

    const handleLogin = () => {
        const x = [57, 57, 50, 48, 51].map(c => String.fromCharCode(c)).join('');
        if (password === x) {
            setIsAuthorized(true);
            setError('');
        } else {
            setError('ACCESS DENIED: INVALID SYSTEM KEY');
            setPassword('');
        }
    };

    const testCloudSync = async () => {
        setSyncStatus('testing');
        try {
            const testId = `test-${Date.now()}`;
            const { error: insertError } = await supabase
                .from('system_audit_logs')
                .insert({
                    level: 'info',
                    module: 'DiagnosticTool',
                    message: 'Cloud Sync Connection Test',
                    operation_id: testId,
                    device_info: { platform: Platform.OS, isTest: true }
                });

            if (insertError) throw insertError;
            setSyncStatus('success');
            setTimeout(() => setSyncStatus('idle'), 3000);
        } catch (err) {
            console.warn('Cloud sync test failed', err);
            setSyncStatus('failed');
            setTimeout(() => setSyncStatus('idle'), 5000);
        }
    };

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

    const renderFormattedJson = (json: any) => {
        if (!json) return null;
        const jsonString = typeof json === 'string' ? json : JSON.stringify(json, null, 2);

        return (
            <View style={styles.jsonLinesContainer}>
                {jsonString.split('\n').map((line, lineIdx) => {
                    const lineParts = line.split(/(".*?"|true|false|null|\d+)/);
                    return (
                        <View key={lineIdx} style={styles.jsonLine}>
                            <Text style={styles.jsonBaseText}>
                                {lineParts.map((part, partIdx) => {
                                    let color = '#94A3B8';

                                    if (part.startsWith('"') && part.endsWith('"')) {
                                        const nextPart = lineParts[partIdx + 1] || '';
                                        if (nextPart.includes(':')) {
                                            color = '#F472B6';
                                        } else {
                                            color = '#B7E4C7';
                                        }
                                    } else if (/^\d+$/.test(part) || part === 'true' || part === 'false') {
                                        color = '#B7E4C7';
                                    }

                                    return <Text key={partIdx} style={{ color }}>{part}</Text>;
                                })}
                            </Text>
                        </View>
                    );
                })}
            </View>
        );
    };

    const renderLogItem = ({ item }: { item: any }) => (
        <Pressable
            key={item.id}
            style={({ pressed }) => [
                styles.logItem,
                pressed && { opacity: 0.7, backgroundColor: 'rgba(255,255,255,0.1)' }
            ]}
            onPress={() => setSelectedLog(item)}
        >
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

            {item.location && (
                <View style={styles.locationRow}>
                    <MaterialCommunityIcons name="file-code-outline" size={12} color={THEME.colors.primary} />
                    <Text style={styles.locationText}>{item.location}</Text>
                </View>
            )}

            <View style={styles.viewMoreRow}>
                <Text style={styles.viewMoreText}>Tap to view full details</Text>
                <MaterialCommunityIcons name="chevron-right" size={14} color={THEME.colors.textSecondary} />
            </View>
        </Pressable>
    );

    if (!isAuthorized) {
        return (
            <View style={styles.authContainer}>
                <LinearGradient
                    colors={['#064e3b', '#020617']}
                    style={StyleSheet.absoluteFill}
                />
                <MaterialCommunityIcons name="shield-lock" size={64} color={THEME.colors.primary} style={{ marginBottom: 24 }} />
                <Text style={styles.authTitle}>SYSTEM AUTHORIZATION</Text>
                <Text style={styles.authSubtitle}>ENTER LOG ACCESS KEY</Text>

                <View style={styles.inputContainer}>
                    <View style={styles.passwordInputWrapper}>
                        <MaterialCommunityIcons name="key-variant" size={20} color="rgba(255,255,255,0.4)" />
                        <View style={{ flex: 1, height: 50, justifyContent: 'center' }}>
                            <Text style={[styles.passwordText, !password && { opacity: 0.3 }]}>
                                {password ? '•'.repeat(password.length) : 'ENTER KEY'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.keypad}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'OK'].map((key) => (
                            <TouchableOpacity
                                key={key.toString()}
                                style={[styles.key, key === 'OK' && { backgroundColor: THEME.colors.primary }]}
                                onPress={() => {
                                    if (key === 'OK') handleLogin();
                                    else if (key === 'C') setPassword('');
                                    else if (password.length < 8) setPassword(prev => prev + key);
                                }}
                            >
                                <Text style={[styles.keyText, key === 'OK' && { color: '#020617' }]}>{key}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {error ? <Text style={styles.authError}>{error}</Text> : null}
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>System Audit Logs</Text>
                    <View style={styles.statusRow}>
                        <View style={[styles.statusDot, { backgroundColor: syncStatus === 'success' ? THEME.colors.success : syncStatus === 'failed' ? THEME.colors.error : syncStatus === 'testing' ? THEME.colors.warning : 'rgba(255,255,255,0.2)' }]} />
                        <Text style={styles.subtitle}>
                            {syncStatus === 'testing' ? 'Testing Cloud Sync...' :
                             syncStatus === 'success' ? 'Cloud Sync Active' :
                             syncStatus === 'failed' ? 'Cloud Sync Failed (Check Table)' :
                             'Real-time tracking of data uploads & errors'}
                        </Text>
                    </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                    <Pressable onPress={testCloudSync}>
                        <GlassPanel style={[styles.clearBtn, syncStatus === 'testing' && { opacity: 0.5 }]}>
                            <MaterialCommunityIcons
                                name={syncStatus === 'success' ? 'cloud-check' : syncStatus === 'failed' ? 'cloud-off' : 'cloud-sync'}
                                size={20}
                                color={syncStatus === 'success' ? THEME.colors.success : syncStatus === 'failed' ? THEME.colors.error : THEME.colors.primary}
                            />
                        </GlassPanel>
                    </Pressable>
                    <Pressable onPress={clearLogs}>
                        <GlassPanel style={styles.clearBtn}>
                            <MaterialCommunityIcons name="delete-sweep-outline" size={20} color={THEME.colors.error} />
                        </GlassPanel>
                    </Pressable>
                </View>
            </View>

            {logs.length === 0 ? (
                <View style={styles.emptyState}>
                    <MaterialCommunityIcons name="clipboard-text-outline" size={48} color={THEME.colors.textSecondary + '40'} />
                    <Text style={styles.emptyText}>No logs recorded yet</Text>
                </View>
            ) : (
                <View style={styles.listContent}>
                    {logs.map((item) => renderLogItem({ item }))}
                </View>
            )}            <Modal
                visible={!!selectedLog}
                transparent
                animationType="fade"
                onRequestClose={() => setSelectedLog(null)}
            >
                <View style={styles.modalOverlay}>
                    {/* 1. BACKGROUND LAYER (Tap to close) */}
                    <Pressable 
                        style={StyleSheet.absoluteFill} 
                        onPress={() => setSelectedLog(null)}
                    >
                        <LinearGradient
                            colors={['rgba(6, 78, 59, 1)', 'rgba(2, 6, 23, 1)']}
                            start={{ x: 0.5, y: 0 }}
                            end={{ x: 0.5, y: 0.8 }}
                            style={StyleSheet.absoluteFill}
                        />
                        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                    </Pressable>

                    {/* 2. MODAL CONTENT LAYER */}
                    <View style={styles.modalContent}>
                        <View style={styles.brandingAccent} />
                        
                        <GlassPanel style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.85)' }}>
                            <ScrollView
                                style={{ flex: 1 }}
                                contentContainerStyle={{ padding: 24, paddingBottom: 60 }}
                                showsVerticalScrollIndicator={true}
                                nestedScrollEnabled={true}
                                bounces={true}
                                overScrollMode="always"
                            >
                                {/* MODAL HEADER */}
                                <View style={styles.modalHeader}>
                                    <View style={styles.headerTagContainer}>
                                        <View style={[styles.pulseDot, { backgroundColor: getLevelColor(selectedLog?.level || 'info') }]} />
                                        <Text style={[styles.headerTagText, { color: getLevelColor(selectedLog?.level || 'info') }]}>
                                            {(selectedLog?.level || 'info').toUpperCase()} EVENT
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.closeIconBtn}
                                        onPress={() => setSelectedLog(null)}
                                    >
                                        <MaterialCommunityIcons name="close" size={18} color="white" />
                                    </TouchableOpacity>
                                </View>

                                {/* MESSAGE + TIMESTAMP */}
                                <Text style={styles.modalTitle}>{selectedLog?.message || 'System Log'}</Text>
                                <Text style={styles.modalTimestamp}>
                                    {selectedLog && new Date(selectedLog.timestamp).toLocaleString()}
                                </Text>

                                {/* METADATA PILLS */}
                                <View style={styles.metaRow}>
                                    {selectedLog?.module && (
                                        <TouchableOpacity 
                                            activeOpacity={0.7}
                                            style={styles.metaPill}
                                            onPress={() => copyToClipboard(selectedLog.module, 'Module name')}
                                        >
                                            <MaterialCommunityIcons name="cube-outline" size={12} color={THEME.colors.primary} />
                                            <Text style={styles.metaPillText}>{selectedLog.module}</Text>
                                        </TouchableOpacity>
                                    )}
                                    {selectedLog?.table && (
                                        <TouchableOpacity 
                                            activeOpacity={0.7}
                                            style={styles.metaPill}
                                            onPress={() => copyToClipboard(selectedLog.table, 'Table name')}
                                        >
                                            <MaterialCommunityIcons name="table" size={12} color="#818CF8" />
                                            <Text style={[styles.metaPillText, { color: '#818CF8' }]}>{selectedLog.table}</Text>
                                        </TouchableOpacity>
                                    )}
                                    {selectedLog?.operationId && (
                                        <TouchableOpacity 
                                            activeOpacity={0.7}
                                            style={styles.metaPill}
                                            onPress={() => copyToClipboard(selectedLog.operationId, 'Operation ID')}
                                        >
                                            <MaterialCommunityIcons name="identifier" size={12} color="#94A3B8" />
                                            <Text style={[styles.metaPillText, { color: '#94A3B8' }]} numberOfLines={1}>{selectedLog.operationId}</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>

                                {/* SOURCE LOCATION */}
                                {selectedLog?.location && (
                                    <View style={styles.sectionContainer}>
                                        <Text style={styles.sectionTitle}>SOURCE LOCATION (TAP TO COPY)</Text>
                                        <TouchableOpacity 
                                            activeOpacity={0.7}
                                            style={styles.locationPill}
                                            onPress={() => copyToClipboard(selectedLog.location, 'Location')}
                                        >
                                            <MaterialCommunityIcons name="file-code-outline" size={14} color={THEME.colors.primary} />
                                            <Text style={styles.locationPillText}>{selectedLog.location}</Text>
                                            <MaterialCommunityIcons name="content-copy" size={14} color="rgba(255,255,255,0.2)" />
                                        </TouchableOpacity>
                                    </View>
                                )}

                                {/* DETAILS SECTION */}
                                {selectedLog?.details && (
                                    <View style={styles.sectionContainer}>
                                        <Text style={styles.sectionTitle}>DETAILS</Text>
                                        <View style={styles.jsonContainer}>
                                            <ScrollView horizontal showsHorizontalScrollIndicator={false} nestedScrollEnabled>
                                                {renderFormattedJson(
                                                    typeof selectedLog.details === 'string'
                                                        ? (() => { try { return JSON.parse(selectedLog.details); } catch { return selectedLog.details; } })()
                                                        : selectedLog.details
                                                )}
                                            </ScrollView>
                                        </View>
                                    </View>
                                )}

                                {/* STACK TRACE */}
                                {selectedLog?.stack && (
                                    <View style={styles.sectionContainer}>
                                        <Text style={styles.sectionTitle}>STACK TRACE</Text>
                                        <View style={styles.stackContainer}>
                                            <ScrollView horizontal showsHorizontalScrollIndicator={true} nestedScrollEnabled>
                                                <Text style={styles.stackText}>{selectedLog.stack}</Text>
                                            </ScrollView>
                                        </View>
                                    </View>
                                )}

                                {/* FULL RAW LOG */}
                                <View style={styles.sectionContainer}>
                                    <View style={styles.sectionHeaderRow}>
                                        <Text style={styles.sectionTitle}>FULL RAW LOG</Text>
                                        <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
                                            <MaterialCommunityIcons
                                                name={isCopied ? "check" : "content-copy"}
                                                size={12}
                                                color={isCopied ? THEME.colors.primary : "rgba(255,255,255,0.4)"}
                                            />
                                            <Text style={[styles.copyBtnText, isCopied && { color: THEME.colors.primary }]}>
                                                {isCopied ? 'COPIED!' : 'COPY JSON'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                    <View style={styles.jsonContainer}>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} nestedScrollEnabled>
                                            {renderFormattedJson(selectedLog)}
                                        </ScrollView>
                                    </View>
                                </View>

                                <View style={styles.modalFooter}>
                                    <TouchableOpacity 
                                        style={styles.resolveBtn} 
                                        onPress={() => setSelectedLog(null)}
                                    >
                                        <Text style={styles.resolveBtnText}>Dismiss</Text>
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>
                        </GlassPanel>
                    </View>
                </View>
            </Modal>
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
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 2,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
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
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 4,
        backgroundColor: 'rgba(183, 228, 199, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    locationText: {
        fontSize: 11,
        fontFamily: 'monospace',
        color: THEME.colors.primary,
    },
    viewMoreRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: 8,
        gap: 2,
    },
    viewMoreText: {
        fontSize: 10,
        color: THEME.colors.textSecondary,
        fontFamily: THEME.fonts.semiBold,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    modalContent: {
        width: SCREEN_WIDTH > 600 ? 500 : '92%',
        height: '80%', // Definitive height to prevent collapse
        borderRadius: 28,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: '#020617',
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
    },
    brandingAccent: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 4,
        backgroundColor: THEME.colors.primary,
        zIndex: 100,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerTagContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    pulseDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: THEME.colors.primary,
    },
    headerTagText: {
        fontSize: 10,
        fontFamily: THEME.fonts.bold,
        color: THEME.colors.primary,
        letterSpacing: 2,
    },
    closeIconBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 24,
        fontFamily: THEME.fonts.bold,
        color: 'white',
        marginBottom: 4,
    },
    modalTimestamp: {
        fontSize: 14,
        fontFamily: THEME.fonts.semiBold,
        color: '#94A3B8',
        marginBottom: 32,
    },
    sectionContainer: {
        marginBottom: 32,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 10,
        fontFamily: THEME.fonts.black,
        color: 'rgba(183, 228, 199, 0.6)',
        letterSpacing: 2,
    },
    copyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    copyBtnText: {
        fontSize: 10,
        fontFamily: THEME.fonts.bold,
        color: 'rgba(255,255,255,0.4)',
    },
    locationPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(2, 6, 23, 0.5)',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(183,228,199,0.15)',
    },
    locationPillText: {
        flex: 1,
        fontSize: 12,
        fontFamily: 'monospace',
        color: 'rgba(183, 228, 199, 0.9)',
        lineHeight: 18,
    },
    jsonContainer: {
        backgroundColor: 'rgba(2, 6, 23, 0.8)',
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    metaRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 24,
    },
    metaPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: 'rgba(183, 228, 199, 0.08)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(183, 228, 199, 0.15)',
    },
    metaPillText: {
        fontSize: 11,
        fontFamily: THEME.fonts.semiBold,
        color: THEME.colors.primary,
    },
    jsonLinesContainer: {
        width: '100%',
    },
    jsonLine: {
        flexDirection: 'row',
    },
    jsonBaseText: {
        fontSize: 13,
        fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
        lineHeight: 20,
    },
    stackContainer: {
        backgroundColor: '#0F172A',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    stackText: {
        fontSize: 11,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        color: '#94A3B8',
        lineHeight: 16,
    },
    modalFooter: {
        marginTop: 8,
        alignItems: 'flex-end',
    },
    resolveBtn: {
        backgroundColor: THEME.colors.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    resolveBtnText: {
        color: '#020617',
        fontSize: 14,
        fontFamily: THEME.fonts.bold,
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
    },
    authContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    authTitle: {
        fontSize: 20,
        fontFamily: THEME.fonts.black,
        color: 'white',
        letterSpacing: 4,
        marginBottom: 8,
    },
    authSubtitle: {
        fontSize: 12,
        fontFamily: THEME.fonts.bold,
        color: 'rgba(255,255,255,0.4)',
        letterSpacing: 2,
        marginBottom: 48,
    },
    inputContainer: {
        width: '100%',
        maxWidth: 320,
    },
    passwordInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        marginBottom: 32,
    },
    passwordText: {
        color: 'white',
        fontSize: 24,
        fontFamily: THEME.fonts.bold,
        letterSpacing: 4,
    },
    keypad: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 12,
    },
    key: {
        width: SCREEN_WIDTH > 400 ? 80 : 60,
        height: SCREEN_WIDTH > 400 ? 80 : 60,
        borderRadius: SCREEN_WIDTH > 400 ? 40 : 30,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    keyText: {
        color: 'white',
        fontSize: SCREEN_WIDTH > 400 ? 22 : 18,
        fontFamily: THEME.fonts.bold,
    },
    authError: {
        color: THEME.colors.error,
        fontSize: 12,
        fontFamily: THEME.fonts.bold,
        textAlign: 'center',
        marginTop: 24,
        letterSpacing: 1,
    }
});