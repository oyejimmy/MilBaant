import { Form, Input, Card, Flex } from "antd";
import { UserOutlined, PhoneOutlined, EditOutlined } from "@ant-design/icons";

interface ProfileFormProps {
  form: any;
  editing: boolean;
}

export function ProfileForm({ form, editing }: ProfileFormProps) {
  if (!editing) return null;

  return (
    <Card
      title={
        <Flex align="center" gap={8}>
          <EditOutlined />
          <span>Edit Information</span>
        </Flex>
      }
      style={{ marginBottom: 16 }}
    >
      <Form form={form} layout="vertical" requiredMark={false}>
        <Form.Item
          label="Full Name"
          name="full_name"
          rules={[{ required: true, message: "Name is required." }]}
        >
          <Input
            prefix={<UserOutlined style={{ color: "var(--text-muted)" }} />}
            placeholder="Your full name"
            size="large"
          />
        </Form.Item>

        <Form.Item label="Phone Number" name="phone">
          <Input
            prefix={<PhoneOutlined style={{ color: "var(--text-muted)" }} />}
            placeholder="+92 300 0000000"
            size="large"
          />
        </Form.Item>

        <Form.Item label="Bio" name="bio" style={{ marginBottom: 0 }}>
          <Input.TextArea
            placeholder="A short bio about yourself…"
            rows={3}
            maxLength={200}
            showCount
            style={{ resize: "none" }}
          />
        </Form.Item>
      </Form>
    </Card>
  );
}
