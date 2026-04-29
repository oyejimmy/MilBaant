import styled from 'styled-components'

/* ── Styled ─────────────────────────────────────────────────────────────── */

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  z-index: 9999;
`

const LoaderImage = styled.img`
  width: clamp(120px, 30vw, 200px);
  height: clamp(120px, 30vw, 200px);
  object-fit: contain;
  
  @media (max-width: 768px) {
    width: clamp(100px, 25vw, 150px);
    height: clamp(100px, 25vw, 150px);
  }
`

/* ── Component ──────────────────────────────────────────────────────────── */

export function BrandLoader() {
  return (
    <Overlay>
      <LoaderImage src="/loader.gif" alt="Loading..." />
    </Overlay>
  )
}
