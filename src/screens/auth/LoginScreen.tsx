import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Pressable,
    Platform,
    Alert,
    ActivityIndicator,
    ScrollView,
    KeyboardAvoidingView,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { login, loading } = useAuth();

    const handleLogin = async () => {
        if (!email || !password) {
            if (Platform.OS === 'web') {
                window.alert('Please enter both email and password');
            } else {
                Alert.alert('Error', 'Please enter both email and password');
            }
            return;
        }

        try {
            await login(email, password);
        } catch (error: any) {
            if (Platform.OS === 'web') {
                window.alert(error.message || 'Login Failed');
            } else {
                Alert.alert('Login Failed', error.message || 'Something went wrong');
            }
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <LinearGradient
                            colors={['#7C3AED', '#5B21B6']}
                            style={styles.logoGradient}
                        >
                            <MaterialCommunityIcons name="shield-check" size={32} color="white" />
                        </LinearGradient>
                    </View>
                    <Text style={styles.appName}>WarrantyPro</Text>
                    <Text style={styles.tagline}>Sales & Warranty Management</Text>
                </View>

                {/* Welcome Section */}
                <View style={styles.welcomeSection}>
                    <Text style={styles.welcomeText}>Welcome back!</Text>
                    <Text style={styles.subtitle}>Sign in to continue to your dashboard</Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    <View style={styles.inputWrapper}>
                        <Text style={styles.label}>Email Address</Text>
                        <View style={styles.inputContainer}>
                            <MaterialCommunityIcons name="email-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your email"
                                placeholderTextColor="#9CA3AF"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>
                    </View>

                    <View style={styles.inputWrapper}>
                        <Text style={styles.label}>Password</Text>
                        <View style={styles.inputContainer}>
                            <MaterialCommunityIcons name="lock-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your password"
                                placeholderTextColor="#9CA3AF"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                            />
                            <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                                <MaterialCommunityIcons
                                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                                    size={20}
                                    color="#9CA3AF"
                                />
                            </Pressable>
                        </View>
                    </View>

                    <Pressable
                        style={({ pressed }) => [
                            styles.loginButton,
                            pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 },
                            loading && { opacity: 0.7 }
                        ]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        <LinearGradient
                            colors={['#7C3AED', '#5B21B6']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.gradientButton}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Text style={styles.loginButtonText}>Sign In</Text>
                                    <MaterialCommunityIcons name="arrow-right" size={20} color="white" />
                                </>
                            )}
                        </LinearGradient>
                    </Pressable>
                </View>

                {/* Demo Accounts */}
                <View style={styles.demoSection}>
                    <Text style={styles.demoTitle}>Demo Accounts</Text>
                    <View style={styles.demoCard}>
                        <View style={styles.demoRow}>
                            <View style={[styles.demoBadge, { backgroundColor: '#EDE9FE' }]}>
                                <MaterialCommunityIcons name="shield-account" size={16} color="#7C3AED" />
                            </View>
                            <View style={styles.demoInfo}>
                                <Text style={styles.demoRole}>Admin</Text>
                                <Text style={styles.demoCredentials}>admin@mainbranch.com / admin</Text>
                            </View>
                        </View>
                        <View style={styles.demoDivider} />
                        <View style={styles.demoRow}>
                            <View style={[styles.demoBadge, { backgroundColor: '#FEF3C7' }]}>
                                <MaterialCommunityIcons name="account" size={16} color="#F59E0B" />
                            </View>
                            <View style={styles.demoInfo}>
                                <Text style={styles.demoRole}>User</Text>
                                <Text style={styles.demoCredentials}>user@subbranch.com / user</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
        paddingVertical: 48,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logoContainer: {
        marginBottom: 16,
    },
    logoGradient: {
        width: 72,
        height: 72,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    appName: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1A1A1A',
        letterSpacing: -0.5,
    },
    tagline: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 4,
    },
    welcomeSection: {
        marginBottom: 32,
    },
    welcomeText: {
        fontSize: 26,
        fontWeight: '700',
        color: '#1A1A1A',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 15,
        color: '#6B7280',
        textAlign: 'center',
        marginTop: 8,
    },
    form: {
        marginBottom: 32,
    },
    inputWrapper: {
        marginBottom: 20,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 8,
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        paddingHorizontal: 14,
        height: 56,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#1A1A1A',
        outlineStyle: 'none',
    } as any,
    eyeButton: {
        padding: 4,
        cursor: 'pointer',
    } as any,
    loginButton: {
        borderRadius: 16,
        overflow: 'hidden',
        marginTop: 8,
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    gradientButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        gap: 8,
    },
    loginButtonText: {
        color: 'white',
        fontSize: 17,
        fontWeight: '700',
    },
    demoSection: {
        alignItems: 'center',
    },
    demoTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#9CA3AF',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    demoCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    demoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    demoBadge: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    demoInfo: {
        flex: 1,
    },
    demoRole: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    demoCredentials: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    demoDivider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 8,
    },
});
