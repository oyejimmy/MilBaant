import { Modal, Form, Input, InputNumber, DatePicker, message } from "antd";
import dayjs from "dayjs";
import { useEffect } from "react";
import type { Expense } from "../../types";

interface EditExpenseModalProps {
  open: boolean;
  submitting: boolean;
  editingExpense: Expense | null;
  onClose: () => void;
  onSubmit: (values: any) => Promise<void>;
}

export function EditExpenseModal({
  open,
  submitting,
  editingExpense,
  onClose,
  onSubmit,
}: EditExpenseModalProps) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (editingExpense && open) {
      form.setFieldsValue({
        description: editingExpense.description,
        amount: editingExpense.amount,
        date: dayjs(editingExpense.date),
        last_date: editingExpense.last_date
          ? dayjs(editingExpense.last_date)
          : null,
      });
    }
  }, [editingExpense, open, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await onSubmit(values);
      form.resetFields();
      onClose();
    } catch (error) {
      message.error("Failed to update expense");
    }
  };

  return (
    <Modal
      title="Edit Expense"
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={submitting}
      width={500}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="description"
          label="Description"
          rules={[{ required: true, message: "Please enter description" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="amount"
          label="Amount"
          rules={[{ required: true, message: "Please enter amount" }]}
        >
          <InputNumber min={0} precision={2} style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item
          name="date"
          label="Date"
          rules={[{ required: true, message: "Please select date" }]}
        >
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item name="last_date" label="Last Date (Optional)">
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
