import { Form, Input, Modal, Button, Space } from 'antd'
import { BottomSheet } from './BottomSheet'
import { useMobileLayout } from '@/hooks/useResponsive'

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
  const isMobile = useMobileLayout()

  async function handleOk() {
    const values = await form.validateFields()
    await onSubmit(values)
    form.resetFields()
  }

  function handleCancel() {
    form.resetFields()
    onClose()
  }

  const formContent = (
    <Form form={form} layout="vertical">
      <Form.Item
        label="Title"
        name="title"
        rules={[{ required: true, message: 'Please add a title.' }]}
      >
        <Input 
          placeholder="Water tanker timing for this weekend"
          size={isMobile ? 'large' : 'middle'}
        />
      </Form.Item>
      <Form.Item
        label="Content"
        name="content"
        rules={[{ required: true, message: 'Please add the announcement text.' }]}
      >
        <Input.TextArea 
          rows={isMobile ? 6 : 5} 
          placeholder="Write the update for the flatmates."
          style={{ fontSize: isMobile ? '16px' : '14px' }}
        />
      </Form.Item>
    </Form>
  )

  if (isMobile) {
    return (
      <BottomSheet
        open={open}
        onClose={handleCancel}
        title="Post Announcement"
        height="auto"
        forceBottomSheet
      >
        {formContent}
        <Space style={{ width: '100%', marginTop: 16 }} direction="vertical" size={8}>
          <Button
            type="primary"
            size="large"
            block
            loading={confirmLoading}
            onClick={() => void handleOk()}
          >
            Publish
          </Button>
          <Button size="large" block onClick={handleCancel}>
            Cancel
          </Button>
        </Space>
      </BottomSheet>
    )
  }

  return (
    <Modal
      open={open}
      title="Post Announcement"
      okText="Publish"
      onCancel={handleCancel}
      onOk={() => void handleOk()}
      confirmLoading={confirmLoading}
      destroyOnClose
    >
      {formContent}
    </Modal>
  )
}
