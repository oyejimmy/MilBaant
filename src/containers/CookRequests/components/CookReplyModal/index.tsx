import { Modal, Form, Select, Input, Typography, Card, Flex } from "antd";
import { CommentOutlined } from "@ant-design/icons";
import type { CookRequest } from "@/lib/types";
import type { ReplyFormValues } from "../../types";
import { STATUS_OPTIONS } from "../../types";
import { formatRelative } from "../helpers";

interface CookReplyModalProps {
  request: CookRequest;
  open: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (status: string, comment: string) => void;
}

export function CookReplyModal({
  request,
  open,
  submitting,
  onClose,
  onSubmit,
}: CookReplyModalProps) {
  const [form] = Form.useForm<ReplyFormValues>();

  const handleOk = () => {
    form.validateFields().then((values) => {
      onSubmit(values.status, values.cook_comment);
    });
  };

  return (
    <Modal
      centered
      open={open}
      title={
        <Flex align="center" gap={8}>
          <CommentOutlined style={{ color: "#f97316" }} />
          <span>Reply to Request</span>
        </Flex>
      }
      okText="Save Reply"
      okButtonProps={{
        style: { background: "#f97316", borderColor: "#f97316" },
      }}
      confirmLoading={submitting}
      onCancel={onClose}
      onOk={handleOk}
      width="min(460px, 95vw)"
    >
      <Card size="small" style={{ marginBottom: 16, marginTop: 8 }}>
        <Typography.Text
          type="secondary"
          style={{ fontSize: 11, textTransform: "uppercase" }}
        >
          Request
        </Typography.Text>
        <Typography.Title level={5} style={{ margin: "4px 0 0" }}>
          {request.item}
          {request.quantity && (
            <Typography.Text
              type="secondary"
              style={{ fontSize: 13, marginLeft: 8 }}
            >
              ({request.quantity})
            </Typography.Text>
          )}
        </Typography.Title>
        {request.note && (
          <Typography.Text
            type="secondary"
            style={{ fontSize: 12, display: "block", marginTop: 4 }}
          >
            Note: {request.note}
          </Typography.Text>
        )}
        <Typography.Text
          type="secondary"
          style={{ fontSize: 11, display: "block", marginTop: 4 }}
        >
          From: {request.requester?.full_name ?? "—"} ·{" "}
          {formatRelative(request.created_at)}
        </Typography.Text>
      </Card>

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          status: request.status,
          cook_comment: request.cook_comment ?? "",
        }}
      >
        <Form.Item
          label="Update Status"
          name="status"
          rules={[{ required: true }]}
        >
          <Select
            options={STATUS_OPTIONS.map((opt) => ({
              label: opt.label,
              value: opt.value,
            }))}
          />
        </Form.Item>
        <Form.Item
          label="Comment / Reason"
          name="cook_comment"
          rules={[
            {
              required: true,
              message: "Please leave a comment for the requester.",
            },
          ]}
        >
          <Input.TextArea
            rows={3}
            placeholder="e.g. Will bring tomorrow, Item not available today, Already bought, Not in budget…"
            maxLength={300}
            showCount
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
