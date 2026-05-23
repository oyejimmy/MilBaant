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
  MinusCircleOutlined,
  DollarOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import dayjs, { type Dayjs } from "dayjs";
import { FLAT_FUND_CATEGORY_OPTIONS } from "@/lib/constants";
import {
  ModalHeader,
  HeaderIcon,
  FormBody,
  SectionLabel,
  TwoCol,
} from "../styles";
import type {
  LogExpenseModalProps,
  CreateFlatFundExpenseInput,
} from "../../types";

export function LogExpenseModal({
  profiles,
  userId,
  submitting,
  onClose,
  onSubmit,
}: LogExpenseModalProps) {
  const [form] = Form.useForm<{
    userId: string;
    amount: number;
    description: string;
    category: string;
    date: Dayjs;
  }>();

  async function handleOk() {
    const values = await form.validateFields();
    await onSubmit({
      userId: values.userId,
      amount: values.amount,
      description: values.description,
      category: values.category as CreateFlatFundExpenseInput["category"],
      date: values.date.format("YYYY-MM-DD"),
      createdBy: userId,
    });
    form.resetFields();
  }

  return (
    <Modal
      centered
      open
      title={null}
      okText="Log Expense"
      confirmLoading={submitting}
      onCancel={onClose}
      onOk={() => void handleOk()}
      width="min(480px, 95vw)"
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
          $gradient="linear-gradient(135deg, #e65100 0%, #ff7043 100%)"
          $shadow="0 4px 12px rgba(230,81,0,0.35)"
        >
          <MinusCircleOutlined />
        </HeaderIcon>
        <div>
          <Typography.Title
            level={5}
            style={{ margin: 0, color: "var(--text-strong)", lineHeight: 1.3 }}
          >
            Log Flat Expense
          </Typography.Title>
          <Typography.Text style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Record what a member spent from flat fund
          </Typography.Text>
        </div>
      </ModalHeader>

      <FormBody>
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          initialValues={{ date: dayjs(), userId, category: "other" }}
        >
          <SectionLabel>
            <MinusCircleOutlined />
            <Typography.Text
              strong
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Expense Details
            </Typography.Text>
          </SectionLabel>

          <Form.Item
            label="Spent By"
            name="userId"
            rules={[{ required: true, message: "Select a member." }]}
            style={{ marginBottom: 12 }}
          >
            <Select
              placeholder="Who spent the money?"
              options={profiles.map((p) => ({
                label: p.full_name,
                value: p.id,
              }))}
            />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
            rules={[{ required: true, message: "Enter description." }]}
            style={{ marginBottom: 12 }}
          >
            <Input placeholder="e.g. Bought 2 water bottles" />
          </Form.Item>

          <TwoCol>
            <Form.Item
              label="Category"
              name="category"
              rules={[{ required: true }]}
              style={{ marginBottom: 12 }}
            >
              <Select
                options={FLAT_FUND_CATEGORY_OPTIONS.map((o) => ({
                  label: o.label,
                  value: o.value,
                }))}
              />
            </Form.Item>
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
                placeholder="e.g. 120"
                prefix={
                  <DollarOutlined style={{ color: "var(--text-muted)" }} />
                }
              />
            </Form.Item>
          </TwoCol>

          <Form.Item
            label="Date"
            name="date"
            rules={[{ required: true }]}
            style={{ marginBottom: 16 }}
          >
            <DatePicker
              style={{ width: "100%" }}
              format="DD/MM/YYYY"
              suffixIcon={
                <CalendarOutlined style={{ color: "var(--text-muted)" }} />
              }
            />
          </Form.Item>
        </Form>
      </FormBody>
    </Modal>
  );
}
