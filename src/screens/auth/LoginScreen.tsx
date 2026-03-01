import React, { useState, useRef } from 'react';
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
    Modal,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { AuthService } from '../../services/AuthService';
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

    // Registration Modal State
    const [showRegister, setShowRegister] = useState(false);
    const [registerEmail, setRegisterEmail] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');
    const [registerName, setRegisterName] = useState('');
    const [registerRole, setRegisterRole] = useState<'Super Admin' | 'Admin' | 'User'>('User');
    const [registerBranch, setRegisterBranch] = useState('');
    const [registerRegion, setRegisterRegion] = useState('');
    const [registerLoading, setRegisterLoading] = useState(false);

    // Tap Secret Access
    const tapCount = useRef(0);
    const lastTap = useRef(0);

    const handleSecretTap = () => {
        const now = Date.now();
        if (now - lastTap.current < 500) {
            tapCount.current += 1;
        } else {
            tapCount.current = 1;
        }
        lastTap.current = now;

        if (tapCount.current >= 6) {
            setShowRegister(true);
            tapCount.current = 0;
        }
    };

    const handleRegister = async () => {
        if (!registerEmail || !registerPassword || !registerName || !registerBranch) {
            Alert.alert('Error', 'Please fill all required fields for registration');
            return;
        }

        setRegisterLoading(true);
        try {
            await AuthService.registerUser(
                registerEmail,
                registerPassword,
                registerName,
                registerRole,
                registerBranch,
                registerRegion || undefined
            );
            Alert.alert('Success', 'Access created successfully. You can now login.');
            setShowRegister(false);
            // Preset the login email
            setEmail(registerEmail);
            // Clear fields
            setRegisterEmail('');
            setRegisterPassword('');
            setRegisterName('');
            setRegisterBranch('');
            setRegisterRegion('');
        } catch (error: any) {
            Alert.alert('Registration Failed', error.message || 'Error creating access');
        } finally {
            setRegisterLoading(false);
        }
    };

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
                        <Pressable onPress={handleSecretTap}>
                            <Text style={styles.brandTitle}>EKOTEX SYSTEM</Text>
                        </Pressable>
                    </View>

                    {/* Login Card */}
                    <GlassPanel style={styles.loginCard} intensity={40}>
                        {/* Decorative Blur Circle inside card */}
                        <View style={styles.cardDecoration} />

                        <Text style={styles.cardTitle}>Sign In</Text>


                        <View style={styles.form}>
                            {/* Email */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>EMAIL ADDRESS</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="alex.sterling@ekotex.com"
                                    placeholderTextColor="#94A3B8"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    textContentType="emailAddress"
                                    autoComplete="email"
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
                                        textContentType="password"
                                        autoComplete="password"
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
                    <View style={[styles.quickAccessSection, { marginTop: 24 }]}>
                        <Text style={styles.quickAccessTitle}>QUICK ACCESS</Text>
                        <View style={[styles.quickAccessRow, { gap: 8 }]}>
                            <Pressable
                                style={styles.quickChip}
                                onPress={() => login('admin@gmail.com', 'admin@123')}
                            >
                                <View style={[styles.quickIconCircle, { backgroundColor: '#EEF2FF' }]}>
                                    <MaterialCommunityIcons name="shield-account" size={16} color="#4F46E5" />
                                </View>
                                <Text style={styles.quickChipText}>Admin</Text>
                            </Pressable>

                            <Pressable
                                style={styles.quickChip}
                                onPress={() => login('bom@gmail.com', 'asdfgh@123')}
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

            {/* Secret Registration Modal */}
            <Modal
                visible={showRegister}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowRegister(false)}
            >
                <View style={styles.modalOverlay}>
                    <GlassPanel style={styles.modalContent} intensity={80}>
                        <Text style={styles.modalTitle}>Create Access</Text>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={styles.modalForm}>
                                <View style={styles.modalInputGroup}>
                                    <Text style={styles.modalLabel}>FULL NAME</Text>
                                    <TextInput
                                        style={styles.modalInput}
                                        value={registerName}
                                        onChangeText={setRegisterName}
                                        placeholder="Apurv Deshmukh"
                                    />
                                </View>

                                <View style={styles.modalInputGroup}>
                                    <Text style={styles.modalLabel}>GMAIL ADDRESS</Text>
                                    <TextInput
                                        style={styles.modalInput}
                                        value={registerEmail}
                                        onChangeText={setRegisterEmail}
                                        placeholder="user@gmail.com"
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                        textContentType="emailAddress"
                                        autoComplete="email"
                                    />
                                </View>

                                <View style={styles.modalInputGroup}>
                                    <Text style={styles.modalLabel}>PASSWORD</Text>
                                    <TextInput
                                        style={styles.modalInput}
                                        value={registerPassword}
                                        onChangeText={setRegisterPassword}
                                        placeholder="••••••••"
                                        secureTextEntry
                                        textContentType="newPassword"
                                        autoComplete="password-new"
                                    />
                                </View>

                                <View style={styles.modalInputGroup}>
                                    <Text style={styles.modalLabel}>BRANCH ID / NAME</Text>
                                    <TextInput
                                        style={styles.modalInput}
                                        value={registerBranch}
                                        onChangeText={setRegisterBranch}
                                        placeholder="Main Branch / Nashik"
                                    />
                                </View>

                                <View style={styles.modalInputGroup}>
                                    <Text style={styles.modalLabel}>REGION (Optional)</Text>
                                    <TextInput
                                        style={styles.modalInput}
                                        value={registerRegion}
                                        onChangeText={setRegisterRegion}
                                        placeholder="Mumbai / Delhi / Bangalore"
                                    />
                                    <Text style={styles.modalHint}>For stock filtering. Leave empty for all regions.</Text>
                                </View>

                                <View style={styles.modalInputGroup}>
                                    <Text style={styles.modalLabel}>SELECT ROLE</Text>
                                    <View style={styles.roleSelector}>
                                        {(['Super Admin', 'Admin', 'User'] as const).map(role => (
                                            <Pressable
                                                key={role}
                                                style={[
                                                    styles.roleChip,
                                                    registerRole === role && styles.roleChipActive
                                                ]}
                                                onPress={() => setRegisterRole(role)}
                                            >
                                                <Text style={[
                                                    styles.roleChipText,
                                                    registerRole === role && styles.roleChipTextActive
                                                ]}>{role}</Text>
                                            </Pressable>
                                        ))}
                                    </View>
                                </View>

                                <Pressable
                                    style={styles.registerButton}
                                    onPress={handleRegister}
                                    disabled={registerLoading}
                                >
                                    {registerLoading ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <Text style={styles.registerButtonText}>Create Access</Text>
                                    )}
                                </Pressable>

                                <Pressable
                                    style={styles.closeButton}
                                    onPress={() => setShowRegister(false)}
                                >
                                    <Text style={styles.closeButtonText}>Cancel</Text>
                                </Pressable>
                            </View>
                        </ScrollView>
                    </GlassPanel>
                </View>
            </Modal>
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 24,
    },
    modalContent: {
        borderRadius: 32,
        padding: 20,
        maxHeight: '80%',
        backgroundColor: 'rgba(255, 255, 255, 0.95)', // Nearly solid white
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
    },
    modalTitle: {
        fontSize: 22,
        fontFamily: THEME.fonts.black,
        color: THEME.colors.text,
        marginBottom: 16,
        textAlign: 'center',
    },
    modalForm: {
        gap: 12,
    },
    modalInputGroup: {
        gap: 4,
    },
    modalLabel: {
        fontSize: 10,
        fontFamily: THEME.fonts.black,
        color: THEME.colors.textSecondary,
        letterSpacing: 1.5,
    },
    modalInput: {
        backgroundColor: '#F9FAFB', // Solid light gray background
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 14,
        fontFamily: THEME.fonts.semiBold,
        color: THEME.colors.text,
    },
    modalHint: {
        fontSize: 11,
        color: THEME.colors.textSecondary,
        marginTop: 4,
        fontFamily: THEME.fonts.body,
    },
    roleSelector: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    roleChip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 100,
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    roleChipActive: {
        backgroundColor: THEME.colors.primary,
        borderColor: THEME.colors.primary,
    },
    roleChipText: {
        fontSize: 12,
        fontFamily: THEME.fonts.bold,
        color: THEME.colors.textSecondary,
    },
    roleChipTextActive: {
        color: '#064E3B',
    },
    registerButton: {
        backgroundColor: THEME.colors.secondary,
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 12,
    },
    registerButtonText: {
        color: 'white',
        fontSize: 16,
        fontFamily: THEME.fonts.black,
    },
    closeButton: {
        paddingVertical: 12,
        alignItems: 'center',
    },
    closeButtonText: {
        color: THEME.colors.textSecondary,
        fontFamily: THEME.fonts.bold,
    },
});
