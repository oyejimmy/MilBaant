import { Modal, Image } from "antd";

interface ImagePreviewModalProps {
  open: boolean;
  imageUrl: string;
  onClose: () => void;
}

export function ImagePreviewModal({
  open,
  imageUrl,
  onClose,
}: ImagePreviewModalProps) {
  return (
    <Modal
      centered
      open={open}
      title="Payment Screenshot"
      footer={null}
      onCancel={onClose}
      width={700}
    >
      <Image
        alt="Payment proof"
        style={{ width: "100%" }}
        src={imageUrl}
        preview={false}
      />
    </Modal>
  );
}
