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
import TemplateManagement from '../screens/admin/TemplateManagement';
import FieldVisitForm from '../screens/fieldvisit/FieldVisitForm';
import RaiseComplaintStep1 from '../screens/complaints/RaiseComplaintStep1';
import RaiseComplaintStep2 from '../screens/complaints/RaiseComplaintStep2';
import ComplaintSuccess from '../screens/complaints/ComplaintSuccess';
import FieldVisitSuccess from '../screens/fieldvisit/FieldVisitSuccess';
import ProfileScreen from '../screens/profile/ProfileScreen';
import CreateQuotationScreen from '../screens/quotation/CreateQuotationScreen';
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
            <Stack.Screen
                name="TemplateManagement"
                component={TemplateManagement}
                options={{ title: 'Warranty Template' }}
            />
            <Stack.Screen
                name="WarrantyCard"
                component={WarrantyCard}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="RaiseComplaintStep1"
                component={RaiseComplaintStep1}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="RaiseComplaintStep2"
                component={RaiseComplaintStep2}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="ComplaintSuccess"
                component={ComplaintSuccess}
                options={{ headerShown: false, gestureEnabled: false }}
            />
            <Stack.Screen
                name="FieldVisitSuccess"
                component={FieldVisitSuccess}
                options={{ headerShown: false, gestureEnabled: false }}
            />
            <Stack.Screen
                name="Profile"
                component={ProfileScreen}
                options={{ title: 'Profile Settings' }}
            />
            <Stack.Screen
                name="CreateQuotationScreen"
                component={CreateQuotationScreen}
                options={{ headerShown: false }}
            />
        </Stack.Navigator>
    );
}

function UserStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen
                name="SubDashboard"
                component={SubBranchDashboard}
            />
            <Stack.Screen
                name="CreateSaleStep1"
                component={CreateSaleStep1}
            />
            <Stack.Screen
                name="CreateSaleStep2"
                component={CreateSaleStep2}
            />
            <Stack.Screen
                name="WarrantyCard"
                component={WarrantyCard}
                options={{ gestureEnabled: false }}
            />
            <Stack.Screen
                name="FieldVisitForm"
                component={FieldVisitForm}
            />
            <Stack.Screen
                name="AnalyticsScreen"
                component={AnalyticsScreen}
                options={{ headerShown: true, title: 'My Analytics' }}
            />
            <Stack.Screen
                name="RaiseComplaintStep1"
                component={RaiseComplaintStep1}
            />
            <Stack.Screen
                name="RaiseComplaintStep2"
                component={RaiseComplaintStep2}
            />
            <Stack.Screen
                name="ComplaintSuccess"
                component={ComplaintSuccess}
                options={{ gestureEnabled: false }}
            />
            <Stack.Screen
                name="FieldVisitSuccess"
                component={FieldVisitSuccess}
                options={{ gestureEnabled: false }}
            />
            <Stack.Screen
                name="Profile"
                component={ProfileScreen}
                options={{ headerShown: true, title: 'Profile Settings' }}
            />
            <Stack.Screen
                name="CreateQuotationScreen"
                component={CreateQuotationScreen}
                options={{ headerShown: false }}
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
                (user.role === 'Admin' || user.role === 'Super Admin') ? <AdminStack /> : <UserStack />
            ) : (
                <AuthStack />
            )}
        </NavigationContainer>
    );
}
