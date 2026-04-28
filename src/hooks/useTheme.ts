/**
 * useTheme — convenience hook for theme mode.
 *
 * Wraps useTheme from ThemeModeContext so components can import
 * from hooks/ without touching the context file directly.
 *
 * Usage:
 *   const { mode, isDark, isLight, toggle, setLight, setDark } = useTheme()
 */
export { useTheme, useThemeMode } from '@/context/ThemeModeContext'
