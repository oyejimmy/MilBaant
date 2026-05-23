import {
  Modal,
  Form,
  InputNumber,
  Typography,
  Flex,
  Tag,
  Card,
  Input,
} from "antd";
import { CheckCircleOutlined, ArrowRightOutlined } from "@ant-design/icons";
import { formatCurrency } from "@/lib/formatters";
import type { DebtRow } from "@/lib/types";

interface SettleModalProps {
  debt: DebtRow | null;
  open: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (debt: DebtRow, amount: number, note: string) => Promise<void>;
}

export function SettleModal({
  debt,
  open,
  submitting,
  onClose,
  onSubmit,
}: SettleModalProps) {
  const [form] = Form.useForm<{ amount: number; note: string }>();

  if (!debt) return null;

  const handleOk = async () => {
    const values = await form.validateFields();
    await onSubmit(debt, values.amount, values.note ?? "");
    form.resetFields();
  };

  return (
    <Modal
      centered
      open={open}
      onCancel={onClose}
      title={
        <Flex align="center" gap={14}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 13,
              background: "linear-gradient(135deg, #52c41a 0%, #73d13d 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CheckCircleOutlined style={{ color: "white", fontSize: 19 }} />
          </div>
          <div>
            <Typography.Title level={5} style={{ margin: 0 }}>
              Record Settlement
            </Typography.Title>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Mark a payment as completed
            </Typography.Text>
          </div>
        </Flex>
      }
      okText="Confirm Payment"
      confirmLoading={submitting}
      onOk={handleOk}
      width="min(440px, 96vw)"
    >
      <Card size="small" style={{ marginBottom: 16 }}>
        <Flex justify="space-between" align="center">
          <Flex align="center" gap={6} wrap>
            <Tag color="red" style={{ margin: 0 }}>
              {debt.fromName}
            </Tag>
            <ArrowRightOutlined
              style={{ color: "var(--text-muted)", fontSize: 10 }}
            />
            <Tag color="green" style={{ margin: 0 }}>
              {debt.toName}
            </Tag>
          </Flex>
          <Typography.Text
            strong
            style={{ color: "#52c41a", fontSize: "0.95rem" }}
          >
            {formatCurrency(debt.netAmount)}
          </Typography.Text>
        </Flex>
      </Card>

      <Form
        form={form}
        layout="vertical"
        initialValues={{ amount: debt.netAmount, note: "" }}
      >
        <Form.Item
          label="Amount Paid"
          name="amount"
          rules={[{ required: true, message: "Enter amount." }]}
        >
          <InputNumber
            min={0.01}
            max={debt.netAmount}
            precision={2}
            prefix="PKR"
            style={{ width: "100%" }}
          />
        </Form.Item>
        <Form.Item
          label="Note (optional)"
          name="note"
          style={{ marginBottom: 0 }}
        >
          <Input.TextArea placeholder="e.g. Cash handed over" rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
