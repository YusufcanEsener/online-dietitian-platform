import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
    TextStyle,
    TouchableOpacityProps,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Gradients } from '../../constants/colors';
import { Spacing, Radius, Typography, Shadows } from '../../constants/theme';

interface ButtonProps extends TouchableOpacityProps {
    title: string;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    style?: ViewStyle;
    textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    variant = 'primary',
    size = 'md',
    loading = false,
    leftIcon,
    rightIcon,
    style,
    textStyle,
    disabled,
    ...props
}) => {
    const isDisabled = disabled || loading;

    const sizeStyles = {
        sm: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, borderRadius: Radius.md },
        md: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, borderRadius: Radius.lg },
        lg: { paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xl, borderRadius: Radius.xl },
    };

    const textSizes = {
        sm: Typography.size.sm,
        md: Typography.size.base,
        lg: Typography.size.md,
    };

    if (variant === 'primary') {
        return (
            <TouchableOpacity
                disabled={isDisabled}
                activeOpacity={0.8}
                style={[styles.base, sizeStyles[size], isDisabled && styles.disabled, style]}
                {...props}
            >
                <LinearGradient
                    colors={Gradients.primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.gradient, sizeStyles[size]]}
                >
                    {loading ? (
                        <ActivityIndicator color={Colors.primaryForeground} size="small" />
                    ) : (
                        <>
                            {leftIcon}
                            <Text style={[styles.primaryText, { fontSize: textSizes[size] }, textStyle]}>
                                {title}
                            </Text>
                            {rightIcon}
                        </>
                    )}
                </LinearGradient>
            </TouchableOpacity>
        );
    }

    const variantStyles: Record<string, ViewStyle> = {
        secondary: { backgroundColor: Colors.secondary, borderWidth: 0 },
        outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.primary },
        ghost: { backgroundColor: 'transparent', borderWidth: 0 },
        destructive: { backgroundColor: Colors.destructive, borderWidth: 0 },
    };

    const variantTextColors: Record<string, string> = {
        secondary: Colors.foreground,
        outline: Colors.primary,
        ghost: Colors.mutedForeground,
        destructive: Colors.white,
    };

    return (
        <TouchableOpacity
            disabled={isDisabled}
            activeOpacity={0.8}
            style={[
                styles.base,
                sizeStyles[size],
                variantStyles[variant],
                isDisabled && styles.disabled,
                style,
            ]}
            {...props}
        >
            {loading ? (
                <ActivityIndicator color={variantTextColors[variant]} size="small" />
            ) : (
                <>
                    {leftIcon}
                    <Text
                        style={[
                            styles.text,
                            { fontSize: textSizes[size], color: variantTextColors[variant] },
                            textStyle,
                        ]}
                    >
                        {title}
                    </Text>
                    {rightIcon}
                </>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    base: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        overflow: 'hidden',
    },
    gradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        width: '100%',
    },
    primaryText: {
        color: Colors.primaryForeground,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    text: {
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    disabled: {
        opacity: 0.5,
    },
});
