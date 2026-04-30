import type { ReactNode } from 'react'
import { Button } from 'antd'
import { MoonOutlined, SunOutlined } from '@ant-design/icons'
import styled, { keyframes, css } from 'styled-components'
import { APP_NAME } from '@/lib/constants'
import { useThemeMode } from '@/context/ThemeModeContext'

/* ── Keyframes ───────────────────────────────────────────────────────────── */

const slideInLeft = keyframes`
  from { opacity: 0; transform: translateX(-40px); }
  to   { opacity: 1; transform: translateX(0); }
`

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(22px); }
  to   { opacity: 1; transform: translateY(0); }
`

const floatBadge = keyframes`
  0%, 100% { transform: translateY(0px) rotate(-1deg); }
  50%       { transform: translateY(-9px) rotate(1deg); }
`

const shimmerText = keyframes`
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
`

const blobPulse = keyframes`
  0%, 100% { transform: scale(1);    opacity: 0.7; }
  50%       { transform: scale(1.12); opacity: 1; }
`

/* ── Stagger helper ─────────────────────────────────────────────────────── */
const stagger = (delay: number) => css`
  opacity: 0;
  animation: ${fadeUp} 0.55s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms forwards;
`

/* ══════════════════════════════════════════════════════════════════════════
   PAGE SHELL
══════════════════════════════════════════════════════════════════════════ */

const Page = styled.main`
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  background: var(--app-bg);

  @media (max-width: 767px) {
    flex-direction: column;
  }
`

/* ══════════════════════════════════════════════════════════════════════════
   LEFT BRAND PANEL  — skeuomorphic deep-blue card
══════════════════════════════════════════════════════════════════════════ */

const BrandPanel = styled.div`
  width: 420px;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 52px 48px;

  /* Skeuomorphic layered background */
  background:
    linear-gradient(160deg, #1e4fd8 0%, #1260e8 30%, #0a4fd4 60%, #0840b8 100%);

  /* Subtle inner bevel — top-left light, bottom-right shadow */
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.18),
    inset 0 -1px 0 rgba(0,0,0,0.25),
    inset 1px 0 0 rgba(255,255,255,0.10),
    inset -1px 0 0 rgba(0,0,0,0.15);

  animation: ${slideInLeft} 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards;

  /* Dot-grid texture */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: radial-gradient(rgba(255,255,255,0.11) 1px, transparent 1px);
    background-size: 24px 24px;
    pointer-events: none;
  }

  /* Diagonal gloss streak */
  &::after {
    content: '';
    position: absolute;
    top: -60px;
    left: -80px;
    width: 340px;
    height: 340px;
    background: linear-gradient(135deg, rgba(255,255,255,0.10) 0%, transparent 60%);
    border-radius: 50%;
    pointer-events: none;
  }

  @media (max-width: 1023px) {
    width: 340px;
    padding: 44px 36px;
  }

  @media (max-width: 767px) {
    width: 100%;
    padding: 28px 20px 22px;
    min-height: auto;
    animation: none;
    opacity: 1;
  }
`

/* Blurred blobs */
const Blob = styled.div<{
  $size: number
  $top?: string; $bottom?: string
  $left?: string; $right?: string
  $opacity: number
  $delay?: number
}>`
  position: absolute;
  width: ${p => p.$size}px;
  height: ${p => p.$size}px;
  border-radius: 50%;
  background: rgba(255,255,255,${p => p.$opacity});
  filter: blur(${p => Math.round(p.$size * 0.4)}px);
  top:    ${p => p.$top    ?? 'auto'};
  bottom: ${p => p.$bottom ?? 'auto'};
  left:   ${p => p.$left   ?? 'auto'};
  right:  ${p => p.$right  ?? 'auto'};
  pointer-events: none;
  animation: ${blobPulse} ${p => 4 + (p.$delay ?? 0) * 0.6}s ease-in-out ${p => (p.$delay ?? 0) * 0.4}s infinite;
`

const BrandTop = styled.div`
  position: relative;
  z-index: 1;
`

/* Skeuomorphic logo badge — raised button feel */
const LogoBadge = styled.div`
  width: 62px;
  height: 62px;
  border-radius: 18px;
  margin-bottom: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  font-weight: 800;
  color: #fff;
  font-family: 'Plus Jakarta Sans', sans-serif;
  letter-spacing: -1px;
  animation: ${floatBadge} 5s ease-in-out infinite;

  /* Skeuomorphic raised look */
  background: linear-gradient(145deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.08) 100%);
  border: 1.5px solid rgba(255,255,255,0.35);
  box-shadow:
    0 8px 24px rgba(0,0,0,0.25),
    0 2px 4px rgba(0,0,0,0.15),
    inset 0 1px 0 rgba(255,255,255,0.4),
    inset 0 -1px 0 rgba(0,0,0,0.2);
  backdrop-filter: blur(8px);

  @media (max-width: 767px) {
    width: 50px;
    height: 50px;
    font-size: 20px;
    border-radius: 14px;
    margin-bottom: 14px;
  }
`

const BrandTitle = styled.h1`
  margin: 0 0 8px;
  font-size: clamp(26px, 3.2vw, 34px);
  font-weight: 800;
  color: #fff;
  font-family: 'Plus Jakarta Sans', sans-serif;
  line-height: 1.12;
  letter-spacing: -0.6px;
  text-shadow: 0 2px 8px rgba(0,0,0,0.2);

  @media (max-width: 767px) {
    font-size: 20px;
    margin-bottom: 4px;
  }
`

const BrandSub = styled.p`
  margin: 0;
  font-size: 14px;
  color: rgba(255,255,255,0.72);
  line-height: 1.65;
  max-width: 280px;

  @media (max-width: 767px) {
    font-size: 12.5px;
    max-width: 100%;
  }
`

const AccentLine = styled.div`
  width: 36px;
  height: 3px;
  border-radius: 2px;
  margin: 22px 0;
  background: rgba(255,255,255,0.35);
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);

  @media (max-width: 767px) { display: none; }
`

/* Desktop feature list */
const FeatureList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 11px;
  position: relative;
  z-index: 1;

  @media (max-width: 767px) { display: none; }
`

const FeatureItem = styled.li<{ $delay: number }>`
  display: flex;
  align-items: center;
  gap: 11px;
  color: rgba(255,255,255,0.85);
  font-size: 13.5px;
  font-weight: 500;
  line-height: 1.4;
  opacity: 0;
  animation: ${fadeUp} 0.45s cubic-bezier(0.22, 1, 0.36, 1) ${p => p.$delay}ms forwards;
`

/* Skeuomorphic icon tile */
const FeatureIcon = styled.span`
  width: 32px;
  height: 32px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  flex-shrink: 0;
  background: linear-gradient(145deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 100%);
  border: 1px solid rgba(255,255,255,0.22);
  box-shadow:
    0 2px 6px rgba(0,0,0,0.18),
    inset 0 1px 0 rgba(255,255,255,0.3);
`

/* Mobile: horizontal chip row */
const MobileChips = styled.div`
  display: none;

  @media (max-width: 767px) {
    display: flex;
    gap: 7px;
    margin-top: 12px;
    overflow-x: auto;
    padding-bottom: 2px;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    &::-webkit-scrollbar { display: none; }
  }
`

const MobileChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 20px;
  background: rgba(255,255,255,0.13);
  border: 1px solid rgba(255,255,255,0.2);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.2), 0 1px 3px rgba(0,0,0,0.15);
  color: rgba(255,255,255,0.9);
  font-size: 11.5px;
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
`

const BrandFooter = styled.div`
  position: relative;
  z-index: 1;
  color: rgba(255,255,255,0.32);
  font-size: 11.5px;
  margin-top: 40px;

  @media (max-width: 767px) { display: none; }
`

/* ══════════════════════════════════════════════════════════════════════════
   RIGHT FORM PANEL  — skeuomorphic paper card
══════════════════════════════════════════════════════════════════════════ */

const FormPanel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 56px 48px;
  position: relative;
  overflow-y: auto;
  background: var(--app-bg);

  @media (max-width: 1023px) { padding: 48px 32px; }
  @media (max-width: 767px)  { padding: 28px 18px 52px; justify-content: flex-start; }
`

const ThemeBtn = styled.div`
  position: absolute;
  top: 18px;
  right: 18px;
  z-index: 10;
`

/* Skeuomorphic form card — raised paper look */
const FormCard = styled.div`
  width: 100%;
  max-width: 400px;
  background: var(--card-bg);
  border-radius: 20px;
  padding: 36px 32px 32px;

  /* Skeuomorphic raised card */
  box-shadow:
    0 1px 0 rgba(255,255,255,0.9) inset,
    0 -1px 0 rgba(0,0,0,0.06) inset,
    0 4px 6px rgba(0,0,0,0.04),
    0 10px 20px rgba(0,0,0,0.07),
    0 20px 40px rgba(0,0,0,0.05);
  border: 1px solid var(--border-light);

  ${stagger(60)}

  @media (max-width: 767px) {
    padding: 28px 20px 24px;
    border-radius: 16px;
    box-shadow:
      0 1px 0 rgba(255,255,255,0.9) inset,
      0 4px 12px rgba(0,0,0,0.08);
  }
`

const FormHeading = styled.div`
  margin-bottom: 28px;
`

/* Shimmer eyebrow label */
const FormEyebrow = styled.span`
  display: inline-block;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  margin-bottom: 10px;
  background: linear-gradient(90deg, #1260e8, #4096ff, #69b1ff, #1260e8);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: ${shimmerText} 3.5s linear infinite;
`

const FormTitle = styled.h2`
  margin: 0 0 7px;
  font-size: clamp(21px, 2.8vw, 27px);
  font-weight: 800;
  color: var(--text-strong);
  font-family: 'Plus Jakarta Sans', sans-serif;
  letter-spacing: -0.5px;
  line-height: 1.18;
`

const FormSubtitle = styled.p`
  margin: 0;
  font-size: 13.5px;
  color: var(--text-muted);
  line-height: 1.65;
`

const FormBody = styled.div`
  ${stagger(180)}

  /* Skeuomorphic input overrides — inset well */
  .ant-input,
  .ant-input-affix-wrapper,
  .ant-input-password {
    background: var(--bg-elevated) !important;
    box-shadow:
      inset 0 2px 4px rgba(0,0,0,0.07),
      inset 0 1px 2px rgba(0,0,0,0.05) !important;
    border-color: var(--border-default) !important;
    border-radius: 10px !important;
    transition: box-shadow 0.2s, border-color 0.2s;

    &:focus, &:focus-within {
      border-color: var(--primary) !important;
      box-shadow:
        inset 0 2px 4px rgba(0,0,0,0.05),
        0 0 0 3px rgba(64,150,255,0.15) !important;
    }
  }
`

/* ── Exported helpers ────────────────────────────────────────────────────── */

export const FormFooter = styled.div`
  margin-top: 20px;
  text-align: center;
  font-size: 13.5px;
  color: var(--text-muted);
  ${stagger(280)}

  a {
    color: var(--primary);
    font-weight: 600;
    text-decoration: none;
    &:hover { text-decoration: underline; }
  }
`

/* ── Feature data ────────────────────────────────────────────────────────── */

const FEATURES_FULL = [
  { icon: '💸', label: 'Monthly shared bill splitting' },
  { icon: '🍽️', label: 'Weekend meal expense tracking' },
  { icon: '👨‍🍳', label: 'Cook ledger & advance management' },
  { icon: '🏦', label: 'Flat fund & contribution payments' },
  { icon: '🛏️', label: 'Bed assignments & announcements' },
]

const FEATURES_SHORT = [
  { icon: '💸', label: 'Bills' },
  { icon: '🍽️', label: 'Meals' },
  { icon: '👨‍🍳', label: 'Cook' },
  { icon: '🏦', label: 'Fund' },
  { icon: '🛏️', label: 'Beds' },
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
        <Blob $size={340} $top="-120px" $right="-100px" $opacity={0.07} $delay={0} />
        <Blob $size={220} $bottom="40px" $left="-90px"  $opacity={0.06} $delay={1} />
        <Blob $size={110} $top="46%"    $right="20px"   $opacity={0.05} $delay={2} />

        <BrandTop>
          <LogoBadge>M</LogoBadge>
          <BrandTitle>{APP_NAME}</BrandTitle>
          <BrandSub>All-in-one flat management — expenses, meals, cook ledger, and more.</BrandSub>

          {/* Mobile chips */}
          <MobileChips>
            {FEATURES_SHORT.map(f => (
              <MobileChip key={f.label}>
                <span style={{ fontSize: 14 }}>{f.icon}</span>
                {f.label}
              </MobileChip>
            ))}
          </MobileChips>

          <AccentLine />

          {/* Desktop list */}
          <FeatureList>
            {FEATURES_FULL.map((f, i) => (
              <FeatureItem key={f.label} $delay={320 + i * 65}>
                <FeatureIcon>{f.icon}</FeatureIcon>
                {f.label}
              </FeatureItem>
            ))}
          </FeatureList>
        </BrandTop>

        <BrandFooter>© {new Date().getFullYear()} {APP_NAME} · All rights reserved</BrandFooter>
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

        <FormCard>
          <FormHeading>
            <FormEyebrow>{APP_NAME}</FormEyebrow>
            <FormTitle>{title}</FormTitle>
            <FormSubtitle>{subtitle}</FormSubtitle>
          </FormHeading>

          <FormBody>{children}</FormBody>
        </FormCard>
      </FormPanel>
    </Page>
  )
}
