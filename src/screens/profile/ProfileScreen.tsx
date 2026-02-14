import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Pressable,
    ScrollView,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { THEME } from '../../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import GlassPanel from '../../components/GlassPanel';
import MeshBackground from '../../components/MeshBackground';

export default function ProfileScreen() {
    const { user, updateProfile, updatePassword, loading } = useAuth();

    // Profile state
    const [name, setName] = useState(user?.name || '');
    const [region, setRegion] = useState(user?.region || '');

    // Password state
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleUpdateProfile = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Name cannot be empty');
            return;
        }

        try {
            await updateProfile({ name, region });
            Alert.alert('Success', 'Profile updated successfully');
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to update profile');
        }
    };

    const handleUpdatePassword = async () => {
        if (newPassword.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        try {
            await updatePassword(newPassword);
            setNewPassword('');
            setConfirmPassword('');
            Alert.alert('Success', 'Password updated successfully');
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to update password');
        }
    };

    return (
        <MeshBackground>
            <StatusBar barStyle="dark-content" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Account Settings</Text>
                        <Text style={styles.subtitle}>Update your personal information</Text>
                    </View>

                    <GlassPanel style={styles.section} intensity={40}>
                        <Text style={styles.sectionTitle}>Profile Information</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email Address</Text>
                            <View style={[styles.input, styles.disabledInput]}>
                                <Text style={styles.disabledInputText}>{user?.email}</Text>
                                <MaterialCommunityIcons name="lock" size={16} color={THEME.colors.textSecondary} />
                            </View>
                            <Text style={styles.hint}>Email cannot be changed</Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Full Name</Text>
                            <TextInput
                                style={styles.input}
                                value={name}
                                onChangeText={setName}
                                placeholder="Enter your full name"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Region</Text>
                            <TextInput
                                style={styles.input}
                                value={region}
                                onChangeText={setRegion}
                                placeholder="e.g. Mumbai, Nashik"
                            />
                        </View>

                        <Pressable
                            style={({ pressed }) => [
                                styles.button,
                                pressed && styles.buttonPressed,
                                loading && styles.buttonDisabled
                            ]}
                            onPress={handleUpdateProfile}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.buttonText}>Save Changes</Text>
                            )}
                        </Pressable>
                    </GlassPanel>

                    <GlassPanel style={styles.section} intensity={40}>
                        <Text style={styles.sectionTitle}>Change Password</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>New Password</Text>
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={styles.passwordInput}
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    placeholder="Enter new password"
                                    secureTextEntry={!showPassword}
                                />
                                <Pressable
                                    onPress={() => setShowPassword(!showPassword)}
                                    style={styles.eyeIcon}
                                >
                                    <MaterialCommunityIcons
                                        name={showPassword ? "eye-off" : "eye"}
                                        size={20}
                                        color={THEME.colors.textSecondary}
                                    />
                                </Pressable>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Confirm New Password</Text>
                            <TextInput
                                style={styles.input}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                placeholder="Confirm new password"
                                secureTextEntry={!showPassword}
                            />
                        </View>

                        <Pressable
                            style={({ pressed }) => [
                                styles.button,
                                { backgroundColor: THEME.colors.primary },
                                pressed && styles.buttonPressed,
                                loading && styles.buttonDisabled
                            ]}
                            onPress={handleUpdatePassword}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={[styles.buttonText, { color: '#064E3B' }]}>Update Password</Text>
                            )}
                        </Pressable>
                    </GlassPanel>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Role: {user?.role}</Text>
                        <Text style={styles.footerText}>Branch: {user?.branchId || 'N/A'}</Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </MeshBackground>
    );
}

const styles = StyleSheet.create({
    scrollContent: {
        padding: 24,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 32,
    },
    title: {
        fontSize: 32,
        fontFamily: THEME.fonts.bold,
        color: THEME.colors.text,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        fontFamily: THEME.fonts.body,
        color: THEME.colors.textSecondary,
    },
    section: {
        padding: 24,
        marginBottom: 24,
        borderRadius: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontFamily: THEME.fonts.bold,
        color: THEME.colors.text,
        marginBottom: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 12,
        fontFamily: THEME.fonts.bold,
        color: THEME.colors.textSecondary,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    input: {
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.05)',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        fontFamily: THEME.fonts.semiBold,
        color: THEME.colors.text,
    },
    disabledInput: {
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    disabledInputText: {
        fontSize: 16,
        fontFamily: THEME.fonts.semiBold,
        color: THEME.colors.textSecondary,
    },
    hint: {
        fontSize: 11,
        fontFamily: THEME.fonts.body,
        color: THEME.colors.textSecondary,
        marginTop: 4,
        marginLeft: 4,
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.05)',
        borderRadius: 16,
    },
    passwordInput: {
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        fontFamily: THEME.fonts.semiBold,
        color: THEME.colors.text,
    },
    eyeIcon: {
        padding: 12,
    },
    button: {
        backgroundColor: THEME.colors.secondary,
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 8,
        ...THEME.shadows.small,
    },
    buttonPressed: {
        opacity: 0.8,
        transform: [{ scale: 0.98 }],
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontFamily: THEME.fonts.bold,
    },
    footer: {
        alignItems: 'center',
        marginTop: 8,
    },
    footerText: {
        fontSize: 12,
        fontFamily: THEME.fonts.body,
        color: THEME.colors.textSecondary,
        marginBottom: 4,
    }
});
