import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
    TouchableWithoutFeedback,
    Keyboard
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { THEME } from '../../constants/config';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, loading } = useAuth();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter both email and password');
            return;
        }

        try {
            await login(email, password);
        } catch (error: any) {
            Alert.alert('Login Failed', error.message || 'Something went wrong');
        }
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <View style={styles.headerContainer}>
                    <Text style={styles.title}>Welcome Back</Text>
                    <Text style={styles.subtitle}>Sign in to continue</Text>
                </View>

                <View style={styles.formContainer}>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your email"
                            placeholderTextColor="#C7C7CC"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Password</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your password"
                            placeholderTextColor="#C7C7CC"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.loginButton}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.loginButtonText}>Sign In</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Demo Accounts:</Text>
                    <Text style={styles.footerText}>Admin: admin@mainbranch.com / admin</Text>
                    <Text style={styles.footerText}>User: user@subbranch.com / user</Text>
                </View>
            </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.colors.background,
        justifyContent: 'center',
        paddingHorizontal: THEME.spacing.l,
    },
    headerContainer: {
        marginBottom: THEME.spacing.xl,
    },
    title: {
        fontSize: 34,
        fontWeight: '700',
        color: THEME.colors.text,
        marginBottom: THEME.spacing.s,
        letterSpacing: 0.37,
    },
    subtitle: {
        fontSize: 17,
        color: THEME.colors.textSecondary,
        letterSpacing: -0.41,
    },
    formContainer: {
        marginTop: THEME.spacing.m,
    },
    inputContainer: {
        marginBottom: THEME.spacing.l,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: THEME.colors.textSecondary,
        marginBottom: THEME.spacing.xs,
        textTransform: 'uppercase',
    },
    input: {
        height: 50,
        borderBottomWidth: 1,
        borderBottomColor: THEME.colors.border,
        fontSize: 17,
        color: THEME.colors.text,
    },
    loginButton: {
        backgroundColor: THEME.colors.primary,
        height: 50,
        borderRadius: THEME.borderRadius.m,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: THEME.spacing.l,
        shadowColor: THEME.colors.primary,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '600',
    },
    footer: {
        marginTop: 40,
        alignItems: 'center',
    },
    footerText: {
        color: THEME.colors.textSecondary,
        fontSize: 12,
        marginBottom: 4,
    }
});
