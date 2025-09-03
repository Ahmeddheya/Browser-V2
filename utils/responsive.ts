import { Dimensions, PixelRatio, Platform } from 'react-native';

// الحصول على أبعاد الشاشة
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// تعريف نقاط التوقف للشاشات المختلفة
export const BREAKPOINTS = {
  xs: 320,   // شاشات صغيرة جداً
  sm: 375,   // شاشات صغيرة
  md: 414,   // شاشات متوسطة
  lg: 768,   // شاشات كبيرة (تابلت)
  xl: 1024,  // شاشات كبيرة جداً
};

// تعريف أنواع الشاشات
export type ScreenSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// الحصول على حجم الشاشة الحالي
export const getScreenSize = (): ScreenSize => {
  if (SCREEN_WIDTH <= BREAKPOINTS.xs) return 'xs';
  if (SCREEN_WIDTH <= BREAKPOINTS.sm) return 'sm';
  if (SCREEN_WIDTH <= BREAKPOINTS.md) return 'md';
  if (SCREEN_WIDTH <= BREAKPOINTS.lg) return 'lg';
  return 'xl';
};

// الحصول على نسبة الكثافة
export const getPixelRatio = () => PixelRatio.get();

// الحصول على كثافة الخط
export const getFontScale = () => PixelRatio.getFontScale();

// حساب الحجم المتجاوب بناءً على عرض الشاشة
export const wp = (percentage: number): number => {
  const value = (percentage * SCREEN_WIDTH) / 100;
  return Math.round(PixelRatio.roundToNearestPixel(value));
};

// حساب الحجم المتجاوب بناءً على ارتفاع الشاشة
export const hp = (percentage: number): number => {
  const value = (percentage * SCREEN_HEIGHT) / 100;
  return Math.round(PixelRatio.roundToNearestPixel(value));
};

// حساب حجم الخط المتجاوب
export const responsiveFontSize = (size: number): number => {
  const scale = SCREEN_WIDTH / 375; // 375 هو عرض iPhone 6/7/8 كمرجع
  const newSize = size * scale;
  
  // تطبيق حدود دنيا وعليا للخط
  const minSize = size * 0.8;
  const maxSize = size * 1.3;
  
  return Math.round(PixelRatio.roundToNearestPixel(
    Math.max(minSize, Math.min(maxSize, newSize))
  ));
};

// حساب المسافات المتجاوبة (padding/margin)
export const responsiveSpacing = (size: number): number => {
  const scale = Math.min(SCREEN_WIDTH / 375, 1.5); // حد أقصى 1.5x
  return Math.round(PixelRatio.roundToNearestPixel(size * scale));
};

// حساب حجم الأيقونات المتجاوب
export const responsiveIconSize = (size: number): number => {
  const screenSize = getScreenSize();
  
  const multipliers = {
    xs: 0.8,
    sm: 0.9,
    md: 1.0,
    lg: 1.2,
    xl: 1.4,
  };
  
  return Math.round(size * multipliers[screenSize]);
};

// حساب عرض العناصر في الشبكة
export const getGridItemWidth = (itemsPerRow: number, spacing: number = 16): number => {
  const totalSpacing = spacing * (itemsPerRow + 1);
  const availableWidth = SCREEN_WIDTH - totalSpacing;
  return Math.floor(availableWidth / itemsPerRow);
};

// تحديد عدد العناصر في الصف بناءً على حجم الشاشة
export const getItemsPerRow = (): number => {
  const screenSize = getScreenSize();
  
  switch (screenSize) {
    case 'xs': return 3;
    case 'sm': return 4;
    case 'md': return 4;
    case 'lg': return 6;
    case 'xl': return 8;
    default: return 4;
  }
};

// حساب ارتفاع العناصر المتجاوب
export const responsiveHeight = (baseHeight: number): number => {
  const scale = Math.min(SCREEN_HEIGHT / 812, 1.2); // iPhone X height as reference
  return Math.round(PixelRatio.roundToNearestPixel(baseHeight * scale));
};

// حساب عرض العناصر المتجاوب
export const responsiveWidth = (baseWidth: number): number => {
  const scale = Math.min(SCREEN_WIDTH / 375, 1.3);
  return Math.round(PixelRatio.roundToNearestPixel(baseWidth * scale));
};

// فحص ما إذا كانت الشاشة صغيرة
export const isSmallScreen = (): boolean => {
  return SCREEN_WIDTH <= BREAKPOINTS.sm;
};

// فحص ما إذا كانت الشاشة متوسطة
export const isMediumScreen = (): boolean => {
  return SCREEN_WIDTH > BREAKPOINTS.sm && SCREEN_WIDTH <= BREAKPOINTS.md;
};

// فحص ما إذا كانت الشاشة كبيرة
export const isLargeScreen = (): boolean => {
  return SCREEN_WIDTH > BREAKPOINTS.md;
};

// حساب نصف قطر الحدود المتجاوب
export const responsiveBorderRadius = (radius: number): number => {
  const scale = Math.min(SCREEN_WIDTH / 375, 1.2);
  return Math.round(radius * scale);
};

// حساب سماكة الحدود المتجاوبة
export const responsiveBorderWidth = (width: number): number => {
  const pixelRatio = getPixelRatio();
  return Math.max(1, Math.round(width * pixelRatio) / pixelRatio);
};

// الحصول على معلومات الشاشة الشاملة
export const getScreenInfo = () => {
  return {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    size: getScreenSize(),
    pixelRatio: getPixelRatio(),
    fontScale: getFontScale(),
    isSmall: isSmallScreen(),
    isMedium: isMediumScreen(),
    isLarge: isLargeScreen(),
    platform: Platform.OS,
  };
};

// نظام الشبكة المرن
export const createFlexGrid = (columns: number, gap: number = 16) => {
  const itemWidth = (SCREEN_WIDTH - (gap * (columns + 1))) / columns;
  
  return {
    container: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      paddingHorizontal: gap / 2,
    },
    item: {
      width: itemWidth,
      marginHorizontal: gap / 2,
      marginBottom: gap,
    },
  };
};

// تصدير الثوابت المفيدة
export const RESPONSIVE_CONSTANTS = {
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  PIXEL_RATIO: getPixelRatio(),
  FONT_SCALE: getFontScale(),
  SCREEN_SIZE: getScreenSize(),
  IS_SMALL_SCREEN: isSmallScreen(),
  IS_MEDIUM_SCREEN: isMediumScreen(),
  IS_LARGE_SCREEN: isLargeScreen(),
};

export default {
  wp,
  hp,
  responsiveFontSize,
  responsiveSpacing,
  responsiveIconSize,
  getGridItemWidth,
  getItemsPerRow,
  responsiveHeight,
  responsiveWidth,
  responsiveBorderRadius,
  responsiveBorderWidth,
  getScreenInfo,
  createFlexGrid,
  BREAKPOINTS,
  RESPONSIVE_CONSTANTS,
};