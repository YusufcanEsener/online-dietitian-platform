import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography, Spacing, Radius } from '../../constants/theme';

interface EmptyStateProps {
    icon?: string;
    title: string;
    description?: string;
    action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon = 'folder-open-outline',
    title,
    description,
    action,
}) => {
    return (
        <View style={styles.container}>
            <View style={styles.iconContainer}>
                <Ionicons name={icon as any} size={48} color={Colors.mutedForeground} />
            </View>
            <Text style={styles.title}>{title}</Text>
            {description && <Text style={styles.description}>{description}</Text>}
            {action && <View style={styles.actionContainer}>{action}</View>}
        </View>
    );
};

interface BadgeProps {
    label: string;
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'default' }) => {
    const bgColors = {
        default: Colors.secondary,
        success: Colors.primary + '20',
        warning: '#f59e0b20',
        danger: Colors.destructive + '20',
        info: '#3b82f620',
    };
    const textColors = {
        default: Colors.mutedForeground,
        success: Colors.primary,
        warning: '#f59e0b',
        danger: Colors.destructive,
        info: '#3b82f6',
    };

    return (
        <View style={[styles.badge, { backgroundColor: bgColors[variant] }]}>
            <Text style={[styles.badgeText, { color: textColors[variant] }]}>{label}</Text>
        </View>
    );
};

interface StatCardProps {
    label: string;
    value: string | number;
    icon?: string;
    color?: string;
    unit?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
    label,
    value,
    icon,
    color = Colors.primary,
    unit,
}) => {
    return (
        <View style={styles.statCard}>
            {icon && (
                <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
                    <Ionicons name={icon as any} size={20} color={color} />
                </View>
            )}
            <Text style={[styles.statValue, { color }]}>
                {value}
                {unit && <Text style={styles.statUnit}> {unit}</Text>}
            </Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing['3xl'],
        gap: Spacing.md,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: Radius.full,
        backgroundColor: Colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.sm,
    },
    title: {
        fontSize: Typography.size.lg,
        fontWeight: '700',
        color: Colors.foreground,
        textAlign: 'center',
    },
    description: {
        fontSize: Typography.size.sm,
        color: Colors.mutedForeground,
        textAlign: 'center',
        lineHeight: 20,
    },
    actionContainer: {
        marginTop: Spacing.md,
        width: '100%',
    },
    badge: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 3,
        borderRadius: Radius.full,
        alignSelf: 'flex-start',
    },
    badgeText: {
        fontSize: Typography.size.xs,
        fontWeight: '600',
    },
    statCard: {
        flex: 1,
        backgroundColor: Colors.card,
        borderRadius: Radius.xl,
        padding: Spacing.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
        gap: Spacing.xs,
    },
    statIcon: {
        width: 40,
        height: 40,
        borderRadius: Radius.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statValue: {
        fontSize: Typography.size['2xl'],
        fontWeight: '800',
    },
    statUnit: {
        fontSize: Typography.size.sm,
        fontWeight: '400',
    },
    statLabel: {
        fontSize: Typography.size.xs,
        color: Colors.mutedForeground,
        textAlign: 'center',
    },
});
