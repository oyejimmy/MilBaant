import { Modal } from "antd";
import styled from "styled-components";

export const StyledModal = styled(Modal)`
  .ant-modal-content {
    background: var(--modal-bg, #ffffff);
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  }
`;
