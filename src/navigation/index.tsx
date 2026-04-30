import React from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, BackHandler, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { THEME } from '../constants/config';

const Stack = createNativeStackNavigator();

const loadScreen = (path: string) => () => require(path).default;

function AuthStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" getComponent={loadScreen('../screens/auth/LoginScreen')} />
        </Stack.Navigator>
    );
}

function AdminStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="MainDashboard"
                getComponent={loadScreen('../screens/dashboard/MainBranchDashboard')}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="AnalyticsScreen"
                getComponent={loadScreen('../screens/analytics/AnalyticsScreen')}
                options={{ title: 'Detailed Analytics' }}
            />
            <Stack.Screen
                name="TemplateManagement"
                getComponent={loadScreen('../screens/admin/TemplateManagement')}
                options={{ title: 'Warranty Template' }}
            />
            <Stack.Screen
                name="WarrantyCard"
                getComponent={loadScreen('../screens/warranty/WarrantyCard')}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="RaiseComplaintStep1"
                getComponent={loadScreen('../screens/complaints/RaiseComplaintStep1')}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="RaiseComplaintStep2"
                getComponent={loadScreen('../screens/complaints/RaiseComplaintStep2')}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="ComplaintSuccess"
                getComponent={loadScreen('../screens/complaints/ComplaintSuccess')}
                options={{ headerShown: false, gestureEnabled: false }}
            />
            <Stack.Screen
                name="FieldVisitSuccess"
                getComponent={loadScreen('../screens/fieldvisit/FieldVisitSuccess')}
                options={{ headerShown: false, gestureEnabled: false }}
            />
            <Stack.Screen
                name="Profile"
                getComponent={loadScreen('../screens/profile/ProfileScreen')}
                options={{ title: 'Profile Settings' }}
            />
            <Stack.Screen
                name="CreateQuotationScreen"
                getComponent={loadScreen('../screens/quotation/CreateQuotationScreen')}
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
                getComponent={loadScreen('../screens/dashboard/SubBranchDashboard')}
            />
            <Stack.Screen
                name="CreateSaleStep1"
                getComponent={loadScreen('../screens/sales/CreateSaleStep1')}
            />
            <Stack.Screen
                name="CreateSaleStep2"
                getComponent={loadScreen('../screens/sales/CreateSaleStep2')}
            />
            <Stack.Screen
                name="WarrantyCard"
                getComponent={loadScreen('../screens/warranty/WarrantyCard')}
                options={{ gestureEnabled: false }}
            />
            <Stack.Screen
                name="FieldVisitForm"
                getComponent={loadScreen('../screens/fieldvisit/FieldVisitForm')}
            />
            <Stack.Screen
                name="AnalyticsScreen"
                getComponent={loadScreen('../screens/analytics/AnalyticsScreen')}
                options={{ headerShown: true, title: 'My Analytics' }}
            />
            <Stack.Screen
                name="RaiseComplaintStep1"
                getComponent={loadScreen('../screens/complaints/RaiseComplaintStep1')}
            />
            <Stack.Screen
                name="RaiseComplaintStep2"
                getComponent={loadScreen('../screens/complaints/RaiseComplaintStep2')}
            />
            <Stack.Screen
                name="ComplaintSuccess"
                getComponent={loadScreen('../screens/complaints/ComplaintSuccess')}
                options={{ gestureEnabled: false }}
            />
            <Stack.Screen
                name="FieldVisitSuccess"
                getComponent={loadScreen('../screens/fieldvisit/FieldVisitSuccess')}
                options={{ gestureEnabled: false }}
            />
            <Stack.Screen
                name="Profile"
                getComponent={loadScreen('../screens/profile/ProfileScreen')}
                options={{ headerShown: true, title: 'Profile Settings' }}
            />
            <Stack.Screen
                name="CreateQuotationScreen"
                getComponent={loadScreen('../screens/quotation/CreateQuotationScreen')}
                options={{ headerShown: false }}
            />
        </Stack.Navigator>
    );
}

export default function RootNavigator() {

    const navigationRef = React.useRef<NavigationContainerRef<any>>(null);

    React.useEffect(() => {
        const backAction = () => {
            if (navigationRef.current && navigationRef.current.canGoBack()) {
                navigationRef.current.goBack();
            } else {
                Alert.alert("Hold on!", "Are you sure you want to go exit?", [
                    { text: "Cancel", onPress: () => null, style: "cancel" },
                    { text: "YES", onPress: () => BackHandler.exitApp() }
                ]);
            }
            return true;
        };

        const backHandler = BackHandler.addEventListener(
            "hardwareBackPress",
            backAction
        );

        return () => backHandler.remove();
    }, []);

    const { user, isLoadingStorage } = useAuth();

    // Safety timeout: if auth resolution stalls in production (e.g., slow Supabase cold start),
    // force the loading state to resolve after 5 seconds so the user isn't stuck on a blank screen.
    const [forceReady, setForceReady] = React.useState(false);
    React.useEffect(() => {
        if (!isLoadingStorage) return;
        const timer = setTimeout(() => {
            console.warn('RootNavigator: Auth resolution timed out, forcing ready state.');
            setForceReady(true);
        }, 5000);
        return () => clearTimeout(timer);
    }, [isLoadingStorage]);

    if (isLoadingStorage && !forceReady) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={THEME.colors.primary} />
            </View>
        );
    }

    return (
        <NavigationContainer ref={navigationRef}>
            {user ? (
                user.role === 'Admin' || user.role === 'Super Admin' ? (
                    <AdminStack />
                ) : (
                    <UserStack />
                )
            ) : (
                <AuthStack />
            )}
        </NavigationContainer>
    );
}
