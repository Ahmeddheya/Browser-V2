export const colors = {
  // Primary Colors
  primary: '#4285f4',
  primaryLight: '#5a95f5',
  primaryDark: '#3367d6',
  
  // Secondary Colors
  secondary: '#ff9800',
  secondaryLight: '#ffb74d',
  secondaryDark: '#f57c00',
  
  // Status Colors
  success: '#4CAF50',
  successLight: '#66BB6A',
  successDark: '#388E3C',
  
  warning: '#ff9800',
  warningLight: '#ffb74d',
  warningDark: '#f57c00',
  
  error: '#ff6b6b',
  errorLight: '#ff8a80',
  errorDark: '#d32f2f',
  
  info: '#2196F3',
  infoLight: '#42A5F5',
  infoDark: '#1976D2',
  
  // Background Colors
  background: {
    primary: '#0a0b1e',
    secondary: '#1a1b3a',
    tertiary: '#2a2b4a',
    card: 'rgba(255, 255, 255, 0.05)',
    cardHover: 'rgba(255, 255, 255, 0.08)',
    modal: 'rgba(0, 0, 0, 0.7)',
  },
  
  // Text Colors
  text: {
    primary: '#ffffff',
    secondary: 'rgba(255, 255, 255, 0.8)',
    tertiary: 'rgba(255, 255, 255, 0.6)',
    disabled: 'rgba(255, 255, 255, 0.4)',
    placeholder: '#888888',
  },
  
  // Border Colors
  border: {
    primary: 'rgba(255, 255, 255, 0.1)',
    secondary: 'rgba(255, 255, 255, 0.08)',
    focus: 'rgba(66, 133, 244, 0.3)',
    error: 'rgba(255, 107, 107, 0.3)',
    success: 'rgba(76, 175, 80, 0.3)',
  },
  
  // Gradient Colors
  gradients: {
    primary: ['#4285f4', '#5a95f5', '#6ba3f6'],
    secondary: ['#ff9800', '#ffb74d'],
    background: ['#0a0b1e', '#1a1b3a', '#2a2b4a'],
    card: ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)'],
    success: ['rgba(76, 175, 80, 0.2)', 'rgba(76, 175, 80, 0.1)'],
    warning: ['rgba(255, 152, 0, 0.2)', 'rgba(255, 152, 0, 0.1)'],
    error: ['rgba(255, 107, 107, 0.2)', 'rgba(255, 107, 107, 0.1)'],
  },
  
  // Brand Colors
  brand: {
    google: '#4285f4',
    youtube: '#ff0000',
    github: '#24292e',
    facebook: '#1877f2',
    twitter: '#1da1f2',
    instagram: '#e4405f',
  },
  
  // Incognito Mode Colors
  incognito: {
    background: ['#2c2c2c', '#1a1a1a'],
    topBar: 'rgba(44, 44, 44, 0.9)',
    accent: '#ff6b6b',
  },
  
  // Transparent Colors
  transparent: 'transparent',
  
  // Overlay Colors
  overlay: {
    light: 'rgba(255, 255, 255, 0.1)',
    medium: 'rgba(255, 255, 255, 0.2)',
    dark: 'rgba(0, 0, 0, 0.3)',
    darker: 'rgba(0, 0, 0, 0.5)',
    darkest: 'rgba(0, 0, 0, 0.7)',
  },
};

export type Colors = typeof colors;