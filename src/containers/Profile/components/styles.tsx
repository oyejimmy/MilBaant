import styled, { keyframes } from "styled-components";

export const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
`;

export const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.6; }
`;

export const PageWrap = styled.div`
  animation: ${fadeUp} 0.25s ease;
  max-width: 1200px;
  margin: 0 auto;
`;

export const AvatarWrap = styled.div`
  position: relative;
  display: inline-block;
  flex-shrink: 0;
`;

export const AvatarOverlay = styled.div`
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
  cursor: pointer;

  ${AvatarWrap}:hover & {
    opacity: 1;
  }
`;

export const UploadingPulse = styled.div`
  animation: ${pulse} 1.2s ease infinite;
`;

export const StatusIcon = styled.div<{
  $variant: "success" | "info" | "warning";
}>`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;

  ${({ $variant }) => {
    if ($variant === "success")
      return `
      background: rgba(76, 175, 80, 0.12);
      color: var(--success);
    `;
    if ($variant === "info")
      return `
      background: var(--primary-soft);
      color: var(--primary);
    `;
    return `
      background: rgba(249, 168, 37, 0.12);
      color: var(--warning);
    `;
  }}
`;

export const DragHint = styled.div`
  padding: 12px 16px;
  border-radius: 10px;
  border: 2px dashed var(--primary);
  background: var(--primary-soft);
  text-align: center;
`;
