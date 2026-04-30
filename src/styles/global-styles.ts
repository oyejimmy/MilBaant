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
    border: none  ;
    box-shadow: var(--shadow-sm)  ;
  }
  .ant-card-head {
    border-bottom: none  ;
  }

  .ant-modal-content {
    border: none  ;
    box-shadow: var(--shadow-xl)  ;
  }
  .ant-modal-header,
  .ant-modal-footer {
    border: none  ;
  }

  .ant-drawer-header,
  .ant-drawer-footer {
    border: none  ;
  }

  .ant-dropdown-menu {
    border: none  ;
    box-shadow: var(--shadow-lg)  ;
  }
  .ant-dropdown-menu-item {
    border-radius: 6px  ;
    margin: 2px 4px  ;
  }

  .ant-popover-inner {
    border: none  ;
    box-shadow: var(--shadow-lg)  ;
  }

  .ant-table {
    background: transparent  ;
  }
  .ant-table-container,
  .ant-table-content {
    border: none  ;
  }
  .ant-table-thead > tr > th {
    border-bottom: 1px solid var(--border-light)  ;
  }

  .ant-layout {
    background: transparent  ;
  }

  /* Width fix — not expressible as a token */
  .ant-menu-item {
    width: 100%  ;
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
    border-radius: 8px  ;
  }

  /* ── Mobile touch targets ─────────────────────────────────────────────── */
  /* Only apply min-height to non-small, non-icon buttons to avoid breaking table actions */

  @media (max-width: 767px) {
    .ant-btn:not(.ant-btn-sm):not(.ant-btn-icon-only) {
      min-height: 40px;
    }
  }

  @media (min-width: 768px) {
    .ant-btn {
      min-height: unset;
    }
  }
`
