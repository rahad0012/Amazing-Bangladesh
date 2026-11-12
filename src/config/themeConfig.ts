/**
 * Design System Tokens & Configuration
 * Master Theme for Bangladesh Tourism Website (অপরূপ বাংলাদেশ)
 */

export const THEME_COLORS = {
  primary: '#123C32',       // Deep Forest Green
  primaryHover: '#0d2d25',
  secondary: '#1C5948',     // Rich Emerald
  secondaryHover: '#16483a',
  accent: '#D9A441',        // Golden Mustard / Amber
  accentHover: '#c59132',
  background: '#F7F8F5',    // Soft Off-White / Cream
  cardBackground: '#FFFFFF',// Pure Card White
  text: '#1D2924',          // Dark Charcoal Green
  mutedText: '#69766F',     // Slate Grey-Green
  borderColor: '#E3E7E1',   // Subtle Border
  danger: '#DC3545',
  success: '#198754',
  warning: '#FFC107',
  info: '#0DCAF0'
} as const;

export const BREAKPOINTS = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1400
} as const;

export const TYPOGRAPHY = {
  fontBn: "'Hind Siliguri', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  fontEn: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
} as const;

export const SITE_METADATA = {
  titleBn: 'অপরূপ বাংলাদেশ',
  titleEn: 'Beautiful Bangladesh',
  subtitleBn: 'অফিসিয়াল পর্যটন পোর্টাল',
  subtitleEn: 'Official Tourism Portal & Travel Guide',
  canonicalUrl: 'https://bangladesh-tourism.netlify.app/'
} as const;
