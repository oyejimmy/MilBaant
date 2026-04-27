import { Form, Input, Modal } from 'antd'

interface AnnouncementFormValues {
  title: string
  content: string
}

export function AnnouncementComposer({
  open,
  confirmLoading,
  onClose,
  onSubmit,
}: {
  open: boolean
  confirmLoading: boolean
  onClose: () => void
  onSubmit: (values: AnnouncementFormValues) => Promise<void>
}) {
  const [form] = Form.useForm<AnnouncementFormValues>()

  async function handleOk() {
    const values = await form.validateFields()
    await onSubmit(values)
    form.resetFields()
  }

  return (
    <Modal
      open={open}
      title="Post Announcement"
      okText="Publish"
      onCancel={() => {
        form.resetFields()
        onClose()
      }}
      onOk={() => void handleOk()}
      confirmLoading={confirmLoading}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="Title"
          name="title"
          rules={[{ required: true, message: 'Please add a title.' }]}
        >
          <Input placeholder="Water tanker timing for this weekend" />
        </Form.Item>
        <Form.Item
          label="Content"
          name="content"
          rules={[{ required: true, message: 'Please add the announcement text.' }]}
        >
          <Input.TextArea rows={5} placeholder="Write the update for the flatmates." />
        </Form.Item>
      </Form>
    </Modal>
  )
}
