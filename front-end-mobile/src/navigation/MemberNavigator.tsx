import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';

// Member Screens
import MemberDashboardScreen from '../screens/member/DashboardScreen';
import ExpertsScreen from '../screens/member/ExpertsScreen';
import MemberMessagesScreen from '../screens/member/MessagesScreen';
import ChatDetailScreen from '../screens/member/ChatDetailScreen';
import ProgressScreen from '../screens/member/ProgressScreen';
import MemberProfileScreen from '../screens/member/ProfileScreen';
import MyPlanScreen from '../screens/member/MyPlanScreen';
import CalorieCalculatorScreen from '../screens/member/CalorieCalculatorScreen';
import NotificationsScreen from '../screens/member/NotificationsScreen';

export type MemberTabParamList = {
    Dashboard: undefined;
    Experts: undefined;
    MessagesTab: undefined;
    Notifications: undefined;
    Profile: undefined;
};

export type MemberStackParamList = {
    MemberTabs: undefined;
    ChatDetail: { chatId: string; participantName: string };
    MyPlan: undefined;
    CalorieCalculator: undefined;
    Progress: undefined;
};

const Tab = createBottomTabNavigator<MemberTabParamList>();
const Stack = createNativeStackNavigator<MemberStackParamList>();

function MemberTabs() {
    const insets = useSafeAreaInsets();
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: Colors.sidebar,
                    borderTopColor: Colors.border,
                    borderTopWidth: 1,
                    height: 60 + insets.bottom,
                    paddingBottom: insets.bottom + 6,
                    paddingTop: 8,
                },
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: Colors.mutedForeground,
                tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
                tabBarIcon: ({ color, size, focused }) => {
                    const icons: Record<string, string> = {
                        Dashboard: 'home',
                        Experts: 'people',
                        MessagesTab: 'chatbubbles',
                        Notifications: 'notifications',
                        Profile: 'person',
                    };
                    return (
                        <Ionicons
                            name={(focused ? icons[route.name] : icons[route.name] + '-outline') as any}
                            size={size}
                            color={color}
                        />
                    );
                },
            })}
        >
            <Tab.Screen name="Dashboard" component={MemberDashboardScreen} options={{ title: 'Ana Sayfa' }} />
            <Tab.Screen name="Experts" component={ExpertsScreen} options={{ title: 'Uzmanlar' }} />
            <Tab.Screen name="MessagesTab" component={MemberMessagesScreen} options={{ title: 'Mesajlar' }} />
            <Tab.Screen
                name="Notifications"
                component={NotificationsScreen}
                options={{
                    title: 'Bildirimler',
                    tabBarBadge: undefined, // dinamik badge buraya eklenebilir
                }}
            />
            <Tab.Screen name="Profile" component={MemberProfileScreen} options={{ title: 'Profil' }} />
        </Tab.Navigator>
    );
}

export default function MemberNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="MemberTabs" component={MemberTabs} />
            <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
            <Stack.Screen name="MyPlan" component={MyPlanScreen} />
            <Stack.Screen name="CalorieCalculator" component={CalorieCalculatorScreen} />
            <Stack.Screen name="Progress" component={ProgressScreen} />
        </Stack.Navigator>
    );
}
