import { createGlobalStyle } from 'styled-components'
import type { ThemeMode } from '@/context/ThemeModeContext'

interface GlobalStylesProps {
  $mode: ThemeMode
}

/**
 * Global styles — structural overrides only.
 *
 * All Ant Design component colors, borders, shadows, and typography are
 * handled by the design tokens in theme.ts via ConfigProvider.
 *
 * This file contains only:
 *  1. Base layout (html/body/root)
 *  2. Structural Ant Design overrides that tokens cannot express
 *     (border removal, box-shadow on containers, layout fixes)
 *  3. Auth shell scoped rules
 *  4. Mobile touch targets
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const GlobalStyles = createGlobalStyle<GlobalStylesProps>`
  /* ── Base layout ──────────────────────────────────────────────────────── */

  html, body, #root {
    min-height: 100%;
  }

  body {
    margin: 0;
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    overscroll-behavior-y: none;
    background: var(--app-bg);
    color: var(--text-primary);
    transition: background 0.2s ease, color 0.2s ease;
  }

  a {
    color: inherit;
  }

  * {
    -webkit-tap-highlight-color: transparent;
  }

  /* ── Ant Design structural overrides ──────────────────────────────────── */
  /* These control layout/shape, not color — tokens handle color.           */

  .ant-card {
    border: none !important;
    box-shadow: var(--shadow-sm) !important;
  }
  .ant-card-head {
    border-bottom: none !important;
  }

  .ant-modal-content {
    border: none !important;
    box-shadow: var(--shadow-xl) !important;
  }
  .ant-modal-header,
  .ant-modal-footer {
    border: none !important;
  }

  .ant-drawer-header,
  .ant-drawer-footer {
    border: none !important;
  }

  .ant-dropdown-menu {
    border: none !important;
    box-shadow: var(--shadow-lg) !important;
  }
  .ant-dropdown-menu-item {
    border-radius: 6px !important;
    margin: 2px 4px !important;
  }

  .ant-popover-inner {
    border: none !important;
    box-shadow: var(--shadow-lg) !important;
  }

  .ant-table {
    background: transparent !important;
  }
  .ant-table-container,
  .ant-table-content {
    border: none !important;
  }
  .ant-table-thead > tr > th {
    border-bottom: 1px solid var(--border-light) !important;
  }

  .ant-layout {
    background: transparent !important;
  }

  /* Width fix — not expressible as a token */
  .ant-menu-item {
    width: 100% !important;
  }

  .scrollable {
    -webkit-overflow-scrolling: touch;
  }

  /* ── Auth shell scoped rules ───────────────────────────────────────────── */
  /* Scoped to auth pages — do not remove */

  .auth-shell .ant-input,
  .auth-shell .ant-input-affix-wrapper,
  .auth-shell .ant-select-selector,
  .auth-shell .ant-picker {
    border-radius: 8px !important;
  }

  /* ── Mobile touch targets ─────────────────────────────────────────────── */

  @media (max-width: 767px) {
    button,
    a,
    [role="button"],
    .ant-btn {
      min-height: 44px;
    }
  }

  @media (min-width: 768px) {
    .ant-btn {
      min-height: 32px;
    }
  }
`
