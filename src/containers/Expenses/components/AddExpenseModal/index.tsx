import {
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
  Button,
  Upload,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import type { UploadFile } from "antd/es/upload/interface";
import { useState } from "react";
import {
  EXPENSE_CATEGORY_OPTIONS,
  FIXED_EXPENSE_CATEGORIES,
} from "@/lib/constants";
import type { ExpenseCategory } from "@/lib/types";

interface AddExpenseModalProps {
  open: boolean;
  submitting: boolean;
  profiles: Array<{ id: string; full_name: string }>;
  onClose: () => void;
  onSubmit: (values: any, file?: File) => Promise<void>;
}

export function AddExpenseModal({
  open,
  submitting,
  profiles,
  onClose,
  onSubmit,
}: AddExpenseModalProps) {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const selectedCategory = Form.useWatch("category", form) as
    | ExpenseCategory
    | undefined;

  const isWeekendMeal = selectedCategory === "weekend_meal";

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const file = fileList[0]?.originFileObj;
      await onSubmit(values, file);
      form.resetFields();
      setFileList([]);
      onClose();
    } catch {
      // validation errors shown inline
    }
  };

  return (
    <Modal
      title="Add Expense"
      open={open}
      onCancel={() => {
        form.resetFields();
        setFileList([]);
        onClose();
      }}
      onOk={handleSubmit}
      confirmLoading={submitting}
      width={600}
      centered
    >
      <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
        <Form.Item
          name="category"
          label="Category"
          rules={[{ required: true, message: "Please select a category" }]}
        >
          <Select
            placeholder="Select a category"
            options={EXPENSE_CATEGORY_OPTIONS.map((opt) => ({
              value: opt.value,
              label: opt.label,
            }))}
          />
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
        >
          <Input placeholder="e.g., Monthly gas bill paid" />
        </Form.Item>

        <Form.Item
          name="amount"
          label="Amount (PKR)"
          rules={[{ required: true, message: "Please enter the amount" }]}
        >
          <InputNumber
            min={0}
            precision={2}
            style={{ width: "100%" }}
            placeholder="0.00"
          />
        </Form.Item>

        <Form.Item
          name="date"
          label="Date"
          rules={[{ required: true, message: "Please select a date" }]}
          initialValue={dayjs()}
        >
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item name="last_date" label="Last Date (optional)">
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>

        {/* Weekend meal only — pick specific participants */}
        {isWeekendMeal && (
          <Form.Item
            name="participantIds"
            label="Participants"
            rules={[
              {
                required: true,
                type: "array",
                min: 1,
                message: "Select at least one participant",
              },
            ]}
          >
            <Select
              mode="multiple"
              placeholder="Select who ate"
              options={profiles.map((p) => ({
                value: p.id,
                label: p.full_name,
              }))}
            />
          </Form.Item>
        )}

        {/* Fixed categories don't need participants — always split by all members */}
        {!isWeekendMeal &&
          selectedCategory &&
          !FIXED_EXPENSE_CATEGORIES.includes(selectedCategory) && (
            <Form.Item name="participantIds" label="Participants (optional)">
              <Select
                mode="multiple"
                placeholder="Leave empty to split among all members"
                options={profiles.map((p) => ({
                  value: p.id,
                  label: p.full_name,
                }))}
              />
            </Form.Item>
          )}

        <Form.Item label="Bill Image (optional)">
          <Upload
            fileList={fileList}
            beforeUpload={(file) => {
              setFileList([file]);
              return false;
            }}
            onRemove={() => setFileList([])}
            maxCount={1}
            accept="image/*"
          >
            <Button icon={<UploadOutlined />}>Upload Image</Button>
          </Upload>
        </Form.Item>
      </Form>
    </Modal>
  );
}
