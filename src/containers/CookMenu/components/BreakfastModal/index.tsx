import { Modal, Button, Form, Switch, Select } from "antd";
import { ModalFooter, ModalTitle, SwitchRow } from "../styles";
import type { BreakfastPref } from "../../types";

const EGG_OPTIONS = [
  { label: "🍳 Fried", value: "fried" },
  { label: "🥚 Boiled", value: "boiled" },
  { label: "🫕 Omelette", value: "omelette" },
  { label: "✗ None", value: "none" },
];

interface BreakfastModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (values: BreakfastPref) => Promise<void>;
  isLoading: boolean;
  targetUserId: string | null;
  targetUserName?: string;
  currentUserId?: string;
  initialPref?: BreakfastPref;
}

export function BreakfastModal({
  open,
  onClose,
  onSave,
  isLoading,
  targetUserId,
  targetUserName,
  currentUserId,
  initialPref,
}: BreakfastModalProps) {
  const [form] = Form.useForm();

  const handleSave = async () => {
    const values = form.getFieldsValue() as BreakfastPref;
    await onSave(values);
  };

  const handleOpen = () => {
    if (initialPref) {
      form.setFieldsValue(initialPref);
    }
  };

  const title =
    targetUserId === currentUserId ? "My Preference" : targetUserName || "";

  return (
    <Modal
      open={open}
      title={<ModalTitle>Breakfast — {title}</ModalTitle>}
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
      width="min(360px, 95vw)"
      style={{ top: 80 }}
      styles={{ body: { paddingTop: 12 } }}
    >
      <Form form={form} layout="vertical" requiredMark={false}>
        <SwitchRow>
          <Form.Item name="paratha" valuePropName="checked" label="Paratha">
            <Switch size="small" checkedChildren="Yes" unCheckedChildren="No" />
          </Form.Item>
          <Form.Item name="sadaRoti" valuePropName="checked" label="Sada Roti">
            <Switch size="small" checkedChildren="Yes" unCheckedChildren="No" />
          </Form.Item>
          <Form.Item name="tea" valuePropName="checked" label="Tea">
            <Switch size="small" checkedChildren="Yes" unCheckedChildren="No" />
          </Form.Item>
        </SwitchRow>
        <Form.Item name="egg" label="Egg" style={{ marginBottom: 0 }}>
          <Select options={EGG_OPTIONS} style={{ width: "100%" }} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
