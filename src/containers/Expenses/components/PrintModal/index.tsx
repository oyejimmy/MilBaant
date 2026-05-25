import { Modal, Flex, Typography, Button } from "antd";
import { DownloadOutlined } from "@ant-design/icons";

interface PrintModalProps {
  open: boolean;
  capturing: boolean;
  printImageUrl: string | null;
  onClose: () => void;
  onSave: () => void;
}

export function PrintModal({
  open,
  capturing,
  printImageUrl,
  onClose,
  onSave,
}: PrintModalProps) {
  return (
    <Modal
      centered
      open={open}
      title=""
      closable={false}
      onCancel={onClose}
      footer={
        <Flex justify="flex-end" gap={8}>
          <Button onClick={onClose}>Close</Button>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            disabled={!printImageUrl}
            onClick={onSave}
          >
            Save Image
          </Button>
        </Flex>
      }
      width="min(780px, 95vw)"
    >
      {capturing || !printImageUrl ? (
        <Flex justify="center" align="center" style={{ height: 200 }}>
          <Typography.Text type="secondary">Generating image…</Typography.Text>
        </Flex>
      ) : (
        <img
          src={printImageUrl}
          alt="Fixed expenses"
          style={{
            width: "100%",
            borderRadius: 8,
            border: "1px solid #f0f0f0",
          }}
        />
      )}
    </Modal>
  );
}
