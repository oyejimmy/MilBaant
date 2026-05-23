import {
  Modal,
  Form,
  Select,
  InputNumber,
  DatePicker,
  Input,
  Typography,
} from "antd";
import {
  UserOutlined,
  PlusCircleOutlined,
  DollarOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import dayjs, { type Dayjs } from "dayjs";
import {
  ModalHeader,
  HeaderIcon,
  FormBody,
  SectionLabel,
  TwoCol,
} from "../styles";
import type { AllocateModalProps } from "../../types";

export function AllocateModal({
  profiles,
  userId,
  submitting,
  onClose,
  onSubmit,
}: AllocateModalProps) {
  const [form] = Form.useForm<{
    userId: string;
    amount: number;
    note: string;
    date: Dayjs;
  }>();

  async function handleOk() {
    const values = await form.validateFields();
    await onSubmit({
      userId: values.userId,
      amount: values.amount,
      note: values.note,
      allocatedBy: userId,
      date: values.date.format("YYYY-MM-DD"),
    });
    form.resetFields();
  }

  return (
    <Modal
      centered
      open
      title={null}
      okText="Allocate Funds"
      confirmLoading={submitting}
      onCancel={onClose}
      onOk={() => void handleOk()}
      width="min(460px, 95vw)"
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
        <HeaderIcon
          $gradient="linear-gradient(135deg, #1465a3 0%, #52c41a 100%)"
          $shadow="0 4px 12px rgba(20,101,163,0.35)"
        >
          <PlusCircleOutlined />
        </HeaderIcon>
        <div>
          <Typography.Title
            level={5}
            style={{ margin: 0, color: "var(--text-strong)", lineHeight: 1.3 }}
          >
            Allocate Flat Fund
          </Typography.Title>
          <Typography.Text style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Assign flat fund money to a member
          </Typography.Text>
        </div>
      </ModalHeader>

      <FormBody>
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          initialValues={{ date: dayjs() }}
        >
          <SectionLabel>
            <PlusCircleOutlined />
            <Typography.Text
              strong
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Allocation Details
            </Typography.Text>
          </SectionLabel>

          <Form.Item
            label="Member"
            name="userId"
            rules={[{ required: true, message: "Select a member." }]}
            style={{ marginBottom: 12 }}
          >
            <Select
              placeholder="Who is receiving the funds?"
              suffixIcon={<UserOutlined />}
              options={profiles.map((p) => ({
                label: p.full_name,
                value: p.id,
              }))}
            />
          </Form.Item>

          <TwoCol>
            <Form.Item
              label="Amount (PKR)"
              name="amount"
              rules={[{ required: true, message: "Enter amount." }]}
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
              label="Date"
              name="date"
              rules={[{ required: true }]}
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

          <Form.Item
            label="Note (optional)"
            name="note"
            style={{ marginBottom: 16 }}
          >
            <Input.TextArea
              rows={2}
              placeholder="e.g. For water bottles this month"
              style={{ resize: "none" }}
            />
          </Form.Item>
        </Form>
      </FormBody>
    </Modal>
  );
}
