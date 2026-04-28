/**
 * Color Palette — exact hex values from COLOR_MIGRATION_SUMMARY.md
 *
 * Light mode: values as specified in the palette.
 * Dark mode: derived counterparts that maintain WCAG contrast on dark surfaces.
 *
 * CRITICAL: Every light-mode hex is preserved AS-IS. No modifications.
 */

// ─── Light mode ────────────────────────────────────────────────────────────

export const lightColors = {
  // Blues
  blue50:  '#e8f4fc',
  blue100: '#b9dcf7',
  blue200: '#97cbf3',
  blue300: '#67b3ee',
  blue400: '#49a5ea',
  blue500: '#4096ff',
  blue600: '#1677ff',
  blue700: '#1465a3',
  blue800: '#0f4e7e',
  blue900: '#0c3c60',

  // Info blues
  info50:  '#e6f5fc',
  info100: '#b1e0f7',
  info200: '#8bd1f3',
  info300: '#56bcee',
  info400: '#35afea',
  info500: '#039be5',
  info600: '#038dd0',
  info700: '#026ea3',
  info800: '#02557e',
  info900: '#014160',

  // Grays
  gray50:  '#fcfcfc',
  gray100: '#f5f5f5',
  gray200: '#f1f1f1',
  gray300: '#eaeaea',
  gray400: '#e6e6e6',
  gray500: '#e0e0e0',
  gray600: '#cccccc',
  gray700: '#b2b2b2',
  gray800: '#8a8a8a',
  gray900: '#696969',

  // Text
  textPrimary:   '#212121',
  textSecondary: '#6a6a6a',
  textDisabled:  '#999999',
  textInverse:   '#ffffff',

  // Semantic
  success:      '#4caf50',
  successLight: '#c8e6c9',
  error:        '#e53935',
  errorLight:   '#f7c2c0',
  warning:      '#f9a825',
  warningLight: '#fde4bb',
  info:         '#039be5',
  infoLight:    '#b1e0f7',

  // Backgrounds
  bgPage:     '#f8fafc',
  bgCard:     '#ffffff',
  bgElevated: '#f5f5f5',

  // Borders
  borderLight: '#e0e0e0',

  // Shadows (stored as strings for JS usage)
  shadowSm: '0 1px 2px rgba(0,0,0,0.05)',
  shadowMd: '0 4px 6px rgba(0,0,0,0.07)',
  shadowLg: '0 10px 15px rgba(0,0,0,0.1)',

  // Derived aliases used by Ant Design theme
  primary:        '#4096ff',   // blue500
  primaryHover:   '#1677ff',   // blue600
  primarySoft:    '#e8f4fc',   // blue50
  secondary:      '#6a6a6a',   // textSecondary
  secondaryHover: '#212121',   // textPrimary
  textTertiary:   '#999999',   // textDisabled
  borderDefault:  '#e0e0e0',   // borderLight
  borderHeavy:    '#b2b2b2',   // gray700
} as const

// ─── Dark mode ─────────────────────────────────────────────────────────────
// Backgrounds flip to dark surfaces; text flips to light.
// Blues shift to lighter variants for visibility on dark backgrounds.
// Semantic colors are brightened slightly for dark-surface contrast.

export const darkColors = {
  // Blues (lighter variants for dark bg)
  blue50:  '#0c3c60',
  blue100: '#0f4e7e',
  blue200: '#1465a3',
  blue300: '#1981d0',
  blue400: '#1c8ee5',
  blue500: '#49a5ea',
  blue600: '#67b3ee',
  blue700: '#97cbf3',
  blue800: '#b9dcf7',
  blue900: '#e8f4fc',

  // Info blues (lighter for dark)
  info50:  '#014160',
  info100: '#02557e',
  info200: '#026ea3',
  info300: '#038dd0',
  info400: '#039be5',
  info500: '#35afea',
  info600: '#56bcee',
  info700: '#8bd1f3',
  info800: '#b1e0f7',
  info900: '#e6f5fc',

  // Grays (inverted for dark surfaces)
  gray50:  '#1a1a1a',
  gray100: '#222222',
  gray200: '#2a2a2a',
  gray300: '#333333',
  gray400: '#3d3d3d',
  gray500: '#4a4a4a',
  gray600: '#5e5e5e',
  gray700: '#787878',
  gray800: '#a0a0a0',
  gray900: '#c8c8c8',

  // Text (inverted)
  textPrimary:   '#f5f5f5',
  textSecondary: '#b2b2b2',
  textDisabled:  '#696969',
  textInverse:   '#212121',

  // Semantic (brightened for dark bg — WCAG AA on #1e1e1e)
  success:      '#66bb6a',
  successLight: '#1b3a1c',
  error:        '#ef5350',
  errorLight:   '#3b1110',
  warning:      '#ffca28',
  warningLight: '#3d2a00',
  info:         '#29b6f6',
  infoLight:    '#01344a',

  // Backgrounds
  bgPage:     '#121212',
  bgCard:     '#1e1e1e',
  bgElevated: '#2a2a2a',

  // Borders
  borderLight: '#333333',

  // Shadows
  shadowSm: '0 1px 2px rgba(0,0,0,0.4)',
  shadowMd: '0 4px 6px rgba(0,0,0,0.5)',
  shadowLg: '0 10px 15px rgba(0,0,0,0.6)',

  // Derived aliases
  primary:        '#49a5ea',
  primaryHover:   '#67b3ee',
  primarySoft:    '#0c3c60',
  secondary:      '#b2b2b2',
  secondaryHover: '#f5f5f5',
  textTertiary:   '#696969',
  borderDefault:  '#333333',
  borderHeavy:    '#4a4a4a',
} as const

export type ColorPalette = typeof lightColors

export function getColors(mode: 'light' | 'dark'): ColorPalette {
  return mode === 'dark' ? (darkColors as unknown as ColorPalette) : lightColors
}

/**
 * @deprecated Use CSS variables (var(--primary), etc.) or getColors() instead.
 */
export const colors = {
  midnightBlue:  '#4096ff',
  dustyBlue:     '#6a6a6a',
  ivory:         '#f8fafc',
  deepNavy:      '#212121',
  buttercream:   '#f5f5f5',
} as const

export type ColorKey = keyof typeof colors
