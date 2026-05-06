import React from 'react';
import { View, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { Colors } from '../../constants/colors';
import { Radius, Shadows } from '../../constants/theme';

interface CardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    variant?: 'default' | 'elevated' | 'bordered';
}

export const Card: React.FC<CardProps> = ({ children, style, variant = 'default' }) => {
    return (
        <View style={[styles.base, styles[variant], style]}>
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    base: {
        borderRadius: Radius.xl,
        padding: 16,
        backgroundColor: Colors.card,
    },
    default: {
        borderWidth: 1,
        borderColor: Colors.border,
    },
    elevated: {
        borderWidth: 1,
        borderColor: Colors.border,
        ...Shadows.md,
    },
    bordered: {
        borderWidth: 1,
        borderColor: Colors.primary + '40',
        ...Shadows.neon,
    },
});
