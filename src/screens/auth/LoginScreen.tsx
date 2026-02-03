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
import LogoImage from '../../assets/Warranty_pdf_template/logo/Logo.png';

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
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
            <LinearGradient
                colors={['#FFFFFF', '#F5F5FA']}
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
                    <Text style={styles.appName}>EXOTEX</Text>
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
                                <MaterialCommunityIcons name="email-outline" size={20} color="#6366F1" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="your@email.com"
                                    placeholderTextColor="#A1A1AA"
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
                                <MaterialCommunityIcons name="lock-outline" size={20} color="#6366F1" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="••••••••"
                                    placeholderTextColor="#A1A1AA"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                />
                                <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                                    <MaterialCommunityIcons
                                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                                        size={20}
                                        color="#A1A1AA"
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
                                colors={['#6366F1', '#4F46E5']}
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

                {/* Demo Accounts - Simplified */}
                <View style={styles.demoSection}>
                    <Text style={styles.demoTitle}>Quick Access</Text>
                    <View style={styles.demoRowContainer}>
                        <Pressable
                            style={styles.demoChip}
                            onPress={() => login('admin@mainbranch.com', 'admin')}
                        >
                            <View style={[styles.demoIcon, { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' }]}>
                                <MaterialCommunityIcons name="shield-account-outline" size={16} color="#4F46E5" />
                            </View>
                            <Text style={styles.demoChipText}>Admin Info</Text>
                        </Pressable>

                        <Pressable
                            style={styles.demoChip}
                            onPress={() => login('user@subbranch.com', 'user')}
                        >
                            <View style={[styles.demoIcon, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
                                <MaterialCommunityIcons name="account-outline" size={16} color="#059669" />
                            </View>
                            <Text style={styles.demoChipText}>User Info</Text>
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
        paddingVertical: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logoContainer: {
        marginBottom: 16,
    },
    logoWrapper: {
        width: 88,
        height: 88,
        borderRadius: 24,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 8,
    },
    companyLogo: {
        width: 56,
        height: 56,
    },
    appName: {
        fontSize: 28,
        fontWeight: '800',
        color: '#111827',
        letterSpacing: -0.5,
    },
    tagline: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 4,
        fontWeight: '500',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    welcomeSection: {
        marginBottom: 24,
        alignItems: 'center',
    },
    welcomeText: {
        fontSize: 22,
        fontWeight: '700',
        color: '#111827',
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 4,
    },
    form: {},
    inputWrapper: {
        marginBottom: 20,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        paddingHorizontal: 16,
        height: 56,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#111827',
        fontWeight: '500',
    },
    eyeButton: {
        padding: 8,
    },
    loginButton: {
        borderRadius: 18,
        overflow: 'hidden',
        marginTop: 8,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 6,
    },
    gradientButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        gap: 10,
    },
    loginButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    demoSection: {
        alignItems: 'center',
        width: '100%',
    },
    demoTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#9CA3AF',
        marginBottom: 16,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    demoRowContainer: {
        flexDirection: 'row',
        gap: 16,
    },
    demoChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 100,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    demoIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        borderWidth: 1,
    },
    demoChipText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
    },
});
