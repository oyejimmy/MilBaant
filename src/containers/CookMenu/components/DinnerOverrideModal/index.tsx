import { Modal, Button, Form, Input, Tag } from "antd";
import { ModalFooter, ModalTitle, FixedMenuHint } from "../styles";

interface DinnerOverrideModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (values: {
    dinner: string;
    dinnerDescription: string;
  }) => Promise<void>;
  isLoading: boolean;
  todayDay: string;
  fixedDinner: string;
  initialDinner?: string;
  initialDescription?: string;
}

export function DinnerOverrideModal({
  open,
  onClose,
  onSave,
  isLoading,
  todayDay,
  fixedDinner,
  initialDinner = "",
  initialDescription = "",
}: DinnerOverrideModalProps) {
  const [form] = Form.useForm();

  const handleSave = async () => {
    const values = form.getFieldsValue() as {
      dinner: string | undefined;
      dinnerDescription: string | undefined;
    };
    await onSave({
      dinner: values.dinner?.trim() ?? "",
      dinnerDescription: values.dinnerDescription?.trim() ?? "",
    });
  };

  const handleOpen = () => {
    form.setFieldsValue({
      dinner: initialDinner,
      dinnerDescription: initialDescription,
    });
  };

  return (
    <Modal
      open={open}
      title={<ModalTitle>Change Tonight&apos;s Dinner</ModalTitle>}
      footer={
        <ModalFooter>
          <Button size="small" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="small"
            type="primary"
            loading={isLoading}
            onClick={handleSave}
          >
            Save
          </Button>
        </ModalFooter>
      }
      onCancel={onClose}
      afterOpenChange={(isOpen) => isOpen && handleOpen()}
      width="min(400px, 95vw)"
      style={{ top: 80 }}
      styles={{ body: { paddingTop: 12 } }}
    >
      <FixedMenuHint>
        Fixed menu for {todayDay}:{" "}
        <Tag color="magenta">
          <strong>{fixedDinner}</strong>
        </Tag>
      </FixedMenuHint>
      <Form form={form} layout="vertical" requiredMark={false}>
        <Form.Item
          name="dinner"
          label="Override with"
          style={{ marginBottom: 12 }}
        >
          <Input placeholder={fixedDinner} allowClear autoFocus />
        </Form.Item>
        <Form.Item name="dinnerDescription" label="Description (optional)">
          <Input.TextArea
            placeholder="e.g. Boneless chicken, extra spicy, served with naan"
            rows={3}
            maxLength={200}
            showCount
            style={{ resize: "none" }}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
