import type { ReactNode } from 'react'
import { Button } from 'antd'
import { MoonOutlined, SunOutlined } from '@ant-design/icons'
import styled, { keyframes } from 'styled-components'
import { APP_NAME } from '@/lib/constants'
import { useThemeMode } from '@/context/ThemeModeContext'

/* ── Animations ─────────────────────────────────────────────────────────── */

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
`

const float = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  33%       { transform: translateY(-12px) rotate(1deg); }
  66%       { transform: translateY(-6px) rotate(-1deg); }
`

/* ── Layout ─────────────────────────────────────────────────────────────── */

const Page = styled.main`
  min-height: 100vh;
  display: flex;
  background: var(--app-bg);

  @media (max-width: 767px) {
    flex-direction: column;
  }
`

/* ── Left brand panel ───────────────────────────────────────────────────── */

const BrandPanel = styled.div`
  width: 420px;
  flex-shrink: 0;
  background: linear-gradient(145deg, #4096ff 0%, #1677ff 50%, #0958d9 100%);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 48px 44px;
  position: relative;
  overflow: hidden;

  @media (max-width: 1023px) {
    width: 340px;
    padding: 40px 36px;
  }

  @media (max-width: 767px) {
    width: 100%;
    padding: 32px 28px 36px;
    min-height: 220px;
  }
`

const BrandBubble = styled.div<{
  $size: number; $top?: string; $bottom?: string; $left?: string; $right?: string; $opacity: number
}>`
  position: absolute;
  width: ${p => p.$size}px;
  height: ${p => p.$size}px;
  border-radius: 50%;
  background: rgba(255, 255, 255, ${p => p.$opacity});
  top: ${p => p.$top ?? 'auto'};
  bottom: ${p => p.$bottom ?? 'auto'};
  left: ${p => p.$left ?? 'auto'};
  right: ${p => p.$right ?? 'auto'};
  pointer-events: none;
`

const BrandTop = styled.div`
  position: relative;
  z-index: 1;
`

const LogoBadge = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(8px);
  border: 1.5px solid rgba(255, 255, 255, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 800;
  color: #fff;
  font-family: 'Plus Jakarta Sans', sans-serif;
  margin-bottom: 28px;
  animation: ${float} 5s ease-in-out infinite;
`

const BrandTitle = styled.h1`
  margin: 0 0 10px;
  font-size: clamp(28px, 4vw, 36px);
  font-weight: 800;
  color: #fff;
  font-family: 'Plus Jakarta Sans', sans-serif;
  line-height: 1.15;
  letter-spacing: -0.5px;
`

const BrandSub = styled.p`
  margin: 0;
  font-size: 15px;
  color: rgba(255, 255, 255, 0.78);
  line-height: 1.65;
  max-width: 300px;
`

const FeatureList = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 40px;

  @media (max-width: 767px) {
    display: none;
  }
`

const FeatureItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  color: rgba(255, 255, 255, 0.88);
  font-size: 14px;
  font-weight: 500;
`

const FeatureDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.6);
  flex-shrink: 0;
`

const BrandFooter = styled.div`
  position: relative;
  z-index: 1;
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
  margin-top: 40px;

  @media (max-width: 767px) {
    display: none;
  }
`

/* ── Right form panel ───────────────────────────────────────────────────── */

const FormPanel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 40px;
  position: relative;
  animation: ${fadeUp} 0.45s ease forwards;

  @media (max-width: 767px) {
    padding: 32px 24px 48px;
  }
`

const ThemeToggle = styled.div`
  position: absolute;
  top: 24px;
  right: 24px;
`

const FormInner = styled.div`
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 0;
`

const FormHeading = styled.div`
  margin-bottom: 32px;
`

const FormTitle = styled.h2`
  margin: 0 0 6px;
  font-size: clamp(22px, 3vw, 28px);
  font-weight: 800;
  color: var(--text-strong);
  font-family: 'Plus Jakarta Sans', sans-serif;
  letter-spacing: -0.4px;
  line-height: 1.2;
`

const FormSubtitle = styled.p`
  margin: 0;
  font-size: 14px;
  color: var(--text-muted);
  line-height: 1.6;
`

/* ── Exports ─────────────────────────────────────────────────────────────── */

export const FormBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

export const FormFooter = styled.div`
  margin-top: 20px;
  text-align: center;
  font-size: 14px;
  color: var(--text-muted);

  a {
    color: var(--primary);
    font-weight: 600;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`

const FEATURES = [
  'Monthly shared bill splitting',
  'Weekend meal expense tracking',
  'Cook ledger & advance management',
  'Flat fund & contribution payments',
  'Bed assignments & announcements',
]

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  const { mode, toggleMode } = useThemeMode()

  return (
    <Page>
      {/* ── Left: Brand ── */}
      <BrandPanel>
        {/* Decorative bubbles */}
        <BrandBubble $size={260} $top="-80px" $right="-80px" $opacity={0.08} />
        <BrandBubble $size={180} $bottom="60px" $left="-60px" $opacity={0.07} />
        <BrandBubble $size={100} $top="40%" $right="20px" $opacity={0.06} />

        <BrandTop>
          <LogoBadge>M</LogoBadge>
          <BrandTitle>{APP_NAME}</BrandTitle>
          <BrandSub>
            The all-in-one flat management app for shared expenses, meals, and more.
          </BrandSub>
          <FeatureList>
            {FEATURES.map((f) => (
              <FeatureItem key={f}>
                <FeatureDot />
                {f}
              </FeatureItem>
            ))}
          </FeatureList>
        </BrandTop>

        <BrandFooter>© {new Date().getFullYear()} {APP_NAME}</BrandFooter>
      </BrandPanel>

      {/* ── Right: Form ── */}
      <FormPanel>
        <ThemeToggle>
          <Button
            size="small"
            icon={mode === 'dark' ? <SunOutlined /> : <MoonOutlined />}
            onClick={toggleMode}
            style={{ borderRadius: 8 }}
          >
            {mode === 'dark' ? 'Light' : 'Dark'}
          </Button>
        </ThemeToggle>

        <FormInner>
          <FormHeading>
            <FormTitle>{title}</FormTitle>
            <FormSubtitle>{subtitle}</FormSubtitle>
          </FormHeading>
          {children}
        </FormInner>
      </FormPanel>
    </Page>
  )
}
