import styled from "styled-components";

export const MemberBalanceCard = styled.div<{
  $status: "surplus" | "deficit" | "zero";
}>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
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
`;

export const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 24px 0;
`;

export const HeaderIcon = styled.div<{ $gradient: string; $shadow: string }>`
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: ${({ $gradient }) => $gradient};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: ${({ $shadow }) => $shadow};
  .anticon {
    color: white;
    font-size: 18px;
  }
`;

export const FormBody = styled.div`
  padding: 16px 24px 0;
`;

export const TwoCol = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

export const SectionLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
  .anticon {
    color: var(--primary);
    font-size: 13px;
  }
`;

export const PrintWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;
