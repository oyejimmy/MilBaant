import {
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Row,
  Col,
  Alert,
  Flex,
} from "antd";
import {
  UserAddOutlined,
  UserOutlined,
  MailOutlined,
  LockOutlined,
} from "@ant-design/icons";
import { ROLE_OPTIONS } from "@/lib/constants";
import type { Role } from "@/lib/types";
import type { AddUserFormValues } from "../../types";

interface AddUserModalProps {
  open: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (values: AddUserFormValues) => Promise<void>;
}

export function AddUserModal({
  open,
  submitting,
  onClose,
  onSubmit,
}: AddUserModalProps) {
  const [form] = Form.useForm<AddUserFormValues>();

  const handleOk = async () => {
    const values = await form.validateFields();
    await onSubmit(values);
    form.resetFields();
  };

  return (
    <Modal
      open={open}
      title={
        <Flex align="center" gap={8}>
          <UserAddOutlined style={{ color: "var(--primary)" }} />
          <span>Add New Flatmate</span>
        </Flex>
      }
      okText="Create Account"
      confirmLoading={submitting}
      onCancel={onClose}
      onOk={handleOk}
      width="min(460px, 95vw)"
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16, marginTop: 8 }}
        title="Make sure email confirmation is disabled in Supabase Auth settings for instant access."
      />
      <Form
        form={form}
        layout="vertical"
        initialValues={{ role: "user", canAddExpenses: false }}
      >
        <Form.Item
          label="Full Name"
          name="fullName"
          rules={[{ required: true, message: "Enter full name." }]}
        >
          <Input
            prefix={<UserOutlined style={{ color: "var(--text-muted)" }} />}
            placeholder="Enter full name"
          />
        </Form.Item>
        <Form.Item
          label="Email Address"
          name="email"
          rules={[
            { required: true, message: "Enter email." },
            { type: "email", message: "Enter a valid email." },
          ]}
        >
          <Input
            prefix={<MailOutlined style={{ color: "var(--text-muted)" }} />}
            placeholder="Enter email address"
          />
        </Form.Item>
        <Form.Item
          label="Password"
          name="password"
          rules={[
            { required: true, message: "Enter password." },
            { min: 6, message: "Password must be at least 6 characters." },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined style={{ color: "var(--text-muted)" }} />}
            placeholder="Minimum 6 characters"
          />
        </Form.Item>
        <Row gutter={12}>
          <Col xs={24} sm={12}>
            <Form.Item label="Role" name="role" rules={[{ required: true }]}>
              <Select options={ROLE_OPTIONS} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Can Add Expenses"
              name="canAddExpenses"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}
