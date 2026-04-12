import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { LoadingScreen } from '../components/ui/LoadingScreen';
import AuthNavigator from './AuthNavigator';
import MemberNavigator from './MemberNavigator';
import DietitianNavigator from './DietitianNavigator';
import AdminNavigator from './AdminNavigator';

export type RootStackParamList = {
    Auth: undefined;
    Member: undefined;
    Dietitian: undefined;
    Admin: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
    const { isAuthenticated, isLoading, user } = useAuth();

    if (isLoading) {
        return <LoadingScreen message="DietPlatform yükleniyor..." />;
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {!isAuthenticated ? (
                    <Stack.Screen name="Auth" component={AuthNavigator} />
                ) : user?.role === 'admin' ? (
                    <Stack.Screen name="Admin" component={AdminNavigator} />
                ) : user?.role === 'dietitian' ? (
                    <Stack.Screen name="Dietitian" component={DietitianNavigator} />
                ) : (
                    <Stack.Screen name="Member" component={MemberNavigator} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
