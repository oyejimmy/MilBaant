import type { ReactNode } from 'react'
import { Button } from 'antd'
import { MoonOutlined, SunOutlined } from '@ant-design/icons'
import styled, { keyframes } from 'styled-components'
import { APP_NAME } from '@/lib/constants'
import { useThemeMode } from '@/context/ThemeModeContext'

/* ── Animations ─────────────────────────────────────────────────────────── */

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
`

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-10px); }
`

/* ── Page shell ─────────────────────────────────────────────────────────── */

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
  width: 400px;
  flex-shrink: 0;
  background: linear-gradient(150deg, #4096ff 0%, #1677ff 55%, #0958d9 100%);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 48px 44px;
  position: relative;
  overflow: hidden;

  @media (max-width: 1023px) {
    width: 320px;
    padding: 40px 32px;
  }

  @media (max-width: 767px) {
    width: 100%;
    padding: 28px 24px 32px;
    min-height: auto;
  }
`

const Bubble = styled.div<{
  $size: number
  $top?: string; $bottom?: string
  $left?: string; $right?: string
  $opacity: number
}>`
  position: absolute;
  width: ${p => p.$size}px;
  height: ${p => p.$size}px;
  border-radius: 50%;
  background: rgba(255,255,255,${p => p.$opacity});
  top:    ${p => p.$top    ?? 'auto'};
  bottom: ${p => p.$bottom ?? 'auto'};
  left:   ${p => p.$left   ?? 'auto'};
  right:  ${p => p.$right  ?? 'auto'};
  pointer-events: none;
`

const BrandTop = styled.div`
  position: relative;
  z-index: 1;
`

const LogoBadge = styled.div`
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: rgba(255,255,255,0.18);
  border: 1.5px solid rgba(255,255,255,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 800;
  color: #fff;
  font-family: 'Plus Jakarta Sans', sans-serif;
  margin-bottom: 24px;
  animation: ${float} 4s ease-in-out infinite;
`

const BrandTitle = styled.h1`
  margin: 0 0 8px;
  font-size: clamp(26px, 3.5vw, 34px);
  font-weight: 800;
  color: #fff;
  font-family: 'Plus Jakarta Sans', sans-serif;
  line-height: 1.15;
  letter-spacing: -0.5px;
`

const BrandSub = styled.p`
  margin: 0;
  font-size: 14px;
  color: rgba(255,255,255,0.75);
  line-height: 1.65;
`

const FeatureList = styled.ul`
  list-style: none;
  margin: 32px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
  z-index: 1;

  @media (max-width: 767px) {
    display: none;
  }
`

const FeatureItem = styled.li`
  display: flex;
  align-items: center;
  gap: 10px;
  color: rgba(255,255,255,0.85);
  font-size: 13.5px;
  font-weight: 500;

  &::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: rgba(255,255,255,0.55);
    flex-shrink: 0;
  }
`

const BrandFooter = styled.div`
  position: relative;
  z-index: 1;
  color: rgba(255,255,255,0.45);
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
  /* no background — inherits var(--app-bg) from Page */
  animation: ${fadeUp} 0.4s ease forwards;

  @media (max-width: 767px) {
    padding: 28px 20px 48px;
  }
`

const ThemeBtn = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
`

const FormInner = styled.div`
  width: 100%;
  max-width: 380px;
`

const FormHeading = styled.div`
  margin-bottom: 28px;
`

const FormTitle = styled.h2`
  margin: 0 0 6px;
  font-size: clamp(20px, 2.8vw, 26px);
  font-weight: 800;
  color: var(--text-strong);
  font-family: 'Plus Jakarta Sans', sans-serif;
  letter-spacing: -0.4px;
  line-height: 1.2;
`

const FormSubtitle = styled.p`
  margin: 0;
  font-size: 13.5px;
  color: var(--text-muted);
  line-height: 1.6;
`

/* ── Exported helpers used by pages ─────────────────────────────────────── */

export const FormFooter = styled.div`
  margin-top: 18px;
  text-align: center;
  font-size: 13.5px;
  color: var(--text-muted);

  a {
    color: var(--primary);
    font-weight: 600;
    text-decoration: none;
    &:hover { text-decoration: underline; }
  }
`

/* ── Feature list ────────────────────────────────────────────────────────── */

const FEATURES = [
  'Monthly shared bill splitting',
  'Weekend meal expense tracking',
  'Cook ledger & advance management',
  'Flat fund & contribution payments',
  'Bed assignments & announcements',
]

/* ── Component ───────────────────────────────────────────────────────────── */

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
        <Bubble $size={240} $top="-70px"  $right="-70px" $opacity={0.07} />
        <Bubble $size={160} $bottom="50px" $left="-50px"  $opacity={0.06} />
        <Bubble $size={90}  $top="42%"    $right="18px"  $opacity={0.05} />

        <BrandTop>
          <LogoBadge>M</LogoBadge>
          <BrandTitle>{APP_NAME}</BrandTitle>
          <BrandSub>
            All-in-one flat management — expenses, meals, cook ledger, and more.
          </BrandSub>
          <FeatureList>
            {FEATURES.map(f => <FeatureItem key={f}>{f}</FeatureItem>)}
          </FeatureList>
        </BrandTop>

        <BrandFooter>© {new Date().getFullYear()} {APP_NAME}</BrandFooter>
      </BrandPanel>

      {/* ── Right: Form ── */}
      <FormPanel>
        <ThemeBtn>
          <Button
            size="small"
            icon={mode === 'dark' ? <SunOutlined /> : <MoonOutlined />}
            onClick={toggleMode}
          >
            {mode === 'dark' ? 'Light' : 'Dark'}
          </Button>
        </ThemeBtn>

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
