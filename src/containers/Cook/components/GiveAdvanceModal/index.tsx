import { useEffect } from "react";
import dayjs, { type Dayjs } from "dayjs";
import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Typography,
} from "antd";
import {
  CalendarOutlined,
  DollarOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { ModalHeader, HeaderIcon, FormBody } from "../../styles";

type Props = {
  open: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (values: {
    amount: number;
    date: Dayjs;
    note: string;
  }) => Promise<void>;
};

export function GiveAdvanceModal({
  open,
  submitting,
  onClose,
  onSubmit,
}: Props) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        date: dayjs(),
        amount: undefined,
        note: "",
      });
    }
  }, [open, form]);

  async function handleOk() {
    const values = await form.validateFields();
    await onSubmit(values);
    form.resetFields();
  }

  return (
    <Modal
      open={open}
      title={null}
      onCancel={onClose}
      onOk={() => void handleOk()}
      confirmLoading={submitting}
      okText="Save Advance"
      cancelText="Cancel"
      width="min(460px, 95vw)"
      styles={{
        body: { padding: "14px 18px 6px" },
        footer: {
          padding: "10px 18px 14px",
          borderTop: "1px solid var(--border-light)",
        },
      }}
    >
      <ModalHeader>
        <HeaderIcon
          $gradient="linear-gradient(135deg,#2e7d32,#52c41a)"
          $shadow="0 4px 12px rgba(46,125,50,0.3)"
        >
          <WalletOutlined />
        </HeaderIcon>

        <div>
          <Typography.Text strong>Give Advance</Typography.Text>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Record money given to cook
          </div>
        </div>
      </ModalHeader>

      <FormBody>
        <Form form={form} layout="vertical" initialValues={{ date: dayjs() }}>
          <Form.Item
            label="Amount"
            name="amount"
            rules={[{ required: true, message: "Enter amount" }]}
          >
            <InputNumber
              min={1}
              precision={2}
              style={{ width: "100%" }}
              prefix={<DollarOutlined />}
            />
          </Form.Item>

          <Form.Item label="Date" name="date" rules={[{ required: true }]}>
            <DatePicker
              style={{ width: "100%" }}
              format="DD/MM/YYYY"
              suffixIcon={<CalendarOutlined />}
            />
          </Form.Item>

          <Form.Item label="Note" name="note">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </FormBody>
    </Modal>
  );
}
