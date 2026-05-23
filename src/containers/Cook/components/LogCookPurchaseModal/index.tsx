import dayjs, { type Dayjs } from "dayjs";
import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Typography,
} from "antd";
import {
  CalendarOutlined,
  CoffeeOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";

import {
  ModalHeader,
  HeaderIcon,
  FormBody,
  TwoCol,
  SectionDivider,
  SectionLabel,
} from "../../styles";

import { PURCHASE_CATEGORY_OPTIONS } from "@/lib/constants";
import type { PurchaseCategory } from "@/lib/types";

type Props = {
  open: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (v: {
    date: Dayjs;
    item: string;
    amount: number;
    category: PurchaseCategory;
    note: string;
  }) => Promise<void>;
};

export function LogCookPurchaseModal({
  open,
  submitting,
  onClose,
  onSubmit,
}: Props) {
  const [form] = Form.useForm();

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
      width="min(480px,95vw)"
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={submitting}
          onClick={() => void handleOk()}
        >
          Save Purchase
        </Button>,
      ]}
      styles={{
        body: { padding: 0 },
        footer: {
          padding: "10px 16px 14px",
          borderTop: "1px solid var(--border-light)",
        },
      }}
    >
      <ModalHeader>
        <HeaderIcon
          $gradient="linear-gradient(135deg,#c62828,#ff4d4f)"
          $shadow="0 4px 12px rgba(198,40,40,0.25)"
        >
          <ShoppingCartOutlined />
        </HeaderIcon>

        <div>
          <Typography.Text strong>Log Purchase</Typography.Text>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Record cook purchase
          </div>
        </div>
      </ModalHeader>

      <FormBody>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            date: dayjs(),
            category: "grocery",
          }}
        >
          <SectionLabel>
            <ShoppingCartOutlined />
            <Typography.Text strong style={{ fontSize: 11 }}>
              ITEM DETAILS
            </Typography.Text>
          </SectionLabel>

          <TwoCol>
            <Form.Item name="item" label="Item" rules={[{ required: true }]}>
              <Input prefix={<CoffeeOutlined />} />
            </Form.Item>

            <Form.Item
              name="category"
              label="Category"
              rules={[{ required: true }]}
            >
              <Select options={[...PURCHASE_CATEGORY_OPTIONS]} />
            </Form.Item>
          </TwoCol>

          <TwoCol>
            <Form.Item
              name="amount"
              label="Amount"
              rules={[{ required: true }]}
            >
              <InputNumber
                min={1}
                precision={2}
                style={{ width: "100%" }}
                prefix={<DollarOutlined />}
              />
            </Form.Item>

            <Form.Item name="date" label="Date" rules={[{ required: true }]}>
              <DatePicker
                style={{ width: "100%" }}
                suffixIcon={<CalendarOutlined />}
              />
            </Form.Item>
          </TwoCol>

          <SectionDivider />

          <Form.Item name="note" label="Note">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </FormBody>
    </Modal>
  );
}
