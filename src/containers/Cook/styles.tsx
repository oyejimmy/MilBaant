import styled from "styled-components";
import { Typography } from "antd";

/* ───────────────────────── BALANCE ───────────────────────── */

export const BalanceCard = styled.div<{
  $status: "surplus" | "deficit" | "zero";
}>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;

  padding: 14px 16px;
  border-radius: 10px;

  border: 1px solid var(--card-border);
  background: var(--card-bg);

  border-left: 4px solid
    ${({ $status }) =>
      $status === "surplus"
        ? "#52c41a"
        : $status === "deficit"
          ? "#ff4d4f"
          : "#909ffa"};

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

export const BalanceAmount = styled.div<{
  $status: "surplus" | "deficit" | "zero";
}>`
  font-size: 2rem;
  font-weight: 800;

  color: ${({ $status }) =>
    $status === "surplus"
      ? "#52c41a"
      : $status === "deficit"
        ? "#ff4d4f"
        : "#909ffa"};
`;

/* ───────────────────────── CATEGORY ───────────────────────── */

export const CategoryCard = styled.div`
  padding: 10px;
  border-radius: 10px;
  border: 1px solid var(--card-border);
  background: var(--content-bg);
  text-align: center;
`;

/* ───────────────────────── SECTION ───────────────────────── */

export const SectionTitle = styled(Typography.Title)`
  && {
    margin: 0;
    font-size: 1rem;
    color: var(--text-strong);
  }
`;

/* ───────────────────────── MODALS ───────────────────────── */

export const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 16px 0;
`;

export const HeaderIcon = styled.div<{
  $gradient: string;
  $shadow: string;
}>`
  width: 38px;
  height: 38px;

  border-radius: 10px;
  background: ${({ $gradient }) => $gradient};

  display: flex;
  align-items: center;
  justify-content: center;

  box-shadow: ${({ $shadow }) => $shadow};

  .anticon {
    color: white;
    font-size: 16px;
  }
`;

export const FormBody = styled.div`
  padding: 12px 16px 0;
`;

export const TwoCol = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

export const SectionDivider = styled.div`
  height: 1px;
  background: var(--border-light);
  margin: 10px 0;
`;

export const SectionLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;

  .anticon {
    color: var(--primary);
    font-size: 12px;
  }
`;
