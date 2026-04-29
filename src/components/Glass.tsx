import styled from 'styled-components'

/* ─── Page wrapper ────────────────────────────────────────────────────────── */
export const PageStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 24px;

  @media (min-width: 768px) {
    gap: 20px;
    padding-bottom: 0;
  }
`

/* ─── Section card ────────────────────────────────────────────────────────── */
export const SectionBlock = styled.div`
  background: var(--card-bg);
  border-radius: 12px;
  padding: 16px;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);

  @media (min-width: 768px) {
    padding: 20px 24px;
    border-radius: 14px;
  }
`

/* ─── Page header intro block ─────────────────────────────────────────────── */
export const PageIntro = styled.div`
  background: transparent;
  padding: 0;
`

/* ─── Generic panel ───────────────────────────────────────────────────────── */
export const GlassPanel = styled.div`
  background: var(--card-bg);
  border-radius: 12px;
`

/* ─── Typography ──────────────────────────────────────────────────────────── */
export const PageTitle = styled.h1`
  margin: 0;
  font-size: clamp(1.3rem, 5vw, 1.8rem);
  line-height: 1.15;
  font-family: "Plus Jakarta Sans", sans-serif;
  font-weight: 700;
  color: var(--text-strong);
`

export const PageSubtitle = styled.p`
  margin: 0;
  color: var(--text-muted);
  font-size: clamp(0.8rem, 3vw, 0.875rem);
  max-width: 720px;
  line-height: 1.5;
`

/* ─── Stat grid ───────────────────────────────────────────────────────────── */
export const ResponsiveGrid = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));

  @media (max-width: 480px) {
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  @media (max-width: 320px) {
    grid-template-columns: 1fr;
  }
`

/* ─── Actions row ─────────────────────────────────────────────────────────── */
export const ActionsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: flex-start;
  justify-content: space-between;

  @media (max-width: 767px) {
    flex-direction: column;
    gap: 12px;

    > * { width: 100%; }

    .ant-space { width: 100%; }
    .ant-space-item { width: 100%; }
    .ant-btn, .ant-picker { width: 100% !important; }
  }
`

/* ─── Mobile card primitives ──────────────────────────────────────────────── */
export const MobileCard = styled.div`
  border-radius: 10px;
  padding: 12px 14px;
  background: var(--card-bg);
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: opacity 0.15s ease;

  &:active { opacity: 0.75; }
`

export const MobileRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`

export const MobileLabel = styled.span`
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`
