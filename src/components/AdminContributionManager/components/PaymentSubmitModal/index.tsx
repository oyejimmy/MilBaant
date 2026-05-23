import { useState } from "react";
import dayjs from "dayjs";
import {
  App,
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Typography,
  Upload,
} from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import {
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DollarOutlined,
  PictureOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { useCreateContributionPayment } from "@/hooks/useContributions";
import { uploadPaymentScreenshot } from "@/lib/storage";
import {
  ModalHeader,
  ModalIconBadge,
  ModalBody,
  TwoCol,
  SectionLabel,
  ModalDivider,
  MonthBadge,
  UploadZone,
  UploadIconBox,
} from "../styles";

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
  const [form] = Form.useForm();
  const { message } = App.useApp();
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

      message.success("Payment submitted successfully!");
      form.resetFields();
      setFileList([]);
      onClose();
    } catch (err) {
      message.error(
        err instanceof Error ? err.message : "Failed to submit payment",
      );
    } finally {
      setUploading(false);
    }
  };

  const hasFile = fileList.length > 0;

  return (
    <Modal
      centered
      open={open}
      title={null}
      okText="Submit Payment"
      confirmLoading={uploading || onSubmit.isPending}
      onCancel={onClose}
      onOk={() => void handleSubmit()}
      width="min(500px, 95vw)"
      style={{ top: 24 }}
      styles={{
        body: {
          padding: 0,
          maxHeight: "calc(100vh - 140px)",
          overflowY: "auto",
        },
        footer: {
          padding: "12px 24px 20px",
          borderTop: "1px solid var(--border-light)",
          margin: 0,
        },
      }}
      okButtonProps={{ size: "large" }}
      cancelButtonProps={{ size: "large" }}
    >
      <ModalHeader>
        <ModalIconBadge>
          <DollarOutlined />
        </ModalIconBadge>
        <div>
          <Typography.Title
            level={5}
            style={{ margin: 0, color: "var(--text-strong)", lineHeight: 1.3 }}
          >
            Submit Payment
          </Typography.Title>
          <Typography.Text style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {userName}
          </Typography.Text>
        </div>
      </ModalHeader>

      <ModalBody>
        <MonthBadge>
          <CalendarOutlined style={{ fontSize: 12 }} />
          {dayjs(month, "YYYY-MM").format("MMMM YYYY")}
        </MonthBadge>

        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          initialValues={{ paidAt: dayjs() }}
        >
          <SectionLabel>
            <DollarOutlined />
            <Typography.Text
              strong
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Payment Details
            </Typography.Text>
          </SectionLabel>

          <TwoCol>
            <Form.Item
              label="Amount (PKR)"
              name="amount"
              rules={[{ required: true, message: "Please enter the amount" }]}
              style={{ marginBottom: 12 }}
            >
              <InputNumber
                min={1}
                precision={2}
                style={{ width: "100%" }}
                placeholder="e.g. 5000"
                prefix={
                  <DollarOutlined style={{ color: "var(--text-muted)" }} />
                }
              />
            </Form.Item>

            <Form.Item
              label="Payment Date"
              name="paidAt"
              rules={[
                { required: true, message: "Please select payment date" },
              ]}
              style={{ marginBottom: 12 }}
            >
              <DatePicker
                style={{ width: "100%" }}
                format="DD/MM/YYYY"
                suffixIcon={
                  <CalendarOutlined style={{ color: "var(--text-muted)" }} />
                }
              />
            </Form.Item>
          </TwoCol>

          <ModalDivider />

          <SectionLabel>
            <PictureOutlined />
            <Typography.Text
              strong
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Screenshot
              <Typography.Text
                style={{ fontSize: 11, fontWeight: 400, marginLeft: 4 }}
              >
                (optional)
              </Typography.Text>
            </Typography.Text>
          </SectionLabel>

          <Form.Item name="screenshot" style={{ marginBottom: 12 }}>
            <Upload
              listType="text"
              fileList={fileList}
              showUploadList={false}
              beforeUpload={(file) => {
                if (!file.type.startsWith("image/")) {
                  message.error("Only image files allowed!");
                  return false;
                }
                if (file.size / 1024 / 1024 > 5) {
                  message.error("Image must be under 5MB!");
                  return false;
                }
                setFileList([file]);
                return false;
              }}
              onRemove={() => setFileList([])}
              maxCount={1}
            >
              <UploadZone $hasFile={hasFile}>
                <UploadIconBox $hasFile={hasFile}>
                  {hasFile ? <CheckCircleOutlined /> : <UploadOutlined />}
                </UploadIconBox>
                <div>
                  <Typography.Text
                    strong
                    style={{
                      fontSize: 13,
                      color: "var(--text-strong)",
                      display: "block",
                    }}
                  >
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
              </UploadZone>
            </Upload>
          </Form.Item>

          <ModalDivider />

          <Form.Item
            label="Note (optional)"
            name="note"
            style={{ marginBottom: 16 }}
          >
            <Input.TextArea
              rows={2}
              placeholder="e.g. Paid via Easypaisa"
              maxLength={200}
              style={{ resize: "none" }}
            />
          </Form.Item>
        </Form>
      </ModalBody>
    </Modal>
  );
}
