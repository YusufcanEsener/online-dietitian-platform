import React, { useRef, useReducer } from 'react';
import {
    View,
    TextInput,
    Text,
    StyleSheet,
    ViewStyle,
    TextInputProps,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Radius, Spacing, Typography } from '../../constants/theme';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    helper?: string;
    leftIcon?: string;
    containerStyle?: ViewStyle;
    isPassword?: boolean;
    innerRef?: React.RefObject<TextInput>;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    helper,
    leftIcon,
    containerStyle,
    isPassword = false,
    innerRef,
    onFocus: onFocusProp,
    onBlur: onBlurProp,
    ...props
}) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [, forceUpdate] = useReducer((x) => x + 1, 0);
    const isFocusedRef = useRef(false);

    const handleFocus = (e: any) => {
        isFocusedRef.current = true;
        forceUpdate();
        onFocusProp?.(e);
    };

    const handleBlur = (e: any) => {
        isFocusedRef.current = false;
        forceUpdate();
        onBlurProp?.(e);
    };

    const isFocused = isFocusedRef.current;

    return (
        <View style={[styles.container, containerStyle]}>
            {label && <Text style={styles.label}>{label}</Text>}
            <View
                style={[
                    styles.inputWrapper,
                    isFocused && styles.focused,
                    error ? styles.errorBorder : null,
                ]}
            >
                {leftIcon && (
                    <Ionicons
                        name={leftIcon as any}
                        size={18}
                        color={isFocused ? Colors.primary : Colors.mutedForeground}
                        style={styles.leftIcon}
                    />
                )}
                <TextInput
                    ref={innerRef}
                    style={[styles.input, leftIcon ? styles.inputWithIcon : null]}
                    placeholderTextColor={Colors.mutedForeground}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    secureTextEntry={isPassword && !showPassword}
                    selectionColor={Colors.primary}
                    {...props}
                />
                {isPassword && (
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                        <Ionicons
                            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                            size={18}
                            color={Colors.mutedForeground}
                        />
                    </TouchableOpacity>
                )}
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
            {helper && !error && <Text style={styles.helperText}>{helper}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: Spacing.md,
    },
    label: {
        fontSize: Typography.size.sm,
        fontWeight: '600',
        color: Colors.foreground,
        marginBottom: Spacing.xs,
        letterSpacing: 0.3,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.input,
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    focused: {
        borderColor: Colors.primary,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    errorBorder: {
        borderColor: Colors.destructive,
    },
    leftIcon: {
        marginLeft: Spacing.md,
    },
    input: {
        flex: 1,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.md,
        color: Colors.foreground,
        fontSize: Typography.size.base,
    },
    inputWithIcon: {
        paddingLeft: Spacing.sm,
    },
    eyeIcon: {
        padding: Spacing.md,
    },
    errorText: {
        fontSize: Typography.size.xs,
        color: Colors.destructive,
        marginTop: Spacing.xs,
    },
    helperText: {
        fontSize: Typography.size.xs,
        color: Colors.mutedForeground,
        marginTop: Spacing.xs,
    },
});
