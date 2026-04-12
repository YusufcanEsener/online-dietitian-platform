import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography, Spacing } from '../../constants/theme';
import { useNavigation } from '@react-navigation/native';

interface HeaderProps {
    title: string;
    subtitle?: string;
    showBack?: boolean;
    rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
    title,
    subtitle,
    showBack = false,
    rightAction,
}) => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    return (
        <>
            <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
            <View style={[styles.container, { paddingTop: insets.top + Spacing.sm }]}>
                <View style={styles.left}>
                    {showBack && (
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            style={styles.backButton}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="arrow-back" size={22} color={Colors.foreground} />
                        </TouchableOpacity>
                    )}
                    <View>
                        <Text style={styles.title}>{title}</Text>
                        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                    </View>
                </View>
                {rightAction && <View style={styles.right}>{rightAction}</View>}
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.base,
        paddingBottom: Spacing.md,
        backgroundColor: Colors.background,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    left: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        flex: 1,
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    right: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    title: {
        fontSize: Typography.size.xl,
        fontWeight: '800',
        color: Colors.foreground,
    },
    subtitle: {
        fontSize: Typography.size.sm,
        color: Colors.mutedForeground,
        marginTop: 2,
    },
});
