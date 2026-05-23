import { useState } from "react";
import { App, Button, Form, Input, Modal, Typography } from "antd";
import { KeyOutlined } from "@ant-design/icons";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import styled from "styled-components";

const ModalTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

interface ResetPasswordModalProps {
  open: boolean;
  onClose: () => void;
}

export function ResetPasswordModal({ open, onClose }: ResetPasswordModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();
  const { email } = useAuth();

  async function handleSubmit(values: { newPassword: string }) {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: values.newPassword,
      });
      if (error) throw new Error(error.message);
      message.success("Password updated successfully!");
      form.resetFields();
      onClose();
    } catch (err) {
      message.error(
        err instanceof Error ? err.message : "Failed to update password.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      centered
      title={
        <ModalTitle>
          <KeyOutlined style={{ color: "var(--primary)" }} />
          <span>Reset Password</span>
        </ModalTitle>
      }
      onCancel={onClose}
      footer={null}
      width="min(420px, 95vw)"
      destroyOnHidden
    >
      {email && (
        <Typography.Text
          type="secondary"
          style={{ display: "block", marginBottom: 16, fontSize: 13 }}
        >
          Updating password for: <strong>{email}</strong>
        </Typography.Text>
      )}
      <Form
        form={form}
        layout="vertical"
        onFinish={(v) => void handleSubmit(v)}
      >
        <Form.Item
          label="New Password"
          name="newPassword"
          rules={[
            { required: true, message: "Please enter a new password" },
            { min: 6, message: "Password must be at least 6 characters" },
          ]}
        >
          <Input.Password placeholder="Enter new password" size="large" />
        </Form.Item>
        <Form.Item
          label="Confirm Password"
          name="confirmPassword"
          dependencies={["newPassword"]}
          rules={[
            { required: true, message: "Please confirm your password" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("newPassword") === value)
                  return Promise.resolve();
                return Promise.reject(new Error("Passwords do not match"));
              },
            }),
          ]}
        >
          <Input.Password placeholder="Confirm new password" size="large" />
        </Form.Item>
        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "flex-end",
            marginTop: 8,
          }}
        >
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            icon={<KeyOutlined />}
          >
            Update Password
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
