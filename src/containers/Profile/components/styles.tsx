import styled, { keyframes } from "styled-components";

export const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
`;

export const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.6; }
`;

/* ── Page ── */
export const PageWrap = styled.div`
  animation: ${fadeUp} 0.25s ease;
  width: 100%;
`;

/* ── Employee Card shell ── */
export const EmployeeCard = styled.div`
  display: flex;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid var(--sidebar-border);
  background: var(--card-bg);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  width: 100%;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

/* ── Left photo panel ── */
export const PhotoPanel = styled.div<{ $color: string }>`
  width: 240px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 20px 28px;
  position: relative;
  background: ${({ $color }) => $color};

  &::before {
    content: "";
    position: absolute;
    bottom: 0;
    right: 0;
    width: 100px;
    height: 100px;
    background: rgba(255, 255, 255, 0.06);
    border-radius: 100px 0 0 0;
  }

  @media (max-width: 768px) {
    width: 100%;
    padding: 24px 20px 20px;
    flex-direction: row;
    gap: 16px;
    align-items: center;
    &::before { display: none; }
  }
`;

export const PhotoFrame = styled.div`
  position: relative;
  margin-bottom: 16px;
  flex-shrink: 0;

  @media (max-width: 768px) {
    margin-bottom: 0;
  }
`;

export const PhotoImg = styled.img`
  width: 180px;
  height: 180px;
  border-radius: 16px;
  object-fit: cover;
  border: none;
  display: block;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);

  @media (max-width: 768px) {
    width: 80px;
    height: 80px;
    border-radius: 12px;
  }
`;

export const PhotoInitials = styled.div<{ $size?: number }>`
  width: ${({ $size }) => $size ?? 180}px;
  height: ${({ $size }) => $size ?? 180}px;
  border-radius: 16px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ $size }) => (($size ?? 180) * 0.32)}px;
  font-weight: 800;
  color: #fff;
  background: rgba(255, 255, 255, 0.18);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  letter-spacing: 2px;
`;

export const CameraBtn = styled.button`
  position: absolute;
  bottom: 6px;
  right: 6px;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.55);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: transform 0.15s ease, background 0.15s ease;
  color: #fff;
  font-size: 14px;

  &:hover {
    transform: scale(1.1);
    background: rgba(0, 0, 0, 0.75);
  }
`;

export const PhotoName = styled.div`
  font-size: 1.05rem;
  font-weight: 700;
  color: #fff;
  text-align: center;
  line-height: 1.3;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);

  @media (max-width: 768px) {
    text-align: left;
    font-size: 1rem;
  }
`;

export const PhotoRole = styled.div`
  margin-top: 6px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.8);
  text-align: center;

  @media (max-width: 768px) {
    text-align: left;
  }
`;

export const PhotoStatusDot = styled.div<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-top: 10px;
  padding: 4px 10px;
  border-radius: 20px;
  background: ${({ $active }) =>
    $active ? "rgba(82, 196, 26, 0.22)" : "rgba(255, 77, 79, 0.22)"};
  border: 1px solid ${({ $active }) =>
    $active ? "rgba(82, 196, 26, 0.5)" : "rgba(255, 77, 79, 0.5)"};
  font-size: 11px;
  font-weight: 700;
  color: ${({ $active }) => ($active ? "#b7eb8f" : "#ffccc7")};

  &::before {
    content: "";
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: ${({ $active }) => ($active ? "#52c41a" : "#ff4d4f")};
    flex-shrink: 0;
  }
`;

export const PhotoDivider = styled.div`
  width: 40px;
  height: 2px;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 2px;
  margin: 16px 0 12px;

  @media (max-width: 768px) {
    display: none;
  }
`;

export const PhotoMetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
  text-align: center;

  @media (max-width: 768px) {
    display: none;
  }
`;

/* ── Right info panel ── */
export const InfoPanel = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: 24px 28px 22px;
  background: var(--card-bg);

  @media (max-width: 768px) {
    padding: 18px 16px 18px;
  }
`;

export const InfoHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
  gap: 12px;

  @media (max-width: 480px) {
    flex-direction: column;
  }
`;

export const InfoTitle = styled.div`
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--text-strong);
  line-height: 1.2;
`;

export const InfoSubtitle = styled.div`
  font-size: 0.82rem;
  color: var(--text-muted);
  margin-top: 3px;
`;

/* ── Info rows ── */
export const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
    gap: 12px;
  }
`;

export const InfoField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const FieldLabel = styled.div`
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--text-muted);
`;

export const FieldValue = styled.div`
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-strong);
  line-height: 1.4;
`;

export const FieldEmpty = styled.div`
  font-size: 0.88rem;
  color: var(--text-disabled, #bbb);
  font-style: italic;
`;

/* ── Section divider ── */
export const SectionDivider = styled.div`
  border-top: 1px solid var(--sidebar-border);
  margin: 20px 0;
`;

export const SectionLabel = styled.div`
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-muted);
  margin-bottom: 14px;
`;

/* ── Permission chips ── */
export const PermissionsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

export const PermChip = styled.div<{ $on: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 11.5px;
  font-weight: 600;
  background: ${({ $on }) =>
    $on ? "rgba(82,196,26,0.1)" : "rgba(0,0,0,0.04)"};
  color: ${({ $on }) => ($on ? "#389e0d" : "var(--text-muted)")};
  border: 1px solid ${({ $on }) =>
    $on ? "rgba(82,196,26,0.3)" : "var(--sidebar-border)"};
`;

/* ── Avatar upload legacy (reused) ── */
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
      return `background: rgba(76,175,80,0.12); color: var(--success);`;
    if ($variant === "info")
      return `background: var(--primary-soft); color: var(--primary);`;
    return `background: rgba(249,168,37,0.12); color: var(--warning);`;
  }}
`;

export const DragHint = styled.div`
  padding: 12px 16px;
  border-radius: 10px;
  border: 2px dashed var(--primary);
  background: var(--primary-soft);
  text-align: center;
`;
