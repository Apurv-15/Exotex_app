import React from 'react';
import { View, Text, StyleSheet, Pressable, Modal, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

interface RecoveryPopupProps {
    visible: boolean;
    formType: string;
    lastSaved: string;
    onResume: () => void;
    onStartFresh: () => void;
}

export default function RecoveryPopup({ visible, formType, lastSaved, onResume, onStartFresh }: RecoveryPopupProps) {
    const fadeAnim = React.useRef(new Animated.Value(0)).current;
    const scaleAnim = React.useRef(new Animated.Value(0.9)).current;

    React.useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 50,
                    friction: 7,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            fadeAnim.setValue(0);
            scaleAnim.setValue(0.9);
        }
    }, [visible]);

    const getFormTypeDisplay = () => {
        switch (formType) {
            case 'warranty': return 'Warranty Form';
            case 'field_visit': return 'Field Visit Form';
            case 'complaint': return 'Complaint Form';
            default: return 'Form';
        }
    };

    const getTimeSince = () => {
        const now = new Date();
        const saved = new Date(lastSaved);
        const diffMs = now.getTime() - saved.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            statusBarTranslucent
        >
            <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
                <BlurView intensity={20} style={StyleSheet.absoluteFill} />
                <Animated.View style={[styles.popupContainer, { transform: [{ scale: scaleAnim }] }]}>
                    <View style={styles.glassCard}>
                        {/* Icon */}
                        <View style={styles.iconContainer}>
                            <LinearGradient
                                colors={['#7C3AED', '#A78BFA']}
                                style={styles.iconGradient}
                            >
                                <MaterialCommunityIcons name="content-save-alert" size={32} color="white" />
                            </LinearGradient>
                        </View>

                        {/* Title */}
                        <Text style={styles.title}>Continue where you left off?</Text>

                        {/* Description */}
                        <Text style={styles.description}>
                            You have an incomplete {getFormTypeDisplay()} from {getTimeSince()}
                        </Text>

                        {/* Info Badge */}
                        <View style={styles.infoBadge}>
                            <MaterialCommunityIcons name="clock-outline" size={14} color="#7C3AED" />
                            <Text style={styles.infoBadgeText}>Auto-saved {getTimeSince()}</Text>
                        </View>

                        {/* Buttons */}
                        <View style={styles.buttonContainer}>
                            <Pressable
                                style={({ pressed }) => [
                                    styles.primaryButton,
                                    pressed && { opacity: 0.8 }
                                ]}
                                onPress={onResume}
                            >
                                <LinearGradient
                                    colors={['#7C3AED', '#A78BFA']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.primaryButtonGradient}
                                >
                                    <MaterialCommunityIcons name="play" size={20} color="white" />
                                    <Text style={styles.primaryButtonText}>Resume</Text>
                                </LinearGradient>
                            </Pressable>

                            <Pressable
                                style={({ pressed }) => [
                                    styles.secondaryButton,
                                    pressed && { opacity: 0.6 }
                                ]}
                                onPress={onStartFresh}
                            >
                                <MaterialCommunityIcons name="refresh" size={18} color="#6B7280" />
                                <Text style={styles.secondaryButtonText}>Start Fresh</Text>
                            </Pressable>
                        </View>
                    </View>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    popupContainer: {
        width: '100%',
        maxWidth: 400,
    },
    glassCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 32,
        padding: 32,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.25,
        shadowRadius: 40,
        elevation: 20,
    },
    iconContainer: {
        marginBottom: 20,
    },
    iconGradient: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 12,
        textAlign: 'center',
    },
    description: {
        fontSize: 15,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 20,
        paddingHorizontal: 8,
    },
    infoBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        gap: 6,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    infoBadgeText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#7C3AED',
        letterSpacing: 0.5,
    },
    buttonContainer: {
        width: '100%',
        gap: 12,
    },
    primaryButton: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    primaryButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    primaryButtonText: {
        color: 'white',
        fontSize: 17,
        fontWeight: '700',
    },
    secondaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        gap: 6,
        backgroundColor: '#F3F4F6',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    secondaryButtonText: {
        fontSize: 15,
        color: '#6B7280',
        fontWeight: '600',
    },
});
