/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type ThemeMode = 'light' | 'dark'

interface ThemeModeContextValue {
  mode: ThemeMode
  toggleMode: () => void
  setMode: (mode: ThemeMode) => void
}

const STORAGE_KEY = 'milbaant-theme-mode'

const ThemeModeContext = createContext<ThemeModeContextValue | undefined>(undefined)

function getInitialMode(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'dark'
  }

  const storedMode = window.localStorage.getItem(STORAGE_KEY)

  if (storedMode === 'light' || storedMode === 'dark') {
    return storedMode
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(getInitialMode)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, mode)
    document.documentElement.dataset.theme = mode
  }, [mode])

  const value = useMemo<ThemeModeContextValue>(
    () => ({
      mode,
      setMode,
      toggleMode: () => {
        setMode((currentMode) => (currentMode === 'dark' ? 'light' : 'dark'))
      },
    }),
    [mode],
  )

  return (
    <ThemeModeContext.Provider value={value}>
      {children}
    </ThemeModeContext.Provider>
  )
}

export function useThemeMode() {
  const context = useContext(ThemeModeContext)

  if (!context) {
    throw new Error('useThemeMode must be used within ThemeModeProvider')
  }

  return context
}

/**
 * useTheme — extended hook with boolean helpers.
 *
 * Usage:
 *   const { isDark, isLight, toggle, setLight, setDark, mode } = useTheme()
 */
export function useTheme() {
  const { mode, toggleMode, setMode } = useThemeMode()

  return {
    mode,
    isDark:   mode === 'dark',
    isLight:  mode === 'light',
    toggle:   toggleMode,
    setLight: () => setMode('light'),
    setDark:  () => setMode('dark'),
    /** @deprecated use toggle() */
    toggleMode,
    /** @deprecated use setLight() / setDark() */
    setMode,
  }
}
