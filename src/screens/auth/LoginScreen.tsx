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
    Dimensions,
    Image,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
// @ts-ignore
import LogoImage from '../../assets/Warranty_pdf_template/logo/Logo.avif';

const { width } = Dimensions.get('window');

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
            <LinearGradient
                colors={['#F0F9FF', '#FFFFFF']}
                style={StyleSheet.absoluteFill}
            />
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <View style={styles.logoWrapper}>
                            <Image
                                source={LogoImage}
                                style={styles.companyLogo}
                                resizeMode="contain"
                            />
                        </View>
                    </View>
                    <Text style={styles.appName}>EKOTEX</Text>
                    <Text style={styles.tagline}>Intelligent Sales & Warranty Management</Text>
                </View>

                {/* Form Card */}
                <View style={styles.card}>
                    <View style={styles.welcomeSection}>
                        <Text style={styles.welcomeText}>Welcome Back</Text>
                        <Text style={styles.subtitle}>Sign in to your account</Text>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.inputWrapper}>
                            <Text style={styles.label}>Email Address</Text>
                            <View style={styles.inputContainer}>
                                <MaterialCommunityIcons name="email-outline" size={20} color="#7C3AED" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="your@email.com"
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
                                <MaterialCommunityIcons name="lock-outline" size={20} color="#7C3AED" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="••••••••"
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
                                pressed && { transform: [{ scale: 0.98 }] },
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
                </View>

                {/* Demo Accounts */}
                <View style={styles.demoSection}>
                    <Text style={styles.demoTitle}>Quick Access Demo</Text>
                    <View style={styles.demoCard}>
                        <Pressable
                            style={({ pressed }) => [styles.demoRow, pressed && { opacity: 0.7 }]}
                            onPress={() => login('admin@mainbranch.com', 'admin')}
                        >
                            <View style={[styles.demoBadge, { backgroundColor: '#EDE9FE' }]}>
                                <MaterialCommunityIcons name="shield-account" size={18} color="#7C3AED" />
                            </View>
                            <View style={styles.demoInfo}>
                                <Text style={styles.demoRole}>Master Administrator</Text>
                                <Text style={styles.demoCredentials}>Full access to all branches</Text>
                            </View>
                            <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
                        </Pressable>

                        <View style={styles.demoDivider} />

                        <Pressable
                            style={({ pressed }) => [styles.demoRow, pressed && { opacity: 0.7 }]}
                            onPress={() => login('user@subbranch.com', 'user')}
                        >
                            <View style={[styles.demoBadge, { backgroundColor: '#F0FDF4' }]}>
                                <MaterialCommunityIcons name="account" size={18} color="#10B981" />
                            </View>
                            <View style={styles.demoInfo}>
                                <Text style={styles.demoRole}>Branch Executive</Text>
                                <Text style={styles.demoCredentials}>Manage sales & local warranties</Text>
                            </View>
                            <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
                        </Pressable>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
        paddingVertical: 64,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoContainer: {
        marginBottom: 20,
    },
    logoWrapper: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 10,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    companyLogo: {
        width: 70,
        height: 70,
    },
    appName: {
        fontSize: 32,
        fontWeight: '900',
        color: '#1A1A1A',
        letterSpacing: -1,
    },
    tagline: {
        fontSize: 15,
        color: '#6B7280',
        marginTop: 6,
        fontWeight: '500',
    },
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderRadius: 32,
        padding: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 4,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        marginBottom: 32,
    },
    welcomeSection: {
        marginBottom: 32,
        alignItems: 'center',
    },
    welcomeText: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1A1A1A',
    },
    subtitle: {
        fontSize: 15,
        color: '#6B7280',
        marginTop: 6,
    },
    form: {},
    inputWrapper: {
        marginBottom: 24,
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
        color: '#9CA3AF',
        marginBottom: 10,
        marginLeft: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        paddingHorizontal: 16,
        height: 60,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#1A1A1A',
        fontWeight: '600',
    },
    eyeButton: {
        padding: 8,
    },
    loginButton: {
        borderRadius: 20,
        overflow: 'hidden',
        marginTop: 12,
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
        paddingVertical: 20,
        gap: 12,
    },
    loginButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '800',
    },
    demoSection: {
        alignItems: 'center',
    },
    demoTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: '#9CA3AF',
        marginBottom: 16,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    demoCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        borderRadius: 24,
        padding: 20,
        width: '100%',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    demoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    demoBadge: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    demoInfo: {
        flex: 1,
    },
    demoRole: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    demoCredentials: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 2,
    },
    demoDivider: {
        height: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        marginVertical: 12,
    },
});
