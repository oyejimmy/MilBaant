import styled, { keyframes, css } from 'styled-components'
import { APP_NAME } from '@/lib/constants'

/* ── Animations ──────────────────────────────────────────────────────────── */

const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`

const fadeOut = keyframes`
  from { opacity: 1; }
  to   { opacity: 0; }
`

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-9px); }
`

const haloExpand = keyframes`
  0%   { transform: scale(1);   opacity: 0.55; }
  100% { transform: scale(2.4); opacity: 0; }
`

const glowPulse = keyframes`
  0%, 100% { opacity: 0.18; transform: scale(1); }
  50%       { opacity: 0.32; transform: scale(1.15); }
`

const textReveal = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
`

const shimmerSweep = keyframes`
  0%   { background-position: -200% center; }
  100% { background-position: 200% center; }
`

/* ── Overlay ─────────────────────────────────────────────────────────────── */

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
  animation: ${fadeIn} 0.25s ease forwards;
  ${p => p.$hiding && css`
    animation: ${fadeOut} 0.35s ease forwards;
    pointer-events: none;
  `}
`

/* ── Logo area ───────────────────────────────────────────────────────────── */

const LogoWrap = styled.div`
  position: relative;
  width: 130px;
  height: 130px;
  display: flex;
  align-items: center;
  justify-content: center;
`

const AmbientGlow = styled.div`
  position: absolute;
  inset: -10px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(22,119,255,0.28) 0%, transparent 68%);
  animation: ${glowPulse} 2.8s ease-in-out infinite;
  filter: blur(10px);
`

const HaloRing = styled.div<{ $delay: number }>`
  position: absolute;
  inset: 18px;
  border-radius: 50%;
  border: 1.5px solid rgba(22, 119, 255, 0.5);
  animation: ${haloExpand} 2.6s ease-out ${p => p.$delay}s infinite;
`

const LogoBadge = styled.div`
  position: relative;
  z-index: 2;
  width: 74px;
  height: 74px;
  border-radius: 22px;
  background: linear-gradient(145deg, #1257a0 0%, #1677ff 55%, #06b6d4 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: ${float} 3.2s ease-in-out infinite;
  box-shadow:
    0 2px 0 rgba(255,255,255,0.22) inset,
    0 -2px 0 rgba(0,0,0,0.12) inset,
    0 14px 44px rgba(22,119,255,0.5),
    0 4px 14px rgba(0,0,0,0.22);
`

function HouseIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 12L12 3L21 12"
        stroke="rgba(255,255,255,0.96)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 10V20C5 20.55 5.45 21 6 21H10V15H14V21H18C18.55 21 19 20.55 19 20V10"
        stroke="rgba(255,255,255,0.96)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/* ── Brand text ──────────────────────────────────────────────────────────── */

const BrandBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  animation: ${textReveal} 0.55s ease 0.15s both;
`

const AppName = styled.div`
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.6px;
  background: linear-gradient(90deg, #1677ff 0%, #06b6d4 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.2;
`

const Tagline = styled.div`
  font-size: 12px;
  font-weight: 500;
  color: var(--text-muted);
  letter-spacing: 0.6px;
`

/* ── Shimmer progress bar ────────────────────────────────────────────────── */

const ProgressTrack = styled.div`
  width: 160px;
  height: 3px;
  background: rgba(22, 119, 255, 0.1);
  border-radius: 100px;
  overflow: hidden;
  animation: ${textReveal} 0.55s ease 0.3s both;
`

const ProgressFill = styled.div`
  height: 100%;
  border-radius: 100px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    #1677ff 35%,
    #06b6d4 65%,
    transparent 100%
  );
  background-size: 200% 100%;
  animation: ${shimmerSweep} 1.7s ease-in-out infinite;
`

/* ── Exported component ──────────────────────────────────────────────────── */

interface BrandLoaderProps {
  hiding?: boolean
}

export function BrandLoader({ hiding = false }: BrandLoaderProps) {
  return (
    <Overlay $hiding={hiding}>
      <LogoWrap>
        <AmbientGlow />
        <HaloRing $delay={0} />
        <HaloRing $delay={1.3} />
        <LogoBadge>
          <HouseIcon />
        </LogoBadge>
      </LogoWrap>

      <BrandBlock>
        <AppName>{APP_NAME}</AppName>
        <Tagline>Your flat, organised</Tagline>
      </BrandBlock>

      <ProgressTrack>
        <ProgressFill />
      </ProgressTrack>
    </Overlay>
  )
}
