// =============================================
// RENK PALETİ - Web frontend ile aynı tema
// Dark Green Neon Theme
// =============================================

export const Colors = {
    // Ana renkler
    background: '#0c1a0c',      // hsl(110, 40%, 6%)
    foreground: '#e8f0e8',      // hsl(110, 20%, 95%)

    // Kart
    card: '#172517',            // hsl(110, 28%, 10%)
    cardForeground: '#e8f0e8',

    // Yüzey
    surface: '#1a2e1a',         // hsl(110, 28%, 12%)
    surfaceElevated: '#1e331e', // hsl(110, 25%, 14%)

    // Primary - Neon Yeşil
    primary: '#4dfa2d',         // hsl(107, 81%, 50%) - parlak yeşil
    primaryForeground: '#0c1a0c',

    // Secondary
    secondary: '#1f2e1f',       // hsl(110, 20%, 15%)
    secondaryForeground: '#d0ddd0',

    // Muted
    muted: '#202e20',           // hsl(110, 15%, 18%)
    mutedForeground: '#7a9a7a', // hsl(110, 15%, 60%)

    // Accent
    accent: '#3de01e',          // hsl(107, 70%, 45%)
    accentForeground: '#0c1a0c',

    // Destructive (kırmızı)
    destructive: '#dc2626',
    destructiveForeground: '#ffffff',

    // Border / Input
    border: '#252e25',          // hsl(110, 20%, 18%)
    input: '#1f2e1f',

    // Sidebar
    sidebar: '#101e10',         // hsl(110, 30%, 8%)

    // Status colors
    success: '#4dfa2d',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',

    // Gradient
    gradientStart: '#4dfa2d',
    gradientEnd: '#1fbf0a',

    // Şeffaf / overlay
    overlay: 'rgba(0, 0, 0, 0.5)',
    glassBackground: 'rgba(23, 37, 23, 0.8)',

    // White / Text
    white: '#ffffff',
    black: '#000000',
    transparent: 'transparent',
};

export const Gradients = {
    primary: ['#4dfa2d', '#1fbf0a'] as [string, string],
    background: ['#0c1a0c', '#172517'] as [string, string],
    card: ['#172517', '#1a2e1a'] as [string, string],
    danger: ['#dc2626', '#b91c1c'] as [string, string],
    warning: ['#f59e0b', '#d97706'] as [string, string],
};
