import { useState } from "react";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Typography,
  Button,
  Upload,
  Flex,
  Card,
  Divider,
} from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import {
  DollarOutlined,
  CalendarOutlined,
  PictureOutlined,
  UploadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useCreateContributionPayment } from "@/hooks/useContributions";
import { uploadPaymentScreenshot } from "@/lib/storage";
import type { PaymentSubmitFormValues } from "../../types";

interface PaymentSubmitModalProps {
  open: boolean;
  userId: string;
  userName: string;
  month: string;
  currentUserId: string;
  onClose: () => void;
  onSubmit: ReturnType<typeof useCreateContributionPayment>;
}

export function PaymentSubmitModal({
  open,
  userId,
  userName,
  month,
  currentUserId,
  onClose,
  onSubmit,
}: PaymentSubmitModalProps) {
  const [form] = Form.useForm<PaymentSubmitFormValues>();
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setUploading(true);

      let screenshotUrl: string | null = null;
      if (fileList.length > 0 && fileList[0].originFileObj) {
        screenshotUrl = await uploadPaymentScreenshot(
          userId,
          fileList[0].originFileObj,
        );
      }

      await onSubmit.mutateAsync({
        userId,
        month,
        amount: values.amount,
        paidAt: values.paidAt.format("YYYY-MM-DD"),
        screenshotUrl,
        note: values.note?.trim() || undefined,
        createdBy: currentUserId,
      });

      form.resetFields();
      setFileList([]);
      onClose();
    } catch (err) {
      // Error handled in parent
    } finally {
      setUploading(false);
    }
  };

  const hasFile = fileList.length > 0;

  return (
    <Modal
      centered
      open={open}
      title={
        <Flex align="center" gap={12}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #52c41a, #389e0d)",
            }}
          >
            <DollarOutlined style={{ color: "#fff", fontSize: 18 }} />
          </div>
          <div>
            <Typography.Title level={5} style={{ margin: 0 }}>
              Submit Payment
            </Typography.Title>
            <Typography.Text
              style={{ fontSize: 12, color: "var(--text-muted)" }}
            >
              {userName}
            </Typography.Text>
          </div>
        </Flex>
      }
      okText="Submit Payment"
      confirmLoading={uploading || onSubmit.isPending}
      onCancel={onClose}
      onOk={handleSubmit}
      width="min(500px, 95vw)"
    >
      <div style={{ padding: "16px 0" }}>
        <Card size="small" style={{ marginBottom: 16, textAlign: "center" }}>
          <Flex align="center" justify="center" gap={6}>
            <CalendarOutlined style={{ fontSize: 12 }} />
            <Typography.Text strong style={{ color: "#52c41a" }}>
              {dayjs(month, "YYYY-MM").format("MMMM YYYY")}
            </Typography.Text>
          </Flex>
        </Card>

        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          initialValues={{ paidAt: dayjs() }}
        >
          <Typography.Text
            strong
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 10,
            }}
          >
            <DollarOutlined /> Payment Details
          </Typography.Text>

          <Flex gap={12} wrap="wrap">
            <Form.Item
              label="Amount (PKR)"
              name="amount"
              rules={[{ required: true, message: "Please enter the amount" }]}
              style={{ flex: 1, marginBottom: 12 }}
            >
              <InputNumber
                min={1}
                precision={2}
                style={{ width: "100%" }}
                placeholder="e.g. 5000"
              />
            </Form.Item>

            <Form.Item
              label="Payment Date"
              name="paidAt"
              rules={[
                { required: true, message: "Please select payment date" },
              ]}
              style={{ flex: 1, marginBottom: 12 }}
            >
              <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
            </Form.Item>
          </Flex>

          <Divider style={{ margin: "14px 0" }} />

          <Typography.Text
            strong
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 10,
            }}
          >
            <PictureOutlined /> Screenshot{" "}
            <Typography.Text style={{ fontSize: 11, fontWeight: 400 }}>
              (optional)
            </Typography.Text>
          </Typography.Text>

          <Form.Item name="screenshot" style={{ marginBottom: 12 }}>
            <Upload
              listType="text"
              fileList={fileList}
              showUploadList={false}
              beforeUpload={(file) => {
                if (!file.type.startsWith("image/")) {
                  return false;
                }
                if (file.size / 1024 / 1024 > 5) {
                  return false;
                }
                setFileList([file]);
                return false;
              }}
              onRemove={() => setFileList([])}
              maxCount={1}
            >
              <div
                style={{
                  border: `1.5px dashed ${hasFile ? "#52c41a" : "var(--border-default)"}`,
                  borderRadius: 12,
                  padding: "14px 16px",
                  background: hasFile
                    ? "rgba(82,196,26,0.05)"
                    : "var(--bg-elevated)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: hasFile
                      ? "rgba(82,196,26,0.12)"
                      : "rgba(64,150,255,0.10)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {hasFile ? (
                    <CheckCircleOutlined style={{ color: "#52c41a" }} />
                  ) : (
                    <UploadOutlined style={{ color: "var(--primary)" }} />
                  )}
                </div>
                <div>
                  <Typography.Text strong style={{ display: "block" }}>
                    {hasFile ? fileList[0].name : "Upload screenshot"}
                  </Typography.Text>
                  <Typography.Text
                    style={{ fontSize: 12, color: "var(--text-muted)" }}
                  >
                    {hasFile
                      ? `${((fileList[0].size ?? 0) / 1024).toFixed(0)} KB — click to change`
                      : "PNG, JPG, WEBP — click to browse"}
                  </Typography.Text>
                </div>
                {hasFile && (
                  <Button
                    size="small"
                    danger
                    type="text"
                    icon={<CloseCircleOutlined />}
                    style={{ marginLeft: "auto", flexShrink: 0 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setFileList([]);
                    }}
                  />
                )}
              </div>
            </Upload>
          </Form.Item>

          <Divider style={{ margin: "14px 0" }} />

          <Form.Item
            label="Note (optional)"
            name="note"
            style={{ marginBottom: 0 }}
          >
            <Input.TextArea
              rows={2}
              placeholder="e.g. Paid via Easypaisa"
              maxLength={200}
              style={{ resize: "none" }}
            />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
}
