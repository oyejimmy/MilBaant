import styled from 'styled-components'

export const PageStack = styled.div`
  display: grid;
  gap: 24px;
`

export const SectionBlock = styled.div`
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 7px;
  padding: 16px;

  @media (min-width: 768px) {
    padding: 20px 22px;
  }
`

export const PageIntro = styled.div`
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 7px;
  padding: 16px;

  @media (min-width: 768px) {
    padding: 20px 24px;
  }
`

export const GlassPanel = styled.div`
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 7px;
`

export const PageTitle = styled.h1`
  margin: 0;
  font-size: clamp(1.4rem, 2.2vw, 1.9rem);
  line-height: 1.15;
  font-family: "Plus Jakarta Sans", sans-serif;
  font-weight: 700;
  color: var(--text-strong);
`

export const PageSubtitle = styled.p`
  margin: 0;
  color: var(--text-muted);
  font-size: 0.9rem;
  max-width: 720px;
`

export const ResponsiveGrid = styled.div`
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));

  @media (max-width: 480px) {
    grid-template-columns: 1fr 1fr;
  }
`

export const ActionsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
`
