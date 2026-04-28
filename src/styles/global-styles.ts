import { createGlobalStyle } from 'styled-components'
import type { ThemeMode } from '@/context/ThemeModeContext'

/**
 * Global styles — Ant Design overrides + base styles.
 * Uses CSS variables from theme-variables.css.
 * No hardcoded colors. All values reference var(--*).
 */
export const GlobalStyles = createGlobalStyle<{ $mode: ThemeMode }>`
  /* ═══════════════════════════════════════════════════════════════════════
     BASE STYLES
     ═══════════════════════════════════════════════════════════════════════ */
  html, body, #root {
    min-height: 100%;
  }

  html {
    font-size: 16px;
    -webkit-text-size-adjust: 100%;
    scroll-behavior: smooth;
  }

  body {
    margin: 0;
    color: var(--text-primary);
    font-family: var(--font-family);
    background: var(--content-bg);
    transition: background 180ms ease, color 180ms ease;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    overscroll-behavior-y: contain;
  }

  a {
    color: inherit;
  }

  * {
    -webkit-tap-highlight-color: transparent;
  }

  button,
  a,
  [role="button"],
  [role="link"] {
    min-height: var(--touch-target-min);
    min-width: var(--touch-target-min);
  }

  /* On desktop, Ant Design buttons don't need the 44px touch target */
  @media (min-width: 768px) {
    .ant-btn {
      min-height: unset !important;
      min-width: unset !important;
    }
  }

  .scrollable {
    -webkit-overflow-scrolling: touch;
  }

  .ant-layout {
    background: transparent;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     CARDS — Borderless with shadow
     ═══════════════════════════════════════════════════════════════════════ */
  .ant-card {
    border: none !important;
    box-shadow: var(--surface-shadow);
  }

  .ant-card-bordered {
    border: none !important;
  }

  .ant-card-head {
    border-bottom: none !important;
    padding-bottom: 12px;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     MODALS — Clean, borderless
     ═══════════════════════════════════════════════════════════════════════ */
  .ant-modal-content {
    border: none !important;
    box-shadow: var(--surface-shadow);
  }

  .ant-modal-header {
    border-bottom: none !important;
  }

  .ant-modal-footer {
    border-top: none !important;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     DRAWERS — Borderless
     ═══════════════════════════════════════════════════════════════════════ */
  .ant-drawer-header {
    border-bottom: none !important;
  }

  .ant-drawer-footer {
    border-top: none !important;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     DROPDOWNS — Clean elevation
     ═══════════════════════════════════════════════════════════════════════ */
  .ant-dropdown-menu {
    border: none !important;
    box-shadow: var(--surface-shadow);
  }

  .ant-dropdown-menu-item {
    border-radius: 6px !important;
    margin: 2px 4px !important;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     POPOVERS — Borderless
     ═══════════════════════════════════════════════════════════════════════ */
  .ant-popover-inner {
    border: none !important;
    box-shadow: var(--surface-shadow);
  }

  .ant-popover-inner-content {
    padding: 12px 16px;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     TOOLTIPS
     ═══════════════════════════════════════════════════════════════════════ */
  .ant-tooltip-inner {
    border-radius: 6px;
    padding: 6px 12px;
    font-size: 12px;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     INPUTS — Subtle border
     ═══════════════════════════════════════════════════════════════════════ */
  .ant-input,
  .ant-input-affix-wrapper,
  .ant-input-number,
  .ant-input-number-affix-wrapper {
    border: 1px solid var(--border-default) !important;
    transition: all 0.2s ease;
  }

  .ant-input:hover,
  .ant-input-affix-wrapper:hover,
  .ant-input-number:hover,
  .ant-input-number-affix-wrapper:hover {
    border-color: var(--text-secondary) !important;
  }

  .ant-input:focus,
  .ant-input-affix-wrapper:focus-within,
  .ant-input-number:focus-within,
  .ant-input-number-affix-wrapper:focus-within {
    border-color: var(--primary) !important;
    box-shadow: 0 0 0 2px var(--primary-soft) !important;
  }

  /* TextArea */
  .ant-input-textarea {
    border: 1px solid var(--border-default) !important;
  }

  .ant-input-textarea:hover {
    border-color: var(--text-secondary) !important;
  }

  .ant-input-textarea-focused {
    border-color: var(--primary) !important;
    box-shadow: 0 0 0 2px var(--primary-soft) !important;
  }

  /* Select */
  .ant-select-selector {
    border: 1px solid var(--border-default) !important;
  }

  .ant-select:hover .ant-select-selector {
    border-color: var(--text-secondary) !important;
  }

  .ant-select-focused .ant-select-selector {
    border-color: var(--primary) !important;
    box-shadow: 0 0 0 2px var(--primary-soft) !important;
  }

  /* DatePicker */
  .ant-picker {
    border: 1px solid var(--border-default) !important;
  }

  .ant-picker:hover {
    border-color: var(--text-secondary) !important;
  }

  .ant-picker-focused {
    border-color: var(--primary) !important;
    box-shadow: 0 0 0 2px var(--primary-soft) !important;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     BUTTONS — Ant Design defaults, no overrides
     ═══════════════════════════════════════════════════════════════════════ */
  .ant-btn {
    box-shadow: none !important;
    transition: all 0.2s ease;
  }

  /* Delete / danger buttons — red icon, no border */
  .ant-btn-dangerous,
  .ant-btn-default.ant-btn-dangerous {
    border: none !important;
    box-shadow: none !important;
  }

  .ant-btn-dangerous .anticon,
  .ant-btn-default.ant-btn-dangerous .anticon {
    color: var(--error) !important;
  }

  .ant-btn-dangerous:hover,
  .ant-btn-default.ant-btn-dangerous:hover {
    border: none !important;
    background: var(--error-light) !important;
  }

  /* Button groups */
  .ant-btn-group .ant-btn {
    border-right: 1px solid var(--border-default) !important;
  }

  .ant-btn-group .ant-btn:last-child {
    border-right: none !important;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     DESKTOP — All buttons small size
     ═══════════════════════════════════════════════════════════════════════ */
  @media (min-width: 768px) {
    .ant-btn:not(.ant-btn-lg):not(.ant-btn-icon-only.ant-btn-lg) {
      height: 32px !important;
      padding: 0 12px !important;
      font-size: 13px !important;
      line-height: 30px !important;
    }

    .ant-btn .anticon {
      font-size: 13px !important;
    }

    .ant-btn-icon-only:not(.ant-btn-lg) {
      width: 32px !important;
      height: 32px !important;
      padding: 0 !important;
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     TABLES — Borderless with row separation
     ═══════════════════════════════════════════════════════════════════════ */
  .ant-table {
    background: transparent !important;
  }

  .ant-table-wrapper {
    border: none !important;
    border-radius: 12px;
    overflow: hidden;
  }

  .ant-table-container {
    border: none !important;
  }

  .ant-table-thead > tr > th {
    background: var(--bg-elevated) !important;
    color: var(--text-primary) !important;
    border: none !important;
    border-bottom: 2px solid var(--border-light) !important;
    font-weight: 600;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .ant-table-tbody > tr > td {
    border: none !important;
    border-bottom: 1px solid var(--border-light) !important;
    color: var(--text-primary) !important;
  }

  .ant-table-tbody > tr:last-child > td {
    border-bottom: none !important;
  }

  .ant-table-tbody > tr:hover > td {
    background: var(--menu-hover-bg) !important;
  }

  .ant-table-tbody > tr.ant-table-row-selected > td {
    background: var(--soft-accent) !important;
  }

  .ant-table-pagination {
    margin: 16px 0 !important;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     TYPOGRAPHY — Consistent colors
     ═══════════════════════════════════════════════════════════════════════ */
  .ant-typography,
  h1, h2, h3, h4, h5, h6,
  p, span, div {
    color: var(--text-primary);
  }

  .ant-typography-secondary {
    color: var(--text-secondary) !important;
    opacity: 1 !important;
  }

  .ant-typography-disabled {
    color: var(--text-disabled) !important;
    opacity: 0.6 !important;
  }

  /* Links */
  a.ant-typography,
  .ant-typography a {
    color: var(--primary) !important;
  }

  a.ant-typography:hover,
  .ant-typography a:hover {
    color: var(--primary-hover) !important;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     TAGS — Borderless with background
     ═══════════════════════════════════════════════════════════════════════ */
  .ant-tag {
    border: none !important;
    background: var(--menu-hover-bg);
    color: var(--text-primary);
    border-radius: 6px;
    padding: 2px 10px;
    font-size: 11px;
    font-weight: 500;
  }

  .ant-tag-blue {
    background: var(--blue-50) !important;
    color: var(--blue-700) !important;
  }

  .ant-tag-green {
    background: var(--success-light) !important;
    color: var(--success) !important;
  }

  .ant-tag-red {
    background: var(--error-light) !important;
    color: var(--error) !important;
  }

  .ant-tag-orange,
  .ant-tag-gold {
    background: var(--warning-light) !important;
    color: var(--warning) !important;
  }

  .ant-tag-cyan {
    background: var(--info-light) !important;
    color: var(--info) !important;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     MENU / NAVIGATION — Clean selection states
     ═══════════════════════════════════════════════════════════════════════ */
  .ant-menu {
    background: transparent !important;
    border: none !important;
  }

  .ant-menu-item,
  .ant-menu-submenu-title {
    border-radius: 8px !important;
    margin: 2px 0 !important;
    color: var(--text-secondary) !important;
  }

  .ant-menu-item-selected {
    background: var(--soft-accent) !important;
    color: var(--primary) !important;
    font-weight: 600 !important;
  }

  .ant-menu-item:hover,
  .ant-menu-submenu-title:hover {
    background: var(--menu-hover-bg) !important;
    color: var(--text-primary) !important;
  }

  .ant-menu-item-active {
    background: var(--menu-hover-bg) !important;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     PAGINATION — Clean, borderless
     ═══════════════════════════════════════════════════════════════════════ */
  .ant-pagination-item {
    background: transparent !important;
    border: none !important;
    border-radius: 6px;
  }

  .ant-pagination-item a {
    color: var(--text-secondary) !important;
  }

  .ant-pagination-item:hover {
    background: var(--menu-hover-bg) !important;
  }

  .ant-pagination-item:hover a {
    color: var(--text-primary) !important;
  }

  .ant-pagination-item-active {
    background: var(--primary) !important;
    border: none !important;
  }

  .ant-pagination-item-active a {
    color: var(--text-inverse) !important;
  }

  .ant-pagination-prev,
  .ant-pagination-next {
    border: none !important;
  }

  .ant-pagination-prev button,
  .ant-pagination-next button {
    background: transparent !important;
    border: none !important;
    color: var(--text-secondary) !important;
  }

  .ant-pagination-prev:hover button,
  .ant-pagination-next:hover button {
    background: var(--menu-hover-bg) !important;
    color: var(--text-primary) !important;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     TABS — Clean design
     ═══════════════════════════════════════════════════════════════════════ */
  .ant-tabs-nav {
    margin-bottom: 16px !important;
  }

  .ant-tabs-nav::before {
    border-bottom: 1px solid var(--border-light) !important;
  }

  .ant-tabs-tab {
    color: var(--text-secondary) !important;
    border: none !important;
  }

  .ant-tabs-tab:hover {
    color: var(--text-primary) !important;
  }

  .ant-tabs-tab-active {
    color: var(--primary) !important;
  }

  .ant-tabs-tab-active .ant-tabs-tab-btn {
    color: var(--primary) !important;
    font-weight: 600 !important;
  }

  .ant-tabs-ink-bar {
    background: var(--primary) !important;
    height: 3px !important;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     COLLAPSE / ACCORDION — Borderless
     ═══════════════════════════════════════════════════════════════════════ */
  .ant-collapse {
    background: transparent !important;
    border: none !important;
  }

  .ant-collapse-item {
    border: none !important;
    margin-bottom: 8px;
    border-radius: 10px;
    overflow: hidden;
  }

  .ant-collapse-header {
    background: var(--menu-hover-bg) !important;
    border: none !important;
    color: var(--text-primary) !important;
    font-weight: 500;
  }

  .ant-collapse-content {
    background: var(--card-bg) !important;
    border: none !important;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     FORM — Clean labels and inputs
     ═══════════════════════════════════════════════════════════════════════ */
  .ant-form-item-label > label {
    color: var(--text-primary) !important;
    font-weight: 500;
    font-size: 13px;
  }

  .ant-form-item-label > label.ant-form-item-required::before {
    color: var(--error) !important;
  }

  .ant-form-item-explain-error {
    color: var(--error) !important;
    font-size: 12px;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     MESSAGES & NOTIFICATIONS — Clean elevation
     ═══════════════════════════════════════════════════════════════════════ */
  .ant-message-notice-content {
    background: var(--card-bg) !important;
    box-shadow: var(--surface-shadow);
    border: none !important;
    border-radius: 10px;
    padding: 12px 16px;
  }

  .ant-notification-notice {
    background: var(--card-bg) !important;
    box-shadow: var(--surface-shadow);
    border: none !important;
    border-radius: 12px;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     SEGMENTED CONTROL — Clean design
     ═══════════════════════════════════════════════════════════════════════ */
  .ant-segmented {
    background: var(--menu-hover-bg) !important;
    border-radius: 8px;
    padding: 2px;
  }

  .ant-segmented-item {
    color: var(--text-secondary) !important;
    border-radius: 6px;
  }

  .ant-segmented-item-selected {
    background: var(--card-bg) !important;
    color: var(--text-primary) !important;
    font-weight: 500;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }

  /* ═══════════════════════════════════════════════════════════════════════
     BADGE — Clean design
     ═══════════════════════════════════════════════════════════════════════ */
  .ant-badge-count {
    background: var(--error);
    color: var(--text-inverse);
    box-shadow: none;
    border: none;
  }

  .ant-badge-dot {
    box-shadow: none;
    border: none;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     AVATAR — Consistent styling
     ═══════════════════════════════════════════════════════════════════════ */
  .ant-avatar {
    background: var(--menu-hover-bg);
    color: var(--text-primary);
    border: none;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     DIVIDER — Subtle separation
     ═══════════════════════════════════════════════════════════════════════ */
  .ant-divider {
    border-color: var(--border-light) !important;
  }

  .ant-divider-horizontal.ant-divider-with-text {
    color: var(--text-secondary) !important;
    font-size: 13px;
    font-weight: 500;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     EMPTY STATE — Consistent colors
     ═══════════════════════════════════════════════════════════════════════ */
  .ant-empty-description {
    color: var(--text-disabled) !important;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     SPIN / LOADING — Consistent colors
     ═══════════════════════════════════════════════════════════════════════ */
  .ant-spin-dot-item {
    background-color: var(--primary) !important;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     SWITCH — Clean toggle
     ═══════════════════════════════════════════════════════════════════════ */
  .ant-switch {
    background: var(--border-default) !important;
  }

  .ant-switch-checked {
    background: var(--primary) !important;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     CHECKBOX & RADIO — Consistent styling
     ═══════════════════════════════════════════════════════════════════════ */
  .ant-checkbox-wrapper,
  .ant-radio-wrapper {
    color: var(--text-primary) !important;
  }

  .ant-checkbox-inner,
  .ant-radio-inner {
    border-color: var(--border-default) !important;
  }

  .ant-checkbox-checked .ant-checkbox-inner,
  .ant-radio-checked .ant-radio-inner {
    background-color: var(--primary) !important;
    border-color: var(--primary) !important;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     SLIDER — Consistent colors
     ═══════════════════════════════════════════════════════════════════════ */
  .ant-slider-rail {
    background-color: var(--border-default) !important;
  }

  .ant-slider-track {
    background-color: var(--primary) !important;
  }

  .ant-slider-handle::after {
    background-color: var(--primary) !important;
    box-shadow: 0 0 0 2px var(--primary-soft) !important;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     PROGRESS — Consistent colors
     ═══════════════════════════════════════════════════════════════════════ */
  .ant-progress-bg {
    background-color: var(--primary) !important;
  }

  .ant-progress-text {
    color: var(--text-primary) !important;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     MOBILE RESPONSIVE
     ═══════════════════════════════════════════════════════════════════════ */
  @media (max-width: 767px) {
    .ant-table-wrapper {
      border-radius: 6px;
    }

    .ant-table-tbody > tr > td,
    .ant-table-thead > tr > th {
      padding: 7px 8px !important;
      font-size: 12px !important;
    }

    .ant-table-thead > tr > th {
      white-space: nowrap !important;
      font-size: 11px !important;
    }

    .ant-table-content {
      overflow-x: auto !important;
      -webkit-overflow-scrolling: touch;
    }

    .ant-card-body {
      padding: 12px !important;
    }

    .ant-modal {
      max-width: calc(100vw - 16px) !important;
      margin: 8px auto !important;
    }

    .ant-modal-content {
      border-radius: 10px !important;
    }

    .ant-modal-body {
      padding: 12px 14px !important;
    }

    .ant-modal-header {
      padding: 12px 14px 8px !important;
    }

    .ant-modal-footer {
      padding: 8px 14px !important;
    }

    .ant-space-wrap {
      width: 100%;
    }

    .ant-descriptions-item-label,
    .ant-descriptions-item-content {
      padding: 6px 8px !important;
      font-size: 12px !important;
    }

    .ant-tag {
      margin-bottom: 2px;
      font-size: 11px !important;
      padding: 0 5px !important;
    }

    .ant-pagination {
      font-size: 12px !important;
    }

    .ant-pagination-item,
    .ant-pagination-prev,
    .ant-pagination-next {
      min-width: 28px !important;
      height: 28px !important;
      line-height: 26px !important;
    }

    .ant-form-item {
      margin-bottom: 12px !important;
    }

    .ant-form-item .ant-select,
    .ant-form-item .ant-picker,
    .ant-form-item .ant-input-number {
      width: 100% !important;
    }

    .ant-alert {
      padding: 8px 10px !important;
      font-size: 12px !important;
    }

    .ant-typography h3,
    h3.ant-typography {
      font-size: 16px !important;
    }

    .ant-typography h4,
    h4.ant-typography {
      font-size: 14px !important;
    }

    .ant-typography h5,
    h5.ant-typography {
      font-size: 13px !important;
    }
  }

  @media (max-width: 375px) {
    .ant-table-tbody > tr > td,
    .ant-table-thead > tr > th {
      padding: 5px 6px !important;
      font-size: 11px !important;
    }

    .ant-btn {
      font-size: 12px !important;
      padding: 0 8px !important;
    }

    .ant-tag {
      font-size: 10px !important;
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     FORM INPUTS — Consistent text colors
     ═══════════════════════════════════════════════════════════════════════ */
  .ant-upload,
  .ant-select-selector,
  .ant-picker,
  .ant-input,
  .ant-input-number,
  .ant-input-affix-wrapper,
  .ant-input-number-input-wrap input,
  .ant-input-outlined,
  .ant-input-number-outlined {
    color: var(--text-primary) !important;
  }

  .ant-empty-description,
  .ant-form-item-explain-error {
    color: var(--text-disabled) !important;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     STATISTIC
     ═══════════════════════════════════════════════════════════════════════ */
  .ant-statistic-title {
    color: var(--text-secondary) !important;
  }

  .ant-statistic-content {
    color: var(--text-primary) !important;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     MENU ITEMS
     ═══════════════════════════════════════════════════════════════════════ */
  .ant-menu-item,
  .ant-menu-submenu-title {
    border-radius: 7px !important;
    margin-inline: 0 !important;
    width: 100% !important;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     AUTH SHELL
     ═══════════════════════════════════════════════════════════════════════ */
  .auth-shell .ant-form {
    width: 100%;
  }

  .auth-shell .ant-form-item {
    margin-bottom: 16px;
  }

  .auth-shell .ant-form-item-label > label {
    color: var(--text-primary) !important;
    font-weight: 600;
  }

  .auth-shell .ant-input,
  .auth-shell .ant-input-password,
  .auth-shell .ant-input-affix-wrapper {
    min-height: 40px;
    color: var(--text-primary) !important;
  }

  .auth-shell .ant-input::placeholder,
  .auth-shell .ant-input-password input::placeholder {
    color: var(--text-disabled) !important;
  }

  .auth-shell .ant-input-password-icon,
  .auth-shell .anticon {
    color: var(--text-disabled);
  }

  .auth-shell .ant-btn-primary {
    min-height: 40px;
    font-weight: 600;
  }

  .auth-shell a {
    color: var(--primary);
    text-decoration: none;
    font-weight: 600;
  }

  .auth-shell a:hover {
    opacity: 0.85;
  }
`
