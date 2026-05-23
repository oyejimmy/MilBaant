import { Modal, Form, Input, Typography, Flex } from "antd";
import { InboxOutlined, MessageOutlined } from "@ant-design/icons";
import type { AddRequestFormValues } from "../../types";

interface AddRequestModalProps {
  open: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (values: AddRequestFormValues) => Promise<void>;
}

export function AddRequestModal({
  open,
  submitting,
  onClose,
  onSubmit,
}: AddRequestModalProps) {
  const [form] = Form.useForm<AddRequestFormValues>();

  const handleOk = async () => {
    const values = await form.validateFields();
    await onSubmit(values);
    form.resetFields();
  };

  return (
    <Modal
      centered
      open={open}
      title={
        <Flex align="center" gap={12}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #e65100 0%, #ff7043 100%)",
            }}
          >
            <InboxOutlined style={{ color: "#fff", fontSize: 18 }} />
          </div>
          <div>
            <Typography.Title level={5} style={{ margin: 0 }}>
              Request Item from Cook
            </Typography.Title>
            <Typography.Text
              style={{ fontSize: 12, color: "var(--text-muted)" }}
            >
              Ask the cook to buy or prepare something
            </Typography.Text>
          </div>
        </Flex>
      }
      okText="Submit Request"
      confirmLoading={submitting}
      onCancel={onClose}
      onOk={handleOk}
      width="min(460px, 95vw)"
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          label="Item Name"
          name="item"
          rules={[{ required: true, message: "Please enter the item name." }]}
        >
          <Input
            placeholder="e.g. Chicken, Tomatoes, Bread, Eggs"
            size="large"
          />
        </Form.Item>

        <Form.Item label="Quantity (optional)" name="quantity">
          <Input placeholder="e.g. 2 kg, 1 dozen, 500g" size="large" />
        </Form.Item>

        <Form.Item
          label={
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <MessageOutlined
                style={{ color: "var(--primary)", fontSize: 12 }}
              />
              Note (optional)
            </span>
          }
          name="note"
        >
          <Input.TextArea
            rows={2}
            placeholder="Any special instructions or context…"
            maxLength={200}
            showCount
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
