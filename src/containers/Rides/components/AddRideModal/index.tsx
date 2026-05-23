import {
  Modal,
  Form,
  DatePicker,
  Select,
  Input,
  InputNumber,
  Flex,
  Avatar,
  Checkbox,
  Typography,
} from "antd";
import {
  CarOutlined,
  CalendarOutlined,
  DollarOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { RIDE_SERVICES } from "@/lib/constants";
import type { CreateRideInput } from "@/lib/types";
import type { RideFormValues } from "../../types";
import { initials } from "../helpers";

interface AddRideModalProps {
  open: boolean;
  profiles: { id: string; full_name: string }[];
  userId: string;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (input: CreateRideInput) => Promise<void>;
}

export function AddRideModal({
  open,
  profiles,
  userId,
  submitting,
  onClose,
  onSubmit,
}: AddRideModalProps) {
  const [form] = Form.useForm<RideFormValues>();
  const riderIds: string[] = Form.useWatch("riderIds", form) ?? [];

  const toggleRider = (id: string, checked: boolean) => {
    const current: string[] = form.getFieldValue("riderIds") ?? [];
    form.setFieldValue(
      "riderIds",
      checked ? [...current, id] : current.filter((x) => x !== id),
    );
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await onSubmit({
        date: values.date.format("YYYY-MM-DD"),
        service: values.service,
        route: values.route,
        amount: values.amount,
        paidBy: values.paidBy,
        note: values.note,
        riderIds: values.riderIds,
        createdBy: userId,
      });
      form.resetFields();
      onClose();
    } catch (err) {
      // Error handled in parent
    }
  };

  return (
    <Modal
      centered
      open={open}
      title={
        <Flex align="center" gap={8}>
          <CarOutlined style={{ color: "#909ffa" }} />
          <span>Add Ride</span>
        </Flex>
      }
      okText="Save Ride"
      confirmLoading={submitting}
      onCancel={onClose}
      onOk={handleSubmit}
      width="min(520px, 95vw)"
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        initialValues={{
          date: dayjs(),
          service: "Yango",
          paidBy: userId,
          riderIds: [userId],
        }}
      >
        <Flex vertical gap={12}>
          <Flex gap={12} wrap="wrap">
            <Form.Item
              label="Date"
              name="date"
              rules={[{ required: true }]}
              style={{ flex: 1, marginBottom: 0 }}
            >
              <DatePicker
                style={{ width: "100%" }}
                format="DD/MM/YYYY"
                suffixIcon={<CalendarOutlined />}
              />
            </Form.Item>
            <Form.Item
              label="Service"
              name="service"
              rules={[{ required: true }]}
              style={{ flex: 1, marginBottom: 0 }}
            >
              <Select
                options={RIDE_SERVICES.map((s) => ({ label: s, value: s }))}
              />
            </Form.Item>
          </Flex>

          <Form.Item label="Route (optional)" name="route">
            <Input
              placeholder="e.g. Home → Mall of Lahore"
              prefix={<CarOutlined />}
            />
          </Form.Item>

          <Flex gap={12} wrap="wrap">
            <Form.Item
              label="Total Fare (PKR)"
              name="amount"
              rules={[{ required: true, message: "Enter fare." }]}
              style={{ flex: 1, marginBottom: 0 }}
            >
              <InputNumber
                min={1}
                precision={2}
                style={{ width: "100%" }}
                placeholder="350"
                prefix={<DollarOutlined />}
              />
            </Form.Item>
            <Form.Item
              label="Paid By"
              name="paidBy"
              rules={[{ required: true }]}
              style={{ flex: 1, marginBottom: 0 }}
            >
              <Select
                options={profiles.map((p) => ({
                  label: p.full_name,
                  value: p.id,
                }))}
              />
            </Form.Item>
          </Flex>

          <Form.Item
            label={
              <Flex justify="space-between" style={{ width: "100%" }}>
                <span>
                  <TeamOutlined style={{ marginRight: 8 }} />
                  Riders
                </span>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {riderIds.length} / {profiles.length} selected
                </Typography.Text>
              </Flex>
            }
            name="riderIds"
            rules={[{ required: true, message: "Select at least one rider." }]}
          >
            <Flex vertical gap={8}>
              {profiles.map((p) => {
                const checked = riderIds.includes(p.id);
                return (
                  <Flex
                    key={p.id}
                    align="center"
                    justify="space-between"
                    style={{
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: `1.5px solid ${checked ? "var(--primary)" : "var(--border-light)"}`,
                      background: checked ? "var(--primary-soft)" : undefined,
                      cursor: "pointer",
                    }}
                    onClick={() => toggleRider(p.id, !checked)}
                  >
                    <Flex align="center" gap={8}>
                      <Avatar
                        size={24}
                        style={{
                          background: checked ? "var(--primary)" : "#d9d9d9",
                        }}
                      >
                        {initials(p.full_name)}
                      </Avatar>
                      <Typography.Text
                        style={{
                          color: checked ? "var(--primary)" : undefined,
                        }}
                      >
                        {p.full_name}
                      </Typography.Text>
                    </Flex>
                    <Checkbox checked={checked} />
                  </Flex>
                );
              })}
            </Flex>
          </Form.Item>

          <Form.Item label="Note (optional)" name="note">
            <Input.TextArea
              rows={2}
              placeholder="e.g. Late night ride back from dinner"
            />
          </Form.Item>
        </Flex>
      </Form>
    </Modal>
  );
}
