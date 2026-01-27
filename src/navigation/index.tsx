import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/auth/LoginScreen';
import MainBranchDashboard from '../screens/dashboard/MainBranchDashboard';
import SubBranchDashboard from '../screens/dashboard/SubBranchDashboard';
import CreateSaleStep1 from '../screens/sales/CreateSaleStep1';
import CreateSaleStep2 from '../screens/sales/CreateSaleStep2';
import WarrantyCard from '../screens/warranty/WarrantyCard';
import AnalyticsScreen from '../screens/analytics/AnalyticsScreen';
import { THEME } from '../constants/config';

const Stack = createNativeStackNavigator();

function AuthStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
    );
}

function AdminStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="MainDashboard"
                component={MainBranchDashboard}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="AnalyticsScreen"
                component={AnalyticsScreen}
                options={{ title: 'Detailed Analytics' }}
            />
        </Stack.Navigator>
    );
}

function UserStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="SubDashboard"
                component={SubBranchDashboard}
                options={{ title: 'Overview', headerLargeTitle: true }}
            />
            <Stack.Screen
                name="CreateSaleStep1"
                component={CreateSaleStep1}
                options={{ title: 'New Sale', headerBackTitle: 'Back' }}
            />
            <Stack.Screen
                name="CreateSaleStep2"
                component={CreateSaleStep2}
                options={{ title: 'Upload Proof', headerBackTitle: 'Back' }}
            />
            <Stack.Screen
                name="WarrantyCard"
                component={WarrantyCard}
                options={{ title: 'Warranty Generated', gestureEnabled: false, headerLeft: () => null }}
            />
            <Stack.Screen
                name="AnalyticsScreen"
                component={AnalyticsScreen}
                options={{ title: 'My Analytics' }}
            />
        </Stack.Navigator>
    );
}

export default function RootNavigator() {
    const { user, isLoadingStorage } = useAuth();

    if (isLoadingStorage) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={THEME.colors.primary} />
            </View>
        );
    }

    return (
        <NavigationContainer>
            {user ? (
                user.role === 'Admin' ? <AdminStack /> : <UserStack />
            ) : (
                <AuthStack />
            )}
        </NavigationContainer>
    );
}
