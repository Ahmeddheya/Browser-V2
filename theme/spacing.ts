import { responsiveSpacing } from '../utils/responsive';

export const spacing = {
  // Base spacing units
  xs: responsiveSpacing(4),
  sm: responsiveSpacing(8),
  md: responsiveSpacing(12),
  lg: responsiveSpacing(16),
  xl: responsiveSpacing(20),
  xxl: responsiveSpacing(24),
  xxxl: responsiveSpacing(32),
  
  // Specific spacing values
  tiny: responsiveSpacing(2),
  small: responsiveSpacing(6),
  medium: responsiveSpacing(10),
  large: responsiveSpacing(14),
  huge: responsiveSpacing(18),
  massive: responsiveSpacing(28),
  
  // Component-specific spacing
  component: {
    // Padding
    padding: {
      xs: responsiveSpacing(4),
      sm: responsiveSpacing(8),
      md: responsiveSpacing(12),
      lg: responsiveSpacing(16),
      xl: responsiveSpacing(20),
    },
    
    // Margin
    margin: {
      xs: responsiveSpacing(4),
      sm: responsiveSpacing(8),
      md: responsiveSpacing(12),
      lg: responsiveSpacing(16),
      xl: responsiveSpacing(20),
    },
    
    // Gap
    gap: {
      xs: responsiveSpacing(4),
      sm: responsiveSpacing(8),
      md: responsiveSpacing(12),
      lg: responsiveSpacing(16),
      xl: responsiveSpacing(20),
    },
  },
  
  // Layout spacing
  layout: {
    screenPadding: responsiveSpacing(20),
    sectionSpacing: responsiveSpacing(24),
    cardSpacing: responsiveSpacing(16),
    itemSpacing: responsiveSpacing(12),
    buttonSpacing: responsiveSpacing(8),
  },
  
  // Header spacing
  header: {
    paddingHorizontal: responsiveSpacing(20),
    paddingVertical: responsiveSpacing(16),
    paddingTop: responsiveSpacing(50),
    height: responsiveSpacing(80),
  },
  
  // Tab spacing
  tab: {
    cardMargin: responsiveSpacing(16),
    cardPadding: responsiveSpacing(16),
    iconMargin: responsiveSpacing(8),
    textMargin: responsiveSpacing(4),
  },
  
  // Button spacing
  button: {
    paddingHorizontal: responsiveSpacing(16),
    paddingVertical: responsiveSpacing(12),
    marginHorizontal: responsiveSpacing(8),
    marginVertical: responsiveSpacing(6),
  },
  
  // Modal spacing
  modal: {
    padding: responsiveSpacing(24),
    margin: responsiveSpacing(20),
    contentSpacing: responsiveSpacing(16),
  },
  
  // Form spacing
  form: {
    fieldSpacing: responsiveSpacing(16),
    labelMargin: responsiveSpacing(8),
    inputPadding: responsiveSpacing(12),
  },
};

export type Spacing = typeof spacing;