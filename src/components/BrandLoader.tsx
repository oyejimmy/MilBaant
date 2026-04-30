import styled, { keyframes, css } from 'styled-components'

/* ── Animations ─────────────────────────────────────────────────────────── */

const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`

const fadeOut = keyframes`
  from { opacity: 1; }
  to   { opacity: 0; }
`

const pulse = keyframes`
  0%, 100% { transform: scale(1);    opacity: 1; }
  50%       { transform: scale(1.08); opacity: 0.85; }
`

const ringExpand = keyframes`
  0%   { transform: scale(0.75); opacity: 0.6; }
  100% { transform: scale(1.55); opacity: 0; }
`

const dotPulse = keyframes`
  0%, 80%, 100% { transform: scale(0.5); opacity: 0.3; }
  40%            { transform: scale(1);   opacity: 1; }
`

/* ── Layout ─────────────────────────────────────────────────────────────── */

const Overlay = styled.div<{ $hiding: boolean }>`
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 28px;
  background: var(--app-bg);
  z-index: 9999;
  animation: ${fadeIn} 0.2s ease forwards;
  ${p => p.$hiding && css`
    animation: ${fadeOut} 0.35s ease forwards;
    pointer-events: none;
  `}
`

/* ── Icon wrapper — holds the icon + ripple rings ───────────────────────── */

const IconWrap = styled.div`
  position: relative;
  width: 96px;
  height: 96px;
  display: flex;
  align-items: center;
  justify-content: center;
`

/* Ripple ring — two staggered expanding circles */
const Ring = styled.div<{ $delay: number }>`
  position: absolute;
  inset: 0;
  border-radius: 28px;
  border: 2px solid rgba(28, 142, 229, 0.45);
  animation: ${ringExpand} 2s ease-out ${p => p.$delay}s infinite;
  [data-theme='dark'] & {
    border-color: rgba(73, 165, 234, 0.4);
  }
`

/* The icon badge itself */
const Badge = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 22px;
  background: linear-gradient(145deg, #1465a3 0%, #1c8ee5 55%, #49a5ea 100%);
  box-shadow:
    0 2px 0 rgba(255, 255, 255, 0.18) inset,
    0 -2px 0 rgba(0, 0, 0, 0.15) inset,
    0 8px 28px rgba(28, 142, 229, 0.45),
    0 2px 8px rgba(0, 0, 0, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: ${pulse} 2.4s ease-in-out infinite;
  position: relative;
  z-index: 1;
`

/* ── Dots ────────────────────────────────────────────────────────────────── */

const Dots = styled.div`
  display: flex;
  gap: 7px;
`

const Dot = styled.div<{ $delay: number }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #1c8ee5;
  animation: ${dotPulse} 1.3s ease-in-out ${p => p.$delay}s infinite;
  [data-theme='dark'] & { background: #49a5ea; }
`

/* ── House SVG icon (inline, no network request) ────────────────────────── */

function HouseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width="52"
      height="52"
      aria-hidden="true"
    >
      {/* Roof */}
      <polygon
        points="256,100 390,230 122,230"
        fill="rgba(255,255,255,0.95)"
      />
      {/* Roof ridge */}
      <polygon
        points="256,100 390,230 370,230 256,128 142,230 122,230"
        fill="rgba(255,255,255,0.18)"
      />
      {/* Body */}
      <rect x="152" y="228" width="208" height="168" rx="10" fill="rgba(255,255,255,0.92)" />
      {/* Door */}
      <rect x="220" y="310" width="72" height="86" rx="36" fill="rgba(20,101,163,0.55)" />
      {/* Door knob */}
      <circle cx="284" cy="356" r="6" fill="rgba(255,255,255,0.75)" />
      {/* Left window */}
      <rect x="168" y="258" width="52" height="44" rx="8" fill="rgba(20,101,163,0.4)" />
      <line x1="194" y1="258" x2="194" y2="302" stroke="rgba(255,255,255,0.55)" strokeWidth="3" />
      <line x1="168" y1="280" x2="220" y2="280" stroke="rgba(255,255,255,0.55)" strokeWidth="3" />
      {/* Right window */}
      <rect x="292" y="258" width="52" height="44" rx="8" fill="rgba(20,101,163,0.4)" />
      <line x1="318" y1="258" x2="318" y2="302" stroke="rgba(255,255,255,0.55)" strokeWidth="3" />
      <line x1="292" y1="280" x2="344" y2="280" stroke="rgba(255,255,255,0.55)" strokeWidth="3" />
      {/* Community dots */}
      <circle cx="216" cy="430" r="14" fill="rgba(255,255,255,0.30)" />
      <circle cx="256" cy="430" r="14" fill="rgba(255,255,255,0.50)" />
      <circle cx="296" cy="430" r="14" fill="rgba(255,255,255,0.30)" />
    </svg>
  )
}

/* ── Exported component ─────────────────────────────────────────────────── */

interface BrandLoaderProps {
  hiding?: boolean
}

export function BrandLoader({ hiding = false }: BrandLoaderProps) {
  return (
    <Overlay $hiding={hiding}>
      <IconWrap>
        <Ring $delay={0} />
        <Ring $delay={1} />
        <Badge>
          <HouseIcon />
        </Badge>
      </IconWrap>

      <Dots>
        <Dot $delay={0} />
        <Dot $delay={0.18} />
        <Dot $delay={0.36} />
      </Dots>
    </Overlay>
  )
}
