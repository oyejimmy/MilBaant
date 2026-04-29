/**
 * InstallPrompt — shows a native-style install banner when the browser
 * fires the `beforeinstallprompt` event (Chrome/Edge/Android).
 *
 * Also shows iOS-specific instructions since Safari doesn't fire that event.
 *
 * Dismissed state is persisted in localStorage so it doesn't re-appear
 * every session.
 */
import { useEffect, useState } from 'react'
import { Button, Typography } from 'antd'
import { CloseOutlined, DownloadOutlined, ShareAltOutlined } from '@ant-design/icons'
import styled, { keyframes } from 'styled-components'

// ── Types ─────────────────────────────────────────────────────────────────────

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// ── Animations ────────────────────────────────────────────────────────────────

const slideUp = keyframes`
  from { transform: translateY(100%); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
`

const slideDown = keyframes`
  from { transform: translateY(0);    opacity: 1; }
  to   { transform: translateY(100%); opacity: 0; }
`

// ── Styled ────────────────────────────────────────────────────────────────────

const Banner = styled.div<{ $hiding: boolean }>`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  padding: 12px 16px;
  padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
  background: var(--card-bg);
  border-top: 1px solid var(--card-border);
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.12);
  animation: ${({ $hiding }) => ($hiding ? slideDown : slideUp)} 0.3s ease forwards;

  @media (min-width: 600px) {
    bottom: 24px;
    left: 50%;
    right: auto;
    transform: translateX(-50%);
    width: 380px;
    border-radius: 16px;
    border: 1px solid var(--card-border);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
    padding-bottom: 12px;
  }
`

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`

const AppIcon = styled.div`
  width: 52px;
  height: 52px;
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`

const TextBlock = styled.div`
  flex: 1;
  min-width: 0;
`

const Actions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 10px;
`

const DismissBtn = styled.button`
  position: absolute;
  top: 10px;
  right: 12px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  padding: 4px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease;

  &:hover { background: var(--menu-hover-bg); }
`

const IOSStep = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  font-size: 13px;
  color: var(--text-primary);
`

const StepNum = styled.span`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--primary);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`

// ── Helpers ───────────────────────────────────────────────────────────────────

const DISMISSED_KEY = 'milbaant-pwa-dismissed'
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
    // Snooze for 3 days
    localStorage.setItem(DISMISSED_UNTIL_KEY, String(Date.now() + 3 * 24 * 60 * 60 * 1000))
  }
}

function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as Window & { MSStream?: unknown }).MSStream
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
  const [showIOS, setShowIOS] = useState(false)
  const [hiding, setHiding] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Don't show if already installed or dismissed
    if (isInStandaloneMode() || isDismissed()) return

    if (isIOS()) {
      // Show iOS instructions after a short delay
      const t = setTimeout(() => setShowIOS(true), 2000)
      return () => clearTimeout(t)
    }

    // Listen for Chrome/Edge/Android install prompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  // Show banner when prompt is ready
  useEffect(() => {
    if (deferredPrompt || showIOS) {
      const t = setTimeout(() => setVisible(true), 500)
      return () => clearTimeout(t)
    }
  }, [deferredPrompt, showIOS])

  function handleInstall() {
    if (!deferredPrompt) return
    void deferredPrompt.prompt()
    void deferredPrompt.userChoice.then((choice) => {
      if (choice.outcome === 'accepted') {
        dismiss(true)
      }
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
    }, 300)
  }

  if (!visible) return null

  // ── iOS instructions ──
  if (showIOS) {
    return (
      <Banner $hiding={hiding} role="dialog" aria-label="Install MilBaant">
        <DismissBtn onClick={() => handleClose()} aria-label="Dismiss">
          <CloseOutlined style={{ fontSize: 14 }} />
        </DismissBtn>

        <Row>
          <AppIcon>
            <img src="/apple-touch-icon.png" alt="MilBaant" />
          </AppIcon>
          <TextBlock>
            <Typography.Text strong style={{ color: 'var(--text-strong)', display: 'block', fontSize: 14 }}>
              Install MilBaant
            </Typography.Text>
            <Typography.Text style={{ color: 'var(--text-muted)', fontSize: 12 }}>
              Add to your home screen for the best experience
            </Typography.Text>
          </TextBlock>
        </Row>

        <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--content-bg)', borderRadius: 10 }}>
          <IOSStep>
            <StepNum>1</StepNum>
            <span>Tap the <ShareAltOutlined style={{ color: 'var(--primary)' }} /> <strong>Share</strong> button in Safari</span>
          </IOSStep>
          <IOSStep>
            <StepNum>2</StepNum>
            <span>Scroll down and tap <strong>"Add to Home Screen"</strong></span>
          </IOSStep>
          <IOSStep>
            <StepNum>3</StepNum>
            <span>Tap <strong>"Add"</strong> to install</span>
          </IOSStep>
        </div>

        <Actions>
          <Button size="small" block onClick={() => handleClose(true)} style={{ flex: 1 }}>
            Don't show again
          </Button>
        </Actions>
      </Banner>
    )
  }

  // ── Chrome / Android install prompt ──
  return (
    <Banner $hiding={hiding} role="dialog" aria-label="Install MilBaant">
      <DismissBtn onClick={() => handleClose()} aria-label="Dismiss">
        <CloseOutlined style={{ fontSize: 14 }} />
      </DismissBtn>

      <Row>
        <AppIcon>
          <img src="/pwa-192.png" alt="MilBaant" />
        </AppIcon>
        <TextBlock>
          <Typography.Text strong style={{ color: 'var(--text-strong)', display: 'block', fontSize: 14 }}>
            Install MilBaant
          </Typography.Text>
          <Typography.Text style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            Add to home screen for quick access — works offline too
          </Typography.Text>
        </TextBlock>
      </Row>

      <Actions>
        <Button size="small" onClick={() => handleClose()} style={{ flex: 1 }}>
          Not now
        </Button>
        <Button
          type="primary"
          size="small"
          icon={<DownloadOutlined />}
          onClick={handleInstall}
          style={{ flex: 2 }}
        >
          Install App
        </Button>
      </Actions>
    </Banner>
  )
}
