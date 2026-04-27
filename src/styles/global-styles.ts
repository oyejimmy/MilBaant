import { createGlobalStyle } from 'styled-components'
import type { ThemeMode } from '@/context/ThemeModeContext'
import { palette } from '@/styles/theme'

export const GlobalStyles = createGlobalStyle<{ $mode: ThemeMode }>`
  :root {
    --periwinkle-blue: ${palette.periwinkle};

    /* Text */
    --text-strong: ${({ $mode }) => ($mode === 'dark' ? '#f0f2f8' : '#1e2330')};
    --text-base:   ${({ $mode }) => ($mode === 'dark' ? '#b8bdd0' : '#3d4455')};
    --text-muted:  ${({ $mode }) => ($mode === 'dark' ? '#7a7f96' : '#7a8099')};

    /* Page background */
    --content-bg: ${({ $mode }) => ($mode === 'dark' ? '#141720' : '#f0f2f5')};

    /* Surface (same as card-bg, used by stat cards) */
    --surface: ${({ $mode }) => ($mode === 'dark' ? '#1c2030' : '#ffffff')};

    /* Icon tint backgrounds */
    --icon-bg-blue:   ${({ $mode }) => ($mode === 'dark' ? 'rgba(22,119,255,0.15)' : '#eff6ff')};
    --icon-bg-purple: ${({ $mode }) => ($mode === 'dark' ? 'rgba(124,58,237,0.15)' : '#f5f3ff')};
    --icon-bg-green:  ${({ $mode }) => ($mode === 'dark' ? 'rgba(5,150,105,0.15)'  : '#ecfdf5')};
    --icon-bg-amber:  ${({ $mode }) => ($mode === 'dark' ? 'rgba(217,119,6,0.15)'  : '#fef3c7')};
    --icon-bg-sky:    ${({ $mode }) => ($mode === 'dark' ? 'rgba(14,165,233,0.15)' : '#f0f9ff')};

    /* Cards / panels */
    --card-bg:     ${({ $mode }) => ($mode === 'dark' ? '#1c2030' : '#ffffff')};
    --card-border: ${({ $mode }) => ($mode === 'dark' ? '#2a2f45' : '#e2e5ec')};

    /* Sidebar */
    --sidebar-bg:     ${({ $mode }) => ($mode === 'dark' ? '#161a27' : '#ffffff')};
    --sidebar-border: ${({ $mode }) => ($mode === 'dark' ? '#252a3d' : '#e2e5ec')};

    /* Navbar */
    --navbar-bg:     ${({ $mode }) => ($mode === 'dark' ? '#161a27' : '#ffffff')};
    --navbar-border: ${({ $mode }) => ($mode === 'dark' ? '#252a3d' : '#e2e5ec')};

    /* Auth shell surface */
    --app-bg:         ${({ $mode }) => ($mode === 'dark' ? '#141720' : '#f0f2f5')};
    --surface-bg:     ${({ $mode }) => ($mode === 'dark' ? '#1c2030' : '#ffffff')};
    --surface-border: ${({ $mode }) => ($mode === 'dark' ? '#2a2f45' : '#e2e5ec')};
    --surface-shadow: ${({ $mode }) =>
      $mode === 'dark'
        ? '0 4px 24px rgba(0,0,0,0.4)'
        : '0 4px 24px rgba(0,0,0,0.08)'};

    /* Interactive */
    --menu-hover-bg: ${({ $mode }) =>
      $mode === 'dark' ? 'rgba(144, 159, 250, 0.08)' : 'rgba(144, 159, 250, 0.07)'};
    --soft-accent:   ${({ $mode }) =>
      $mode === 'dark' ? 'rgba(144, 159, 250, 0.07)' : 'rgba(144, 159, 250, 0.06)'};
  }

  html, body, #root {
    min-height: 100%;
  }

  body {
    margin: 0;
    color: var(--text-strong);
    font-family: "Plus Jakarta Sans", sans-serif;
    background: var(--content-bg);
    transition: background 180ms ease, color 180ms ease;
  }

  a { color: inherit; }

  .ant-layout { background: transparent; }

  /* Tables */
  .ant-table-wrapper {
    border-radius: 7px;
    overflow: hidden;
    border: 1px solid var(--card-border);
  }

  .ant-table-thead > tr > th {
    color: var(--text-strong) !important;
    font-weight: 600;
    white-space: nowrap;
  }

  .ant-table-tbody > tr.ant-table-row:hover > td {
    background: var(--soft-accent) !important;
  }

  /* Mobile: tighter padding */
  @media (max-width: 767px) {
    .ant-table-tbody > tr > td,
    .ant-table-thead > tr > th {
      padding: 8px 10px !important;
    }

    .ant-card-body {
      padding: 14px !important;
    }

    .ant-modal {
      max-width: calc(100vw - 24px) !important;
      margin: 12px auto !important;
    }

    .ant-modal-content {
      border-radius: 7px !important;
    }

    /* Page header actions wrap nicely */
    .ant-space-wrap {
      width: 100%;
    }

    /* Prevent table header text overflow */
    .ant-table-thead > tr > th {
      white-space: normal !important;
      word-break: break-word;
    }
  }

  /* Form inputs */
  .ant-upload,
  .ant-select-selector,
  .ant-picker,
  .ant-input,
  .ant-input-number,
  .ant-input-affix-wrapper,
  .ant-input-number-input-wrap input,
  .ant-input-outlined,
  .ant-input-number-outlined {
    color: var(--text-strong) !important;
  }

  .ant-empty-description,
  .ant-form-item-explain-error {
    color: var(--text-muted) !important;
  }

  /* Statistic / misc */
  .ant-statistic-title { color: var(--text-muted) !important; }
  .ant-statistic-content { color: var(--text-strong) !important; }

  /* Menu items */
  .ant-menu-item,
  .ant-menu-submenu-title {
    border-radius: 7px !important;
    margin-inline: 0 !important;
    width: 100% !important;
  }

  /* Auth shell */
  .auth-shell .ant-form { width: 100%; }
  .auth-shell .ant-form-item { margin-bottom: 16px; }
  .auth-shell .ant-form-item-label > label {
    color: var(--text-strong) !important;
    font-weight: 600;
  }
  .auth-shell .ant-input,
  .auth-shell .ant-input-password,
  .auth-shell .ant-input-affix-wrapper {
    min-height: 40px;
    color: var(--text-strong) !important;
  }
  .auth-shell .ant-input::placeholder,
  .auth-shell .ant-input-password input::placeholder {
    color: var(--text-muted) !important;
  }
  .auth-shell .ant-input-password-icon,
  .auth-shell .anticon { color: var(--text-muted); }
  .auth-shell .ant-btn-primary { min-height: 40px; font-weight: 600; }
  .auth-shell a {
    color: var(--periwinkle-blue);
    text-decoration: none;
    font-weight: 600;
  }
  .auth-shell a:hover { opacity: 0.85; }
`
