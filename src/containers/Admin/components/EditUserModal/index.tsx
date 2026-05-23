import {
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Row,
  Col,
  Avatar,
  Flex,
} from "antd";
import { UserOutlined } from "@ant-design/icons";
import { ROLE_OPTIONS } from "@/lib/constants";
import type { Profile, Role } from "@/lib/types";
import type { EditUserFormValues } from "../../types";
import { avatarColor, initials } from "../../helpers";

interface EditUserModalProps {
  profile: Profile;
  open: boolean;
  submitting: boolean;
  onClose: () => void;
  onSave: (profile: Profile, name: string) => Promise<void>;
  onRoleChange: (profile: Profile, role: Role) => Promise<void>;
  onPermissionChange: (profile: Profile, can: boolean) => Promise<void>;
}

export function EditUserModal({
  profile,
  open,
  submitting,
  onClose,
  onSave,
  onRoleChange,
  onPermissionChange,
}: EditUserModalProps) {
  const [form] = Form.useForm<EditUserFormValues>();

  const handleOk = async () => {
    const values = await form.validateFields();
    await onSave(profile, values.fullName);
    await onRoleChange({ ...profile, full_name: values.fullName }, values.role);
    await onPermissionChange(profile, values.canAddExpenses);
  };

  return (
    <Modal
      open={open}
      title={
        <Flex align="center" gap={8}>
          <Avatar
            size={28}
            style={{
              background: avatarColor(profile.full_name),
              color: "#fff",
              fontWeight: 700,
              fontSize: 11,
            }}
          >
            {initials(profile.full_name)}
          </Avatar>
          <span>Edit {profile.full_name}</span>
        </Flex>
      }
      okText="Save Changes"
      confirmLoading={submitting}
      onCancel={onClose}
      onOk={handleOk}
      width="min(400px, 95vw)"
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          fullName: profile.full_name,
          role: profile.role,
          canAddExpenses: profile.can_add_expenses,
        }}
        style={{ paddingTop: 8 }}
      >
        <Form.Item
          label="Full Name"
          name="fullName"
          rules={[{ required: true, message: "Name is required." }]}
        >
          <Input
            prefix={<UserOutlined style={{ color: "var(--text-muted)" }} />}
          />
        </Form.Item>
        <Row gutter={12}>
          <Col xs={24} sm={12}>
            <Form.Item label="Role" name="role">
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
