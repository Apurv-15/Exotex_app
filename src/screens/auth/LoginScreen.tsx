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
    StatusBar,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { THEME } from '../../constants/theme';
import GlassPanel from '../../components/GlassPanel';
// @ts-ignore
import LogoImage from '../../assets/Warranty_pdf_template/logo/Logo_transparent.png';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { login, loading } = useAuth();

    const handleLogin = async () => {
        if (!email || !password) {
            const msg = 'Please enter both email and password';
            Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Error', msg);
            return;
        }

        try {
            await login(email, password);
        } catch (error: any) {
            const msg = error.message || 'Login Failed';
            Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Login Failed', msg);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Mesh Background Blobs */}
            <View style={styles.backgroundContainer}>
                <View style={styles.mesh1} />
                <View style={styles.mesh2} />
                <View style={styles.mesh3} />
                <View style={styles.glassOverlay} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header Info (Mocking the design's top bar) */}
                    <View style={styles.topBar}>
                        {/* We don't implement the status bar icons as they are system natively, 
                            but we leave space or could implement if this was a non-native web mock.
                            For React Native, we just let the content sit nicely. */}
                    </View>

                    {/* Branding */}
                    <View style={styles.brandingSection}>
                        <View style={styles.logoContainer}>
                            <Image
                                source={LogoImage}
                                style={styles.logoImage}
                                resizeMode="contain"
                            />
                        </View>
                        <Text style={styles.brandTitle}>EXOTEX SYSTEM</Text>
                    </View>

                    {/* Login Card */}
                    <GlassPanel style={styles.loginCard} intensity={40}>
                        {/* Decorative Blur Circle inside card */}
                        <View style={styles.cardDecoration} />

                        <Text style={styles.cardTitle}>Sign In</Text>
                        <Text style={styles.cardSubtitle}>Access your professional warranty dashboard</Text>

                        <View style={styles.form}>
                            {/* Email */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>EMAIL ADDRESS</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="alex.sterling@exotex.com"
                                    placeholderTextColor="#94A3B8"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                            </View>

                            {/* Password */}
                            <View style={styles.inputGroup}>
                                <View style={styles.labelRow}>
                                    <Text style={styles.label}>PASSWORD</Text>
                                    <Pressable>
                                        <Text style={styles.forgotPass}>FORGOT PASSWORD?</Text>
                                    </Pressable>
                                </View>
                                <View style={styles.passwordContainer}>
                                    <TextInput
                                        style={[styles.input, { flex: 1, borderWidth: 0, backgroundColor: 'transparent' }]}
                                        placeholder="••••••••••••"
                                        placeholderTextColor="#94A3B8"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPassword}
                                    />
                                    <Pressable onPress={() => setShowPassword(!showPassword)} style={{ padding: 10 }}>
                                        <MaterialCommunityIcons
                                            name={showPassword ? "eye-off" : "eye"}
                                            size={20}
                                            color={THEME.colors.textSecondary}
                                        />
                                    </Pressable>
                                </View>
                            </View>

                            {/* Login Button */}
                            <Pressable
                                style={({ pressed }) => [
                                    styles.loginButton,
                                    pressed && styles.loginButtonPressed
                                ]}
                                onPress={handleLogin}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#064E3B" />
                                ) : (
                                    <Text style={styles.loginButtonText}>Login</Text>
                                )}
                            </Pressable>
                        </View>
                    </GlassPanel>

                    {/* Support Link */}
                    <View style={styles.supportSection}>
                        <Text style={styles.supportText}>
                            Don't have an account? <Text style={styles.supportLink}>Contact Support</Text>
                        </Text>
                    </View>

                    {/* Quick Access (Preserved) */}
                    <View style={styles.quickAccessSection}>
                        <Text style={styles.quickAccessTitle}>QUICK ACCESS</Text>
                        <View style={styles.quickAccessRow}>
                            <Pressable
                                style={styles.quickChip}
                                onPress={() => login('admin@mainbranch.com', 'admin')}
                            >
                                <View style={[styles.quickIconCircle, { backgroundColor: '#EEF2FF' }]}>
                                    <MaterialCommunityIcons name="shield-account" size={16} color="#4F46E5" />
                                </View>
                                <Text style={styles.quickChipText}>Admin</Text>
                            </Pressable>

                            <Pressable
                                style={styles.quickChip}
                                onPress={() => login('user@subbranch.com', 'user')}
                            >
                                <View style={[styles.quickIconCircle, { backgroundColor: '#ECFDF5' }]}>
                                    <MaterialCommunityIcons name="account" size={16} color="#059669" />
                                </View>
                                <Text style={styles.quickChipText}>User</Text>
                            </Pressable>
                        </View>
                    </View>

                    {/* Version Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>v2.4.0 • SECURE ENTERPRISE LOGIN</Text>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7FCF8',
    },
    backgroundContainer: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
    },
    glassOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    mesh1: {
        position: 'absolute',
        width: 450,
        height: 450,
        borderRadius: 225,
        backgroundColor: '#B7E4C7',
        top: -150,
        left: -100,
        opacity: 0.5,
    },
    mesh2: {
        position: 'absolute',
        width: 350,
        height: 350,
        borderRadius: 175,
        backgroundColor: '#D8F3DC',
        top: '30%',
        right: -80,
        opacity: 0.5,
    },
    mesh3: {
        position: 'absolute',
        width: 400,
        height: 400,
        borderRadius: 200,
        backgroundColor: '#95D5B2',
        bottom: -100,
        left: '10%',
        opacity: 0.5,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
        justifyContent: 'center',
    },
    topBar: {
        height: 40,
    },
    brandingSection: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoContainer: {
        width: 120,
        height: 120,
        backgroundColor: 'rgba(183, 228, 199, 0.2)', // primary/20
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        borderWidth: 2,
        borderColor: '#FFFFFF',
        ...THEME.shadows.glass,
    },
    logoImage: {
        width: 80,
        height: 80,
        borderRadius: 0,
    },
    brandTitle: {
        fontSize: 12,
        fontFamily: THEME.fonts.bold,
        color: '#64748B', // Slate 500
        letterSpacing: 2.5, // 0.2em roughly
        textTransform: 'uppercase',
    },
    loginCard: {
        padding: 32,
        borderRadius: 32, // 2rem/4xl equivalent
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.7)',
        overflow: 'hidden',
    },
    cardDecoration: {
        position: 'absolute',
        top: -30,
        right: -30,
        width: 128,
        height: 128,
        borderRadius: 64,
        backgroundColor: 'rgba(183, 228, 199, 0.2)',
        opacity: 0.5,
    },
    cardTitle: {
        fontSize: 30,
        fontFamily: THEME.fonts.black,
        color: '#1F2937',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    cardSubtitle: {
        fontSize: 14,
        fontFamily: THEME.fonts.semiBold,
        color: '#64748B',
        marginBottom: 32,
    },
    form: {
        gap: 24,
    },
    inputGroup: {
        marginBottom: 0,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    label: {
        fontSize: 10,
        fontFamily: THEME.fonts.black,
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginLeft: 4,
        marginBottom: 8,
    },
    forgotPass: {
        fontSize: 10,
        fontFamily: THEME.fonts.black,
        color: '#059669', // Emerald 600
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    input: {
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.6)',
        borderRadius: 16,
        paddingHorizontal: 20,
        paddingVertical: 16,
        fontSize: 15,
        fontFamily: THEME.fonts.semiBold,
        color: '#1F2937',
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.6)',
        borderRadius: 16,
        paddingRight: 8,
    },
    loginButton: {
        backgroundColor: THEME.colors.primary,
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 8,
        shadowColor: 'rgba(183, 228, 199, 0.4)',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 20,
        elevation: 4,
    },
    loginButtonPressed: {
        transform: [{ scale: 0.98 }],
        opacity: 0.9,
    },
    loginButtonText: {
        fontSize: 16,
        fontFamily: THEME.fonts.black,
        color: '#064E3B', // Emerald 950
    },
    supportSection: {
        marginTop: 48,
        alignItems: 'center',
    },
    supportText: {
        fontSize: 14,
        fontFamily: THEME.fonts.bold,
        color: '#64748B',
    },
    supportLink: {
        color: '#059669',
        textDecorationLine: 'underline',
    },
    quickAccessSection: {
        marginTop: 40,
        alignItems: 'center',
    },
    quickAccessTitle: {
        fontSize: 10,
        fontFamily: THEME.fonts.black,
        color: '#94A3B8',
        marginBottom: 16,
        letterSpacing: 1.5,
    },
    quickAccessRow: {
        flexDirection: 'row',
        gap: 12,
    },
    quickChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 100,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    quickIconCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    quickChipText: {
        fontSize: 12,
        fontFamily: THEME.fonts.bold,
        color: '#4B5563',
    },
    footer: {
        marginTop: 40,
        marginBottom: 20,
        alignItems: 'center',
        opacity: 0.5,
    },
    footerText: {
        fontSize: 10,
        fontFamily: THEME.fonts.black,
        color: '#64748B',
        letterSpacing: 2,
    },
});
