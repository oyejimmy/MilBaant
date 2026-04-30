import type { ReactNode } from 'react'
import { Button } from 'antd'
import { MoonOutlined, SunOutlined } from '@ant-design/icons'
import styled, { keyframes, css } from 'styled-components'
import { APP_NAME } from '@/lib/constants'
import { useThemeMode } from '@/context/ThemeModeContext'

/* ═══════════════════════════════════════════════════════════════════════════
   VARIANTS — each auth screen gets its own accent + quote
═══════════════════════════════════════════════════════════════════════════ */

export type AuthVariant = 'login' | 'register' | 'forgot' | 'reset' | 'pending'

interface VariantConfig {
  accent: string          // orb + badge glow color
  badgeGradient: string   // left-panel icon badge gradient
  quote: string           // funny one-liner
  quoteAuthor: string     // attribution
  tagline: string         // card logo tagline
}

const VARIANTS: Record<AuthVariant, VariantConfig> = {
  login: {
    accent: '#1c8ee5',
    badgeGradient: 'linear-gradient(145deg, #1465a3 0%, #1c8ee5 55%, #2fa8f5 100%)',
    quote: '"Splitting bills fairly since forever.\nStill cheaper than living alone."',
    quoteAuthor: '— your wallet, finally breathing 💸',
    tagline: 'Flat management',
  },
  register: {
    accent: '#22c55e',
    badgeGradient: 'linear-gradient(145deg, #15803d 0%, #22c55e 55%, #4ade80 100%)',
    quote: '"Join the chaos.\nAt least it\'s organized chaos."',
    quoteAuthor: '— New flatmate, day one',
    tagline: 'Welcome aboard',
  },
  forgot: {
    accent: '#f59e0b',
    badgeGradient: 'linear-gradient(145deg, #b45309 0%, #f59e0b 55%, #fcd34d 100%)',
    quote: '"Forgot your password?\nAt least you didn\'t forget to pay rent."',
    quoteAuthor: '— The admin, judging silently',
    tagline: 'Account recovery',
  },
  reset: {
    accent: '#8b5cf6',
    badgeGradient: 'linear-gradient(145deg, #6d28d9 0%, #8b5cf6 55%, #c4b5fd 100%)',
    quote: '"New password.\nSame broke flatmates.\nFresh start though."',
    quoteAuthor: '— Optimism, loading…',
    tagline: 'Security update',
  },
  pending: {
    accent: '#f97316',
    badgeGradient: 'linear-gradient(145deg, #c2410c 0%, #f97316 55%, #fdba74 100%)',
    quote: '"Good things come to those who wait.\nBills, unfortunately, do not."',
    quoteAuthor: '— The flat fund, impatiently',
    tagline: 'Pending access',
  },
}

/* ═══════════════════════════════════════════════════════════════════════════
   KEYFRAMES
═══════════════════════════════════════════════════════════════════════════ */

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
`

const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`

const slideInLeft = keyframes`
  from { opacity: 0; transform: translateX(-40px); }
  to   { opacity: 1; transform: translateX(0); }
`

const slideInRight = keyframes`
  from { opacity: 0; transform: translateX(32px); }
  to   { opacity: 1; transform: translateX(0); }
`

const floatBadge = keyframes`
  0%, 100% { transform: translateY(0px) rotate(-1deg); }
  50%       { transform: translateY(-8px) rotate(1deg); }
`

const driftA = keyframes`
  0%, 100% { transform: translate(0, 0) scale(1); }
  33%       { transform: translate(18px, -14px) scale(1.06); }
  66%       { transform: translate(-10px, 10px) scale(0.96); }
`

const driftB = keyframes`
  0%, 100% { transform: translate(0, 0) scale(1); }
  40%       { transform: translate(-16px, 12px) scale(1.04); }
  70%       { transform: translate(12px, -8px) scale(0.97); }
`

const driftC = keyframes`
  0%, 100% { transform: translate(0, 0); }
  50%       { transform: translate(10px, 14px); }
`

const shimmer = keyframes`
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
`

const quoteSlide = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
`

const heartbeat = keyframes`
  0%, 100% { transform: scale(1); }
  50%       { transform: scale(1.35); }
`

const stagger = (delay: number) => css`
  opacity: 0;
  animation: ${fadeUp} 0.55s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms forwards;
`

/* ═══════════════════════════════════════════════════════════════════════════
   PAGE SHELL
═══════════════════════════════════════════════════════════════════════════ */

const Page = styled.main`
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  background: var(--app-bg);
  animation: ${fadeIn} 0.3s ease forwards;

  @media (max-width: 767px) { flex-direction: column; }
`

/* ═══════════════════════════════════════════════════════════════════════════
   LEFT BRAND PANEL
═══════════════════════════════════════════════════════════════════════════ */

const BrandPanel = styled.div`
  width: 400px;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 48px 44px;
  background: var(--card-bg);
  border-right: 1px solid var(--border-light);
  animation: ${slideInLeft} 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: radial-gradient(var(--border-light) 1.2px, transparent 1.2px);
    background-size: 24px 24px;
    pointer-events: none;
    z-index: 0;
  }

  @media (max-width: 1023px) { width: 340px; padding: 40px 32px; }
  @media (max-width: 767px) {
    width: 100%;
    padding: 24px 20px 20px;
    animation: none;
    opacity: 1;
    border-right: none;
    border-bottom: 1px solid var(--border-light);
  }
`

const Orb = styled.div<{
  $size: number
  $top?: string; $bottom?: string
  $left?: string; $right?: string
  $opacity: number
  $color: string
  $drift: 'a' | 'b' | 'c'
  $duration: number
}>`
  position: absolute;
  width: ${p => p.$size}px;
  height: ${p => p.$size}px;
  border-radius: 50%;
  background: ${p => p.$color};
  opacity: ${p => p.$opacity};
  filter: blur(${p => Math.round(p.$size * 0.48)}px);
  top:    ${p => p.$top    ?? 'auto'};
  bottom: ${p => p.$bottom ?? 'auto'};
  left:   ${p => p.$left   ?? 'auto'};
  right:  ${p => p.$right  ?? 'auto'};
  pointer-events: none;
  z-index: 0;
  animation: ${p =>
    p.$drift === 'a' ? css`${driftA} ${p.$duration}s ease-in-out infinite` :
    p.$drift === 'b' ? css`${driftB} ${p.$duration}s ease-in-out infinite` :
                       css`${driftC} ${p.$duration}s ease-in-out infinite`
  };
`

const BrandTop = styled.div`
  position: relative;
  z-index: 1;
`

const IconBadge = styled.div<{ $gradient: string }>`
  width: 68px;
  height: 68px;
  border-radius: 20px;
  margin-bottom: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${p => p.$gradient};
  box-shadow: 0 8px 24px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.38);
  animation: ${floatBadge} 5s ease-in-out infinite;

  @media (max-width: 767px) {
    width: 48px; height: 48px; border-radius: 14px; margin-bottom: 12px; animation: none;
  }
`

const BrandName = styled.div`
  font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;
  color: var(--text-muted); margin-bottom: 10px;
  opacity: 0; animation: ${fadeUp} 0.5s ease 200ms forwards;
`

const BrandTitle = styled.h1`
  margin: 0 0 10px;
  font-size: clamp(24px, 3vw, 32px); font-weight: 800;
  color: var(--text-strong); font-family: 'Plus Jakarta Sans', sans-serif;
  line-height: 1.12; letter-spacing: -0.5px;
  opacity: 0; animation: ${fadeUp} 0.5s ease 300ms forwards;

  @media (max-width: 767px) { font-size: 20px; margin-bottom: 4px; }
`

const BrandSub = styled.p`
  margin: 0; font-size: 13.5px; color: var(--text-muted); line-height: 1.7; max-width: 270px;
  opacity: 0; animation: ${fadeUp} 0.5s ease 380ms forwards;

  @media (max-width: 767px) { font-size: 12px; max-width: 100%; }
`

const Divider = styled.div`
  width: 32px; height: 2px; border-radius: 2px;
  background: var(--border-default); margin: 24px 0;
  opacity: 0; animation: ${fadeIn} 0.4s ease 440ms forwards;

  @media (max-width: 767px) { display: none; }
`

/* Funny quote block */
const QuoteBlock = styled.div`
  margin-top: 4px;
  padding: 16px 18px;
  border-radius: 12px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-light);
  opacity: 0;
  animation: ${quoteSlide} 0.55s cubic-bezier(0.22, 1, 0.36, 1) 520ms forwards;

  @media (max-width: 767px) { display: none; }
`

const QuoteText = styled.p`
  margin: 0 0 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-strong);
  line-height: 1.6;
  white-space: pre-line;
  font-style: italic;
`

const QuoteAuthor = styled.span`
  font-size: 11.5px;
  color: var(--text-muted);
  font-weight: 500;
`

/* Feature list */
const FeatureList = styled.ul`
  list-style: none; margin: 0; padding: 0;
  display: flex; flex-direction: column; gap: 10px;
  position: relative; z-index: 1;

  @media (max-width: 767px) { display: none; }
`

const FeatureItem = styled.li<{ $delay: number }>`
  display: flex; align-items: center; gap: 10px;
  color: var(--text-secondary); font-size: 13px; font-weight: 500;
  opacity: 0;
  animation: ${fadeUp} 0.4s cubic-bezier(0.22, 1, 0.36, 1) ${p => p.$delay}ms forwards;
  transition: color 0.2s;
  &:hover { color: var(--text-strong); }
`

const FeatureIcon = styled.span`
  width: 30px; height: 30px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; flex-shrink: 0;
  background: var(--bg-elevated); border: 1px solid var(--border-light);
  transition: transform 0.2s ease;
  ${FeatureItem}:hover & { transform: scale(1.12); }
`

/* Mobile chips */
const MobileChips = styled.div`
  display: none;
  @media (max-width: 767px) {
    display: flex; gap: 6px; margin-top: 10px;
    overflow-x: auto; padding-bottom: 2px;
    scrollbar-width: none; &::-webkit-scrollbar { display: none; }
  }
`

const MobileChip = styled.span`
  display: inline-flex; align-items: center; gap: 4px;
  padding: 4px 9px; border-radius: 20px;
  background: var(--bg-elevated); border: 1px solid var(--border-light);
  color: var(--text-secondary); font-size: 11px; font-weight: 500;
  white-space: nowrap; flex-shrink: 0;
`

const BrandFooter = styled.div`
  position: relative; z-index: 1;
  display: flex; flex-direction: column; gap: 3px;
  opacity: 0; animation: ${fadeIn} 0.5s ease 900ms forwards;

  @media (max-width: 767px) { display: none; }
`

const FooterCopy = styled.span`font-size: 11px; color: var(--text-muted);`

const FooterLove = styled.span`
  font-size: 11px; color: var(--text-muted);
  .heart { color: #e53935; display: inline-block; animation: ${heartbeat} 1.4s ease-in-out infinite; }
`

/* ═══════════════════════════════════════════════════════════════════════════
   RIGHT FORM PANEL
═══════════════════════════════════════════════════════════════════════════ */

const FormPanel = styled.div`
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 52px 48px; position: relative; overflow-y: auto;
  background: var(--app-bg);
  animation: ${slideInRight} 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;

  @media (max-width: 1023px) { padding: 44px 28px; }
  @media (max-width: 767px) { padding: 24px 16px 48px; justify-content: flex-start; animation: none; }
`

const ThemeBtn = styled.div`
  position: absolute; top: 16px; right: 16px; z-index: 10;
  opacity: 0; animation: ${fadeIn} 0.4s ease 500ms forwards;
`

const FormCard = styled.div`
  width: 100%; max-width: 420px;
  background: var(--card-bg); border-radius: 20px;
  padding: 36px 32px 30px; border: 1px solid var(--border-light);
  box-shadow:
    0 1px 0 rgba(255,255,255,0.85) inset,
    0 -1px 0 rgba(0,0,0,0.05) inset,
    0 4px 8px rgba(0,0,0,0.04),
    0 12px 24px rgba(0,0,0,0.07),
    0 24px 48px rgba(0,0,0,0.04);
  ${stagger(80)}

  @media (max-width: 767px) { padding: 24px 18px 22px; border-radius: 16px; }
`

const CardLogo = styled.div`
  display: flex; flex-direction: column; align-items: center; gap: 10px; margin-bottom: 28px;
`

const CardLogoBadge = styled.div<{ $gradient: string; $glow: string }>`
  width: 56px; height: 56px; border-radius: 16px;
  display: flex; align-items: center; justify-content: center;
  background: ${p => p.$gradient};
  box-shadow: 0 4px 18px ${p => p.$glow};
  transition: box-shadow 0.3s ease;
`

const CardLogoText = styled.div`
  display: flex; flex-direction: column; align-items: center; line-height: 1.25;
`

const CardLogoName = styled.span`
  font-size: 15px; font-weight: 800; color: var(--text-strong);
  font-family: 'Plus Jakarta Sans', sans-serif; letter-spacing: -0.2px;
`

const CardLogoTagline = styled.span`font-size: 11px; color: var(--text-muted); font-weight: 500;`

const FormHeading = styled.div`margin-bottom: 26px; text-align: center;`

const FormEyebrow = styled.span<{ $colors: string }>`
  display: inline-block; font-size: 10px; font-weight: 700;
  letter-spacing: 1.8px; text-transform: uppercase; margin-bottom: 8px;
  background: ${p => p.$colors};
  background-size: 200% auto;
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  animation: ${shimmer} 4s linear infinite;
`

const FormTitle = styled.h2`
  margin: 0 0 6px;
  font-size: clamp(20px, 2.6vw, 26px); font-weight: 800;
  color: var(--text-strong); font-family: 'Plus Jakarta Sans', sans-serif;
  letter-spacing: -0.4px; line-height: 1.2;
`

const FormSubtitle = styled.p`margin: 0; font-size: 13px; color: var(--text-muted); line-height: 1.65;`

const FormBody = styled.div`${stagger(200)}`

export const FormFooter = styled.div`
  margin-top: 18px; text-align: center; font-size: 13px; color: var(--text-muted);
  ${stagger(320)}
  a { color: #1c8ee5; font-weight: 600; text-decoration: none; &:hover { text-decoration: underline; } }
`

/* ── House SVG ───────────────────────────────────────────────────────────── */

function HouseIcon({ size = 36 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={size} height={size} aria-hidden="true">
      <polygon points="256,100 390,230 122,230" fill="rgba(255,255,255,0.95)" />
      <polygon points="256,100 390,230 370,230 256,128 142,230 122,230" fill="rgba(255,255,255,0.15)" />
      <rect x="152" y="228" width="208" height="168" rx="10" fill="rgba(255,255,255,0.92)" />
      <rect x="220" y="310" width="72" height="86" rx="36" fill="rgba(20,101,163,0.55)" />
      <circle cx="284" cy="356" r="6" fill="rgba(255,255,255,0.75)" />
      <rect x="168" y="258" width="52" height="44" rx="8" fill="rgba(20,101,163,0.38)" />
      <line x1="194" y1="258" x2="194" y2="302" stroke="rgba(255,255,255,0.5)" strokeWidth="3" />
      <line x1="168" y1="280" x2="220" y2="280" stroke="rgba(255,255,255,0.5)" strokeWidth="3" />
      <rect x="292" y="258" width="52" height="44" rx="8" fill="rgba(20,101,163,0.38)" />
      <line x1="318" y1="258" x2="318" y2="302" stroke="rgba(255,255,255,0.5)" strokeWidth="3" />
      <line x1="292" y1="280" x2="344" y2="280" stroke="rgba(255,255,255,0.5)" strokeWidth="3" />
    </svg>
  )
}

/* ── Feature data ────────────────────────────────────────────────────────── */

const FEATURES = [
  { icon: '💸', label: 'Monthly shared bill splitting' },
  { icon: '🍽️', label: 'Weekend meal expense tracking' },
  { icon: '👨‍🍳', label: 'Cook ledger & advance management' },
  { icon: '🏦', label: 'Flat fund & contribution payments' },
  { icon: '🛏️', label: 'Bed assignments & announcements' },
]

const CHIPS = [
  { icon: '💸', label: 'Bills' },
  { icon: '🍽️', label: 'Meals' },
  { icon: '👨‍🍳', label: 'Cook' },
  { icon: '🏦', label: 'Fund' },
  { icon: '🛏️', label: 'Beds' },
]

/* Eyebrow shimmer gradients per variant */
const EYEBROW_GRADIENTS: Record<AuthVariant, string> = {
  login:    'linear-gradient(90deg, #0f3fa6, #1c8ee5, #49a5ea, #1260e8)',
  register: 'linear-gradient(90deg, #15803d, #22c55e, #4ade80, #16a34a)',
  forgot:   'linear-gradient(90deg, #b45309, #f59e0b, #fcd34d, #d97706)',
  reset:    'linear-gradient(90deg, #6d28d9, #8b5cf6, #c4b5fd, #7c3aed)',
  pending:  'linear-gradient(90deg, #c2410c, #f97316, #fdba74, #ea580c)',
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════════════════════════════════ */

export function AuthShell({
  title,
  subtitle,
  eyebrow,
  variant = 'login',
  children,
}: {
  title: string
  subtitle: string
  eyebrow?: string
  variant?: AuthVariant
  children: ReactNode
}) {
  const { mode, toggleMode } = useThemeMode()
  const v = VARIANTS[variant]

  return (
    <Page>
      {/* ── Left brand panel ── */}
      <BrandPanel>
        <Orb $size={300} $top="-80px"  $right="-60px"  $opacity={0.07} $color={v.accent} $drift="a" $duration={12} />
        <Orb $size={180} $bottom="60px" $left="-70px"  $opacity={0.05} $color={v.accent} $drift="b" $duration={15} />
        <Orb $size={90}  $top="42%"    $right="10px"   $opacity={0.04} $color={v.accent} $drift="c" $duration={10} />

        <BrandTop>
          <IconBadge $gradient={v.badgeGradient}>
            <HouseIcon size={36} />
          </IconBadge>

          <BrandName>{APP_NAME}</BrandName>
          <BrandTitle>Your flat,<br />managed together.</BrandTitle>
          <BrandSub>Expenses, meals, cook ledger, contributions — all in one place.</BrandSub>

          <MobileChips>
            {CHIPS.map(c => (
              <MobileChip key={c.label}>
                <span style={{ fontSize: 13 }}>{c.icon}</span>
                {c.label}
              </MobileChip>
            ))}
          </MobileChips>

          <Divider />

          {/* Funny quote — unique per screen */}
          <QuoteBlock>
            <QuoteText>{v.quote}</QuoteText>
            <QuoteAuthor>{v.quoteAuthor}</QuoteAuthor>
          </QuoteBlock>

          <div style={{ marginTop: 20 }}>
            <FeatureList>
              {FEATURES.map((f, i) => (
                <FeatureItem key={f.label} $delay={600 + i * 65}>
                  <FeatureIcon>{f.icon}</FeatureIcon>
                  {f.label}
                </FeatureItem>
              ))}
            </FeatureList>
          </div>
        </BrandTop>

        <BrandFooter>
          <FooterCopy>© {new Date().getFullYear()} {APP_NAME}</FooterCopy>
          <FooterLove>Made with <span className="heart">❤️</span> by Jimmy</FooterLove>
        </BrandFooter>
      </BrandPanel>

      {/* ── Right form panel ── */}
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
          <CardLogo>
            <CardLogoBadge $gradient={v.badgeGradient} $glow={`${v.accent}55`}>
              <HouseIcon size={30} />
            </CardLogoBadge>
            <CardLogoText>
              <CardLogoName>{APP_NAME}</CardLogoName>
              <CardLogoTagline>{v.tagline}</CardLogoTagline>
            </CardLogoText>
          </CardLogo>

          <FormHeading>
            <FormEyebrow $colors={EYEBROW_GRADIENTS[variant]}>
              {eyebrow ?? APP_NAME}
            </FormEyebrow>
            <FormTitle>{title}</FormTitle>
            <FormSubtitle>{subtitle}</FormSubtitle>
          </FormHeading>

          <FormBody>{children}</FormBody>
        </FormCard>
      </FormPanel>
    </Page>
  )
}
