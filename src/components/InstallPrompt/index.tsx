/**
 * InstallPrompt — shows on every page load/refresh if the PWA is not installed
 * and the user hasn't permanently dismissed it.
 *
 * Chrome/Edge/Android: uses the native `beforeinstallprompt` event.
 * iOS Safari: shows manual "Add to Home Screen" instructions.
 *
 * Dismissed state: snooze 3 days or permanent.
 */
import { useEffect, useState } from 'react'
import { Button } from 'antd'
import {
  CloseOutlined,
  DownloadOutlined,
  ShareAltOutlined,
  MobileOutlined,
  ThunderboltOutlined,
  WifiOutlined,
} from '@ant-design/icons'
import styled, { keyframes } from 'styled-components'

// ── Types ─────────────────────────────────────────────────────────────────────

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// ── Animations ────────────────────────────────────────────────────────────────

const slideUp = keyframes`
  from { transform: translateY(110%); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
`

const slideDown = keyframes`
  from { transform: translateY(0);    opacity: 1; }
  to   { transform: translateY(110%); opacity: 0; }
`

const popIn = keyframes`
  0%   { transform: scale(0.8);  opacity: 0; }
  65%  { transform: scale(1.05); }
  100% { transform: scale(1);    opacity: 1; }
`

const shimmerBtn = keyframes`
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
`

// ── Styled ────────────────────────────────────────────────────────────────────

const Banner = styled.div<{ $hiding: boolean }>`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  padding: 18px 16px calc(18px + env(safe-area-inset-bottom, 0px));
  background: var(--card-bg);
  border-top: 1px solid var(--card-border);
  box-shadow: 0 -8px 32px rgba(0,0,0,0.14);
  animation: ${({ $hiding }) => ($hiding ? slideDown : slideUp)} 0.38s cubic-bezier(0.22,1,0.36,1) forwards;

  @media (min-width: 600px) {
    bottom: 24px;
    left: 50%;
    right: auto;
    transform: translateX(-50%);
    width: 400px;
    border-radius: 20px;
    border: 1px solid var(--card-border);
    box-shadow:
      0 12px 40px rgba(0,0,0,0.16),
      0 1px 0 rgba(255,255,255,0.8) inset;
    padding: 20px 20px 20px;
  }
`

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 14px;
`

/* Skeuomorphic app icon */
const AppIconWrap = styled.div`
  position: relative;
  flex-shrink: 0;
`

const AppIcon = styled.div`
  width: 68px;
  height: 68px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  font-weight: 800;
  color: #fff;
  font-family: 'Plus Jakarta Sans', sans-serif;
  animation: ${popIn} 0.5s cubic-bezier(0.22,1,0.36,1) 0.15s both;

  /* Skeuomorphic raised icon */
  background: linear-gradient(145deg, #2d7aff 0%, #1260e8 50%, #0840b8 100%);
  box-shadow:
    0 1px 0 rgba(255,255,255,0.3) inset,
    0 -1px 0 rgba(0,0,0,0.25) inset,
    0 6px 18px rgba(18,96,232,0.45),
    0 2px 6px rgba(0,0,0,0.2);
  border: 1px solid rgba(255,255,255,0.15);

  @media (max-width: 599px) {
    width: 60px;
    height: 60px;
    font-size: 26px;
    border-radius: 15px;
  }
`

const OnlineDot = styled.div`
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #52c41a;
  border: 2.5px solid var(--card-bg);
  box-shadow: 0 1px 4px rgba(82,196,26,0.4);
`

const TextBlock = styled.div`
  flex: 1;
  min-width: 0;
  padding-right: 28px;
`

const AppName = styled.div`
  font-size: 15.5px;
  font-weight: 700;
  color: var(--text-strong);
  margin-bottom: 3px;
  font-family: 'Plus Jakarta Sans', sans-serif;
`

const AppDesc = styled.div`
  font-size: 12.5px;
  color: var(--text-muted);
  line-height: 1.5;
`

const DismissBtn = styled.button`
  position: absolute;
  top: 12px;
  right: 12px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--bg-elevated);
  border: 1px solid var(--border-light);
  cursor: pointer;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, color 0.15s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);

  &:hover {
    background: var(--border-default);
    color: var(--text-primary);
  }
`

/* Perk chips */
const Perks = styled.div`
  display: flex;
  gap: 7px;
  margin-bottom: 14px;
  flex-wrap: wrap;
`

const Perk = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 11.5px;
  font-weight: 600;
  color: var(--primary);
  background: var(--primary-soft);
  border: 1px solid rgba(64,150,255,0.2);
  box-shadow: 0 1px 3px rgba(64,150,255,0.1);

  .anticon { font-size: 12px; }
`

/* Skeuomorphic install button */
const InstallBtn = styled(Button)`
  && {
    height: 48px;
    font-size: 14.5px;
    font-weight: 700;
    border-radius: 12px;
    border: none;
    background: linear-gradient(90deg, #1260e8, #4096ff, #69b1ff, #1260e8);
    background-size: 200% auto;
    animation: ${shimmerBtn} 3s linear infinite;
    box-shadow:
      0 1px 0 rgba(255,255,255,0.25) inset,
      0 -1px 0 rgba(0,0,0,0.2) inset,
      0 4px 14px rgba(18,96,232,0.4);
    transition: box-shadow 0.18s, transform 0.12s;

    &:hover {
      box-shadow:
        0 1px 0 rgba(255,255,255,0.3) inset,
        0 6px 20px rgba(18,96,232,0.5) !important;
      transform: translateY(-1px);
    }

    &:active {
      transform: translateY(1px);
      box-shadow: 0 2px 8px rgba(18,96,232,0.3) !important;
    }
  }
`

const Actions = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`

/* iOS steps */
const IOSSteps = styled.div`
  background: var(--bg-elevated);
  border-radius: 12px;
  padding: 12px 14px;
  margin-bottom: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  border: 1px solid var(--border-light);
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.05);
`

const IOSStep = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: var(--text-primary);
  line-height: 1.4;
`

const StepNum = styled.span`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(145deg, #2d7aff, #1260e8);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(18,96,232,0.35);
`

const DontShowLink = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-size: 11.5px;
  color: var(--text-muted);
  padding: 8px 0 0;
  display: block;
  width: 100%;
  text-align: center;
  transition: color 0.15s;

  &:hover { color: var(--text-secondary); }
`

// ── Helpers ───────────────────────────────────────────────────────────────────

const DISMISSED_KEY       = 'milbaant-pwa-dismissed'
const DISMISSED_UNTIL_KEY = 'milbaant-pwa-dismissed-until'

function isDismissed(): boolean {
  const until = localStorage.getItem(DISMISSED_UNTIL_KEY)
  if (until && Date.now() < Number(until)) return true
  return localStorage.getItem(DISMISSED_KEY) === 'true'
}

function dismiss(permanent = false) {
  if (permanent) {
    localStorage.setItem(DISMISSED_KEY, 'true')
  } else {
    localStorage.setItem(
      DISMISSED_UNTIL_KEY,
      String(Date.now() + 3 * 24 * 60 * 60 * 1000),
    )
  }
}

function isIOS(): boolean {
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) &&
    !(window as Window & { MSStream?: unknown }).MSStream
  )
}

function isInStandaloneMode(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showIOS, setShowIOS]   = useState(false)
  const [hiding, setHiding]     = useState(false)
  const [visible, setVisible]   = useState(false)

  useEffect(() => {
    // Already installed or permanently dismissed → skip
    if (isInStandaloneMode() || isDismissed()) return

    if (isIOS()) {
      // Show iOS instructions on every page load (respects snooze)
      const t = setTimeout(() => setShowIOS(true), 1800)
      return () => clearTimeout(t)
    }

    // Chrome/Edge/Android: capture the native prompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  useEffect(() => {
    if (deferredPrompt || showIOS) {
      const t = setTimeout(() => setVisible(true), 700)
      return () => clearTimeout(t)
    }
  }, [deferredPrompt, showIOS])

  function handleInstall() {
    if (!deferredPrompt) return
    void deferredPrompt.prompt()
    void deferredPrompt.userChoice.then((choice) => {
      if (choice.outcome === 'accepted') dismiss(true)
      setDeferredPrompt(null)
      handleClose(true)
    })
  }

  function handleClose(permanent = false) {
    setHiding(true)
    dismiss(permanent)
    setTimeout(() => {
      setVisible(false)
      setShowIOS(false)
      setHiding(false)
    }, 380)
  }

  if (!visible) return null

  // ── iOS ───────────────────────────────────────────────────────────────────
  if (showIOS) {
    return (
      <Banner $hiding={hiding} role="dialog" aria-label="Install MilBaant">
        <DismissBtn onClick={() => handleClose()} aria-label="Dismiss">
          <CloseOutlined style={{ fontSize: 12 }} />
        </DismissBtn>

        <Header>
          <AppIconWrap>
            <AppIcon>M</AppIcon>
            <OnlineDot />
          </AppIconWrap>
          <TextBlock>
            <AppName>Install MilBaant</AppName>
            <AppDesc>Add to your home screen for the best experience — works offline too.</AppDesc>
          </TextBlock>
        </Header>

        <IOSSteps>
          <IOSStep>
            <StepNum>1</StepNum>
            <span>
              Tap the{' '}
              <ShareAltOutlined style={{ color: 'var(--primary)', fontSize: 14 }} />{' '}
              <strong>Share</strong> button at the bottom of Safari
            </span>
          </IOSStep>
          <IOSStep>
            <StepNum>2</StepNum>
            <span>Scroll down and tap <strong>"Add to Home Screen"</strong></span>
          </IOSStep>
          <IOSStep>
            <StepNum>3</StepNum>
            <span>Tap <strong>"Add"</strong> to install</span>
          </IOSStep>
        </IOSSteps>

        <Actions>
          <Button
            block
            onClick={() => handleClose(true)}
            style={{ height: 44, borderRadius: 12, fontWeight: 600 }}
          >
            Don't show again
          </Button>
        </Actions>
      </Banner>
    )
  }

  // ── Chrome / Android ──────────────────────────────────────────────────────
  return (
    <Banner $hiding={hiding} role="dialog" aria-label="Install MilBaant">
      <DismissBtn onClick={() => handleClose()} aria-label="Dismiss">
        <CloseOutlined style={{ fontSize: 12 }} />
      </DismissBtn>

      <Header>
        <AppIconWrap>
          <AppIcon>M</AppIcon>
          <OnlineDot />
        </AppIconWrap>
        <TextBlock>
          <AppName>Install MilBaant</AppName>
          <AppDesc>Get the full app experience — fast, offline-ready, always at hand.</AppDesc>
        </TextBlock>
      </Header>

      <Perks>
        <Perk><MobileOutlined />Home screen</Perk>
        <Perk><WifiOutlined />Works offline</Perk>
        <Perk><ThunderboltOutlined />Faster loads</Perk>
      </Perks>

      <Actions>
        <Button
          onClick={() => handleClose()}
          style={{ height: 48, borderRadius: 12, fontWeight: 600, flexShrink: 0, padding: '0 16px' }}
        >
          Not now
        </Button>
        <InstallBtn
          type="primary"
          icon={<DownloadOutlined />}
          onClick={handleInstall}
          block
        >
          Install App
        </InstallBtn>
      </Actions>

      <DontShowLink onClick={() => handleClose(true)}>
        Don't show again
      </DontShowLink>
    </Banner>
  )
}
