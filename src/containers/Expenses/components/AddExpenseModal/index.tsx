import {
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
  Button,
  Space,
  Upload,
  message,
} from "antd";
import { PlusOutlined, UploadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import type { UploadFile } from "antd/es/upload/interface";
import { useState } from "react";
import { CATEGORY_LABELS } from "@/lib/constants";

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

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const file = fileList[0]?.originFileObj;
      await onSubmit(values, file);
      form.resetFields();
      setFileList([]);
      onClose();
    } catch (error) {
      message.error("Failed to add expense");
    }
  };

  const categories = [
    "rent",
    "utility_bill",
    "groceries",
    "internet",
    "cleaning",
    "maintenance",
    "other",
  ];

  return (
    <Modal
      title="Add Expense"
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={submitting}
      width={600}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="description"
          label="Description"
          rules={[{ required: true, message: "Please enter description" }]}
        >
          <Input placeholder="e.g., Grocery shopping" />
        </Form.Item>

        <Form.Item
          name="amount"
          label="Amount"
          rules={[{ required: true, message: "Please enter amount" }]}
        >
          <InputNumber
            min={0}
            precision={2}
            style={{ width: "100%" }}
            placeholder="Enter amount"
          />
        </Form.Item>

        <Form.Item
          name="category"
          label="Category"
          rules={[{ required: true, message: "Please select category" }]}
        >
          <Select>
            {categories.map((cat) => (
              <Select.Option key={cat} value={cat}>
                {CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS] || cat}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="date"
          label="Date"
          rules={[{ required: true, message: "Please select date" }]}
          initialValue={dayjs()}
        >
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item name="last_date" label="Last Date (Optional)">
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item name="participantIds" label="Participants">
          <Select mode="multiple" placeholder="Select participants">
            {profiles.map((profile) => (
              <Select.Option key={profile.id} value={profile.id}>
                {profile.full_name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label="Bill Image (Optional)">
          <Upload
            fileList={fileList}
            beforeUpload={(file) => {
              setFileList([file]);
              return false;
            }}
            onRemove={() => setFileList([])}
            maxCount={1}
          >
            <Button icon={<UploadOutlined />}>Upload Image</Button>
          </Upload>
        </Form.Item>
      </Form>
    </Modal>
  );
}
