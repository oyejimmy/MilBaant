import type { ThemeConfig } from 'antd'
import type { ThemeMode } from '@/context/ThemeModeContext'

export const palette = {
  heaven: '#fefefe',
  pearl: '#f7f9fa',
  diamond: '#e7e9ee',
  lilac: '#caccd5',
  periwinkle: '#909ffa',
  silver: '#a1a0a5',
}

export function createAntTheme(mode: ThemeMode): ThemeConfig {
  const isDark = mode === 'dark'

  return {
    token: {
      colorPrimary: palette.periwinkle,
      colorInfo: palette.periwinkle,
      colorText: isDark ? '#f0f2f8' : '#1e2330',
      colorTextSecondary: isDark ? '#b8bdd0' : '#3d4455',
      colorTextTertiary: isDark ? '#7a7f96' : '#7a8099',
      colorBgBase: isDark ? '#141720' : '#f0f2f5',
      colorBgContainer: isDark ? '#1c2030' : '#ffffff',
      colorBgElevated: isDark ? '#1e2336' : '#ffffff',
      colorBorder: isDark ? '#2a2f45' : '#e2e5ec',
      colorBorderSecondary: isDark ? '#252a3d' : '#eaecf0',
      colorFill: isDark ? 'rgba(144,159,250,0.08)' : 'rgba(144,159,250,0.06)',
      colorFillAlter: isDark ? '#1e2336' : '#f5f6fa',
      borderRadius: 7,
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      boxShadow: 'none',
      boxShadowSecondary: 'none',
    },
    components: {
      Layout: {
        bodyBg: isDark ? '#141720' : '#f0f2f5',
        headerBg: isDark ? '#161a27' : '#ffffff',
        siderBg: isDark ? '#161a27' : '#ffffff',
      },
      Card: {
        colorBgContainer: isDark ? '#1c2030' : '#ffffff',
        headerBg: 'transparent',
        borderRadiusLG: 7,
        boxShadowTertiary: 'none',
      },
      Table: {
        colorBgContainer: isDark ? '#1c2030' : '#ffffff',
        headerBg: isDark ? '#1e2336' : '#f5f6fa',
        rowHoverBg: isDark ? 'rgba(144,159,250,0.06)' : 'rgba(144,159,250,0.05)',
        borderColor: isDark ? '#2a2f45' : '#e2e5ec',
        headerColor: isDark ? '#f0f2f8' : '#1e2330',
        borderRadiusLG: 7,
      },
      Modal: {
        contentBg: isDark ? '#1c2030' : '#ffffff',
        headerBg: 'transparent',
        borderRadiusLG: 7,
      },
      Drawer: {
        colorBgElevated: isDark ? '#1c2030' : '#ffffff',
      },
      Input: {
        colorBgContainer: isDark ? '#1e2336' : '#ffffff',
        colorText: isDark ? '#f0f2f8' : '#1e2330',
        hoverBorderColor: palette.periwinkle,
        borderRadius: 7,
      },
      InputNumber: {
        colorBgContainer: isDark ? '#1e2336' : '#ffffff',
        colorText: isDark ? '#f0f2f8' : '#1e2330',
        hoverBorderColor: palette.periwinkle,
        borderRadius: 7,
      },
      Select: {
        colorBgContainer: isDark ? '#1e2336' : '#ffffff',
        colorText: isDark ? '#f0f2f8' : '#1e2330',
        optionSelectedBg: isDark ? 'rgba(144,159,250,0.14)' : 'rgba(144,159,250,0.1)',
        borderRadius: 7,
      },
      DatePicker: {
        colorBgContainer: isDark ? '#1e2336' : '#ffffff',
        colorText: isDark ? '#f0f2f8' : '#1e2330',
        hoverBorderColor: palette.periwinkle,
        borderRadius: 7,
      },
      Button: {
        borderRadius: 7,
        primaryShadow: 'none',
        defaultShadow: 'none',
        colorBgContainer: isDark ? '#1e2336' : '#ffffff',
        defaultColor: isDark ? '#f0f2f8' : '#1e2330',
        defaultBorderColor: isDark ? '#2a2f45' : '#e2e5ec',
      },
      Menu: {
        itemBg: 'transparent',
        darkItemBg: 'transparent',
        darkSubMenuItemBg: 'transparent',
        itemSelectedBg: isDark ? 'rgba(144,159,250,0.12)' : 'rgba(144,159,250,0.1)',
        itemColor: isDark ? '#b8bdd0' : '#3d4455',
        itemSelectedColor: palette.periwinkle,
        itemHoverColor: isDark ? '#f0f2f8' : '#1e2330',
        itemHoverBg: isDark ? 'rgba(144,159,250,0.07)' : 'rgba(144,159,250,0.06)',
        borderRadius: 7,
      },
      Tag: {
        borderRadius: 7,
      },
      Statistic: {
        colorTextDescription: isDark ? '#7a7f96' : '#7a8099',
      },
      Alert: {
        borderRadius: 7,
      },
      Popover: {
        colorBgElevated: isDark ? '#1e2336' : '#ffffff',
        borderRadiusLG: 7,
      },
    },
  }
}
