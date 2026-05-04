import styled, { keyframes, css } from 'styled-components'

export const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
`

export const shimmer = keyframes`
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
`

export const stagger = (delay: number) => css`
  opacity: 0;
  animation: ${fadeUp} 0.55s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms forwards;
`

export const FormFooter = styled.div<{ $stagger?: number }>`
  margin-top: 18px; text-align: center; font-size: 13px; color: var(--text-muted);
  ${p => p.$stagger ? stagger(p.$stagger) : stagger(320)}
  a { color: #1c8ee5; font-weight: 600; text-decoration: none; &:hover { text-decoration: underline; } }
`
