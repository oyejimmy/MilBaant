/* eslint-disable react-refresh/only-export-components */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App as AntApp, ConfigProvider } from 'antd'
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import dayjs from 'dayjs'
import advancedFormat from 'dayjs/plugin/advancedFormat'
import localeData from 'dayjs/plugin/localeData'
import 'antd/dist/reset.css'
import App from '@/App'
import { AuthProvider } from '@/context/AuthContext'
import { ThemeModeProvider, useThemeMode } from '@/context/ThemeModeContext'
import { queryClient } from '@/lib/query-client'
import { GlobalStyles } from '@/styles/global-styles'
import { createAntTheme } from '@/styles/theme'
import { InstallPrompt } from '@/components/InstallPrompt/index'
import './index.css'

dayjs.extend(advancedFormat)
dayjs.extend(localeData)

function AppTheme() {
  const { mode } = useThemeMode()

  return (
    <ConfigProvider theme={createAntTheme(mode)}>
      <AntApp>
        <BrowserRouter>
          <AuthProvider>
            <GlobalStyles $mode={mode} />
            <App />
            <InstallPrompt />
          </AuthProvider>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeModeProvider>
        <AppTheme />
      </ThemeModeProvider>
    </QueryClientProvider>
  </StrictMode>,
)
