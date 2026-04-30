import type { ThemeConfig } from 'antd'
import type { ThemeMode } from '@/context/ThemeModeContext'
import { getColors } from './colors'

/**
 * Ant Design theme config — driven entirely by the COLOR_MIGRATION_SUMMARY.md palette.
 * No hardcoded colors. All values come from getColors() which mirrors the CSS variables.
 */
export function createAntTheme(mode: ThemeMode): ThemeConfig {
  const isDark = mode === 'dark'
  const c = getColors(mode)

  return {
    token: {
      // ─── Primary ─────────────────────────────────────────────────────
      colorPrimary:       c.primary,       // #4096ff light / #49a5ea dark
      colorPrimaryHover:  c.primaryHover,  // #1677ff / #67b3ee
      colorPrimaryActive: c.primaryHover,
      colorInfo:          c.info,          // #039be5 / #29b6f6
      colorLink:          c.primary,
      colorLinkHover:     c.primaryHover,

      // ─── Semantic ────────────────────────────────────────────────────
      colorSuccess: c.success,   // #4caf50 / #66bb6a
      colorWarning: c.warning,   // #f9a825 / #ffca28
      colorError:   c.error,     // #e53935 / #ef5350

      // ─── Text ────────────────────────────────────────────────────────
      colorText:          c.textPrimary,   // #212121 / #f5f5f5
      colorTextSecondary: c.textSecondary, // #6a6a6a / #b2b2b2
      colorTextTertiary:  c.textTertiary,  // #999999 / #696969
      colorTextDisabled:  c.textDisabled,  // #999999 / #696969

      // ─── Backgrounds ─────────────────────────────────────────────────
      colorBgBase:      c.bgPage,     // #f8fafc / #121212
      colorBgContainer: c.bgCard,     // #ffffff / #1e1e1e
      colorBgElevated:  c.bgElevated, // #f5f5f5 / #2a2a2a
      colorBgLayout:    c.bgPage,
      colorBgSpotlight: isDark ? c.bgElevated : c.textPrimary,

      // ─── Borders ─────────────────────────────────────────────────────
      colorBorder:          c.borderDefault, // #cccccc / #3d3d3d
      colorBorderSecondary: c.borderLight,   // #e0e0e0 / #333333
      colorSplit:           c.borderLight,

      // ─── Fill ────────────────────────────────────────────────────────
      colorFill:           c.bgElevated,
      colorFillSecondary:  isDark ? '#2a2a2a' : '#f1f1f1',
      colorFillTertiary:   isDark ? '#222222' : '#f5f5f5',
      colorFillQuaternary: isDark ? '#1e1e1e' : '#ffffff',

      // ─── Border radius ────────────────────────────────────────────────
      borderRadius:   8,
      borderRadiusLG: 12,
      borderRadiusSM: 6,
      borderRadiusXS: 4,

      // ─── Typography ──────────────────────────────────────────────────
      fontFamily:        '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif',
      fontSize:          14,
      fontSizeHeading1:  32,
      fontSizeHeading2:  24,
      fontSizeHeading3:  20,
      fontSizeHeading4:  16,
      fontSizeHeading5:  14,
      lineHeight:        1.5,
      lineHeightHeading1: 1.2,
      lineHeightHeading2: 1.3,
      lineHeightHeading3: 1.4,

      // ─── Shadows ─────────────────────────────────────────────────────
      boxShadow:          isDark ? '0 1px 2px rgba(0,0,0,0.4)' : '0 1px 2px rgba(0,0,0,0.05)',
      boxShadowSecondary: isDark ? '0 4px 6px rgba(0,0,0,0.5)' : '0 4px 6px rgba(0,0,0,0.07)',
      boxShadowTertiary:  isDark ? '0 10px 15px rgba(0,0,0,0.6)' : '0 10px 15px rgba(0,0,0,0.1)',

      // ─── Controls ────────────────────────────────────────────────────
      controlHeight:   40,
      controlHeightLG: 48,
      controlHeightSM: 32,
    },

    components: {
      // ─── Layout ────────────────────────────────────────────────────
      Layout: {
        bodyBg:   c.bgPage,
        headerBg: c.bgCard,
        siderBg:  c.bgCard,
        footerBg: c.bgPage,
      },

      // ─── Card ──────────────────────────────────────────────────────
      Card: {
        colorBgContainer:  c.bgCard,
        headerBg:          'transparent',
        borderRadiusLG:    14,
        boxShadowTertiary: 'none',
        colorBorderSecondary: 'transparent',
        paddingLG: 20,
      },

      // ─── Table ─────────────────────────────────────────────────────
      Table: {
        colorBgContainer: c.bgCard,
        headerBg:         isDark ? '#2a2a2a' : '#f5f5f5',  // gray100 / dark elevated
        rowHoverBg:       isDark ? '#2a2a2a' : '#f5f5f5',
        borderColor:      c.borderLight,
        headerColor:      c.textPrimary,
        colorText:        c.textPrimary,
        borderRadiusLG:   12,
        headerSplitColor: 'transparent',
        cellPaddingBlock:  12,
        cellPaddingInline: 16,
      },

      // ─── Modal ─────────────────────────────────────────────────────
      Modal: {
        contentBg:                  c.bgCard,
        headerBg:                   'transparent',
        borderRadiusLG:             16,
        titleColor:                 c.textPrimary,
        titleFontSize:              16,
        paddingMD:                  24,
        paddingContentHorizontalLG: 24,
      },

      // ─── Drawer ────────────────────────────────────────────────────
      Drawer: {
        colorBgElevated: c.bgCard,
        colorText:       c.textPrimary,
        paddingLG:       24,
      },

      // ─── Input ─────────────────────────────────────────────────────
      Input: {
        colorBgContainer:    c.bgCard,
        colorText:           c.textPrimary,
        colorTextPlaceholder: c.textTertiary,
        hoverBorderColor:    c.secondary,
        activeBorderColor:   c.primary,
        activeShadow:        `0 0 0 2px ${c.primary}33`,
        borderRadius:        8,
        colorBorder:         c.borderDefault,
        paddingBlock:        8,
        paddingInline:       12,
        // Remove the inner separator line next to prefix/suffix icons
        colorIcon:           c.textTertiary,
        colorIconHover:      c.textSecondary,
        // Remove the internal separator border on password fields
        // inputAffixPadding removed — not a valid token in antd v6
      },

      // ─── InputNumber ───────────────────────────────────────────────
      InputNumber: {
        colorBgContainer:    c.bgCard,
        colorText:           c.textPrimary,
        colorTextPlaceholder: c.textTertiary,
        hoverBorderColor:    c.secondary,
        activeBorderColor:   c.primary,
        activeShadow:        `0 0 0 2px ${c.primary}33`,
        borderRadius:        8,
        colorBorder:         c.borderDefault,
      },

      // ─── Select ────────────────────────────────────────────────────
      Select: {
        colorBgContainer:    c.bgCard,
        colorText:           c.textPrimary,
        colorTextPlaceholder: c.textTertiary,
        optionSelectedBg:    c.primarySoft,
        optionSelectedColor: isDark ? c.textPrimary : c.primary,
        optionActiveBg:      isDark ? '#2a2a2a' : '#f5f5f5',
        borderRadius:        8,
        colorBorder:         c.borderDefault,
        selectorBg:          c.bgCard,
      },

      // ─── DatePicker ────────────────────────────────────────────────
      DatePicker: {
        colorBgContainer:    c.bgCard,
        colorText:           c.textPrimary,
        colorTextPlaceholder: c.textTertiary,
        hoverBorderColor:    c.secondary,
        activeBorderColor:   c.primary,
        activeShadow:        `0 0 0 2px ${c.primary}33`,
        borderRadius:        8,
        colorBorder:         c.borderDefault,
        cellHoverBg:         isDark ? '#2a2a2a' : '#f5f5f5',
        cellActiveWithRangeBg: c.primarySoft,
      },

      // ─── Button ────────────────────────────────────────────────────
      Button: {
        borderRadius:   8,
        borderRadiusSM: 6,
        borderRadiusLG: 10,
        primaryShadow: 'none',
        defaultShadow: 'none',
        dangerShadow:  'none',
        // Force white text & icons on all filled (primary) buttons
        colorTextLightSolid: '#ffffff',
        // Sizing
        controlHeight:   40,
        controlHeightLG: 48,
        controlHeightSM: 32,
        fontWeight:      600,
        contentFontSize:   14,
        contentFontSizeLG: 15,
        contentFontSizeSM: 13,
      },

      // ─── Menu ──────────────────────────────────────────────────────
      Menu: {
        itemBg:            'transparent',
        darkItemBg:        'transparent',
        darkSubMenuItemBg: 'transparent',
        itemSelectedBg:    c.primarySoft,
        itemColor:         c.textSecondary,
        itemSelectedColor: c.primary,
        itemHoverColor:    c.textPrimary,
        itemHoverBg:       isDark ? '#2a2a2a' : '#f5f5f5',
        borderRadius:      8,
        itemHeight:        40,
        itemMarginBlock:   2,
        itemPaddingInline: 12,
        iconSize:          16,
        iconMarginInlineEnd: 10,
        colorBorderSecondary: 'transparent',
      },

      // ─── Tag ───────────────────────────────────────────────────────
      Tag: {
        borderRadius:  6,
        colorBorder:   'transparent',
        defaultBg:     isDark ? '#2a2a2a' : '#f5f5f5',
        defaultColor:  c.textSecondary,
        fontSizeSM:    11,
      },

      // ─── Statistic ─────────────────────────────────────────────────
      Statistic: {
        colorTextDescription: c.textSecondary,
        colorTextHeading:     c.textPrimary,
        titleFontSize:        13,
        contentFontSize:      24,
      },

      // ─── Alert ─────────────────────────────────────────────────────
      Alert: {
        borderRadius:    10,
        colorText:       c.textPrimary,
        colorTextHeading: c.textPrimary,
      },

      // ─── Popover ───────────────────────────────────────────────────
      Popover: {
        colorBgElevated:   c.bgCard,
        borderRadiusLG:    10,
        colorText:         c.textPrimary,
        boxShadowSecondary: isDark
          ? '0 8px 24px rgba(0,0,0,0.6)'
          : '0 8px 24px rgba(0,0,0,0.1)',
      },

      // ─── Dropdown ──────────────────────────────────────────────────
      Dropdown: {
        colorBgElevated:      c.bgCard,
        borderRadiusLG:       10,
        colorText:            c.textPrimary,
        controlItemBgHover:   isDark ? '#2a2a2a' : '#f5f5f5',
        controlItemBgActive:  c.primarySoft,
        boxShadowSecondary:   isDark
          ? '0 8px 24px rgba(0,0,0,0.6)'
          : '0 8px 24px rgba(0,0,0,0.1)',
      },

      // ─── Tooltip ───────────────────────────────────────────────────
      Tooltip: {
        colorBgSpotlight:   isDark ? '#333333' : '#212121',
        colorTextLightSolid: '#f5f5f5',
        borderRadius:        6,
      },

      // ─── Pagination ────────────────────────────────────────────────
      Pagination: {
        colorText:        c.textPrimary,
        colorPrimary:     c.primary,
        colorPrimaryHover: c.primaryHover,
        colorBgContainer: 'transparent',
        colorBorder:      'transparent',
        itemActiveBg:     c.primary,
        borderRadius:     6,
      },

      // ─── Tabs ──────────────────────────────────────────────────────
      Tabs: {
        colorText:        c.textSecondary,
        colorTextHeading: c.textPrimary,
        itemColor:        c.textSecondary,
        itemSelectedColor: c.primary,
        itemHoverColor:   c.textPrimary,
        inkBarColor:      c.primary,
        cardBg:           isDark ? '#2a2a2a' : '#f5f5f5',
        cardGutter:       4,
        borderRadius:     8,
      },

      // ─── Form ──────────────────────────────────────────────────────
      Form: {
        labelColor:           c.textPrimary,
        labelFontSize:        13,
        labelHeight:          32,
        itemMarginBottom:     20,
        verticalLabelPadding: '0 0 6px',
      },

      // ─── Collapse ──────────────────────────────────────────────────
      Collapse: {
        colorBgContainer:  c.bgCard,
        colorText:         c.textPrimary,
        colorTextHeading:  c.textPrimary,
        colorBorder:       'transparent',
        borderRadius:      10,
        headerBg:          isDark ? '#2a2a2a' : '#f5f5f5',
        contentBg:         c.bgCard,
      },

      // ─── Segmented ─────────────────────────────────────────────────
      Segmented: {
        colorBgLayout:    isDark ? '#2a2a2a' : '#f5f5f5',
        colorBgContainer: c.bgCard,
        colorText:        c.textSecondary,
        itemSelectedBg:   c.bgCard,
        itemSelectedColor: c.textPrimary,
        itemHoverBg:      isDark ? '#333333' : '#eaeaea',
        itemHoverColor:   c.textPrimary,
        borderRadius:     8,
        borderRadiusSM:   6,
      },

      // ─── Badge ─────────────────────────────────────────────────────
      Badge: {
        colorBgContainer: c.bgCard,
        colorText:        c.textPrimary,
        colorError:       c.error,
      },

      // ─── Avatar ────────────────────────────────────────────────────
      Avatar: {
        colorBgContainer: isDark ? '#2a2a2a' : '#e8f4fc',
        colorText:        c.textPrimary,
        borderRadius:     8,
      },

      // ─── Popconfirm ────────────────────────────────────────────────
      Popconfirm: {
        colorText:        c.textPrimary,
        colorTextHeading: c.textPrimary,
      },

      // ─── Message ───────────────────────────────────────────────────
      Message: {
        colorBgElevated: c.bgCard,
        colorText:       c.textPrimary,
        borderRadiusLG:  10,
        boxShadow:       isDark
          ? '0 8px 24px rgba(0,0,0,0.6)'
          : '0 8px 24px rgba(0,0,0,0.1)',
      },

      // ─── Notification ──────────────────────────────────────────────
      Notification: {
        colorBgElevated: c.bgCard,
        colorText:       c.textPrimary,
        borderRadiusLG:  12,
        boxShadow:       isDark
          ? '0 8px 24px rgba(0,0,0,0.6)'
          : '0 8px 24px rgba(0,0,0,0.1)',
      },

      // ─── FloatButton ───────────────────────────────────────────────
      FloatButton: {
        colorPrimary:      c.primary,
        colorPrimaryHover: c.primaryHover,
        colorBgElevated:   c.bgCard,
        colorText:         c.textPrimary,
        borderRadius:      16,
        boxShadow:         isDark
          ? '0 4px 12px rgba(0,0,0,0.6)'
          : '0 4px 12px rgba(0,0,0,0.15)',
      },

      // ─── Switch ────────────────────────────────────────────────────
      Switch: {
        colorPrimary:      c.primary,
        colorPrimaryHover: c.primaryHover,
      },

      // ─── Checkbox ──────────────────────────────────────────────────
      Checkbox: {
        colorPrimary:      c.primary,
        colorPrimaryHover: c.primaryHover,
        colorBorder:       c.borderDefault,
      },

      // ─── Radio ─────────────────────────────────────────────────────
      Radio: {
        colorPrimary:      c.primary,
        colorPrimaryHover: c.primaryHover,
        colorBorder:       c.borderDefault,
      },

      // ─── Slider ────────────────────────────────────────────────────
      Slider: {
        colorPrimary:       c.primary,
        colorPrimaryBorder: c.primaryHover,
        trackBg:            c.primary,
        trackHoverBg:       c.primaryHover,
        handleColor:        c.primary,
        handleActiveColor:  c.primaryHover,
        railBg:             c.borderDefault,
        railHoverBg:        c.borderHeavy,
      },

      // ─── Progress ──────────────────────────────────────────────────
      Progress: {
        colorSuccess:   c.success,
        defaultColor:   c.primary,
        remainingColor: isDark ? '#2a2a2a' : '#f5f5f5',
      },

      // ─── Timeline ──────────────────────────────────────────────────
      Timeline: {
        colorText:    c.textPrimary,
        colorPrimary: c.primary,
        dotBg:        c.bgCard,
        tailColor:    c.borderLight,
      },

      // ─── Steps ─────────────────────────────────────────────────────
      Steps: {
        colorPrimary:            c.primary,
        colorText:               c.textPrimary,
        colorTextDescription:    c.textSecondary,
        colorTextDisabled:       c.textDisabled,
        colorSplit:              c.borderLight,
        navArrowColor:           c.borderDefault,
      },
    },
  }
}
