import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';

// Dietitian Screens
import DietitianDashboardScreen from '../screens/dietitian/DashboardScreen';
import DietitianMembersScreen from '../screens/dietitian/MembersScreen';
import DietitianMemberDetailScreen from '../screens/dietitian/MemberDetailScreen';
import CreatePlanScreen from '../screens/dietitian/CreatePlanScreen';
import DietitianMessagesScreen from '../screens/dietitian/MessagesScreen';
import DietitianChatDetailScreen from '../screens/member/ChatDetailScreen';
import AgenticAIScreen from '../screens/dietitian/AgenticAIScreen';
import DailyReportScreen from '../screens/dietitian/DailyReportScreen';
import DietitianProfileScreen from '../screens/dietitian/ProfileScreen';
import DietitianNotificationsScreen from '../screens/dietitian/NotificationsScreen';
import NewsScreen from '../screens/dietitian/NewsScreen';

export type DietitianTabParamList = {
    DashboardTab: undefined;
    MembersTab: undefined;
    NewsTab: undefined;
    AITab: undefined;
    DietitianProfile: undefined;
};

export type DietitianStackParamList = {
    DietitianTabs: undefined;
    MemberDetail: { memberId: string };
    CreatePlan: { memberId: string };
    ChatDetail: { chatId: string; participantName: string };
    DailyReport: undefined;
    DietitianMessages: undefined;
    DietitianNotifications: undefined;
};

const Tab = createBottomTabNavigator<DietitianTabParamList>();
const Stack = createNativeStackNavigator<DietitianStackParamList>();

function DietitianTabs() {
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
                        DashboardTab: 'grid',
                        MembersTab: 'people',
                        NewsTab: 'newspaper',
                        AITab: 'sparkles',
                        DietitianProfile: 'person',
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
            <Tab.Screen name="DashboardTab" component={DietitianDashboardScreen} options={{ title: 'Panel' }} />
            <Tab.Screen name="MembersTab" component={DietitianMembersScreen} options={{ title: 'Danışanlar' }} />
            <Tab.Screen name="NewsTab" component={NewsScreen} options={{ title: 'Haberler' }} />
            <Tab.Screen name="AITab" component={AgenticAIScreen} options={{ title: 'AI Asistan' }} />
            <Tab.Screen name="DietitianProfile" component={DietitianProfileScreen} options={{ title: 'Profil' }} />
        </Tab.Navigator>
    );
}

export default function DietitianNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="DietitianTabs" component={DietitianTabs} />
            <Stack.Screen name="MemberDetail" component={DietitianMemberDetailScreen} />
            <Stack.Screen name="CreatePlan" component={CreatePlanScreen} />
            <Stack.Screen name="ChatDetail" component={DietitianChatDetailScreen} />
            <Stack.Screen name="DailyReport" component={DailyReportScreen} />
            <Stack.Screen name="DietitianMessages" component={DietitianMessagesScreen} />
            <Stack.Screen name="DietitianNotifications" component={DietitianNotificationsScreen} />
        </Stack.Navigator>
    );
}
