import { useState } from 'react'
import { Button, DatePicker, Flex, Image, InputNumber, message, Modal, Space, Typography, Upload } from 'antd'
import { CheckCircleOutlined, InboxOutlined, UploadOutlined } from '@ant-design/icons'
import type { UploadFile } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useAuth } from '@/hooks/useAuth'
import { useCreateContributionPayment } from '@/hooks/useContributions'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/formatters'

interface PaymentProofModalProps {
  open: boolean
  onClose: () => void
  userId: string
  userName: string
  amountOwed: number
  month: string
}

export function PaymentProofModal({
  open,
  onClose,
  userId,
  userName,
  amountOwed,
  month,
}: PaymentProofModalProps) {
  const { userId: currentUserId } = useAuth()
  const createPayment = useCreateContributionPayment()

  const [amount, setAmount] = useState<number>(amountOwed)
  const [paidDate, setPaidDate] = useState<Dayjs>(dayjs())
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [previewImage, setPreviewImage] = useState<string>('')
  const [previewOpen, setPreviewOpen] = useState(false)

  const handleUpload = async () => {
    if (!currentUserId) {
      message.error('You must be logged in')
      return
    }

    if (amount <= 0) {
      message.error('Please enter a valid amount')
      return
    }

    setUploading(true)

    try {
      let screenshotUrl: string | null = null

      // Upload screenshot if provided
      if (fileList.length > 0 && fileList[0].originFileObj) {
        const file = fileList[0].originFileObj
        const fileExt = file.name.split('.').pop()
        const fileName = `${userId}_${month}_${Date.now()}.${fileExt}`
        const filePath = `payment-proofs/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('bill-images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          })

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage
          .from('bill-images')
          .getPublicUrl(filePath)

        screenshotUrl = urlData.publicUrl
      }

      // Create payment record
      await createPayment.mutateAsync({
        userId,
        month,
        amount,
        paidAt: paidDate.format('YYYY-MM-DD'),
        screenshotUrl,
        createdBy: currentUserId,
      })

      message.success('Payment proof submitted successfully!')
      handleClose()
    } catch (error) {
      console.error('Upload error:', error)
      message.error(error instanceof Error ? error.message : 'Failed to submit payment proof')
    } finally {
      setUploading(false)
    }
  }

  const handleClose = () => {
    setAmount(amountOwed)
    setPaidDate(dayjs())
    setFileList([])
    onClose()
  }

  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as File)
    }
    setPreviewImage(file.url || (file.preview as string))
    setPreviewOpen(true)
  }

  return (
    <>
      <Modal
        title={
          <Flex align="center" gap={8}>
            <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />
            <span>Submit Payment Proof</span>
          </Flex>
        }
        open={open}
        onCancel={handleClose}
        footer={[
          <Button key="cancel" onClick={handleClose}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={uploading}
            onClick={() => void handleUpload()}
            icon={<UploadOutlined />}
          >
            Submit Payment
          </Button>,
        ]}
        width={500}
      >
        <Space direction="vertical" size={16} style={{ width: '100%', marginTop: 16 }}>
          {/* User Info */}
          <div
            style={{
              padding: '12px 16px',
              background: 'var(--content-bg)',
              borderRadius: 8,
              border: '1px solid var(--card-border)',
            }}
          >
            <Typography.Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Submitting payment for
            </Typography.Text>
            <Typography.Title level={5} style={{ margin: '4px 0 0 0', color: 'var(--text-strong)' }}>
              {userName}
            </Typography.Title>
            <Typography.Text style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Month: {dayjs(month, 'YYYY-MM').format('MMMM YYYY')}
            </Typography.Text>
          </div>

          {/* Amount */}
          <div>
            <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
              Amount Paid <span style={{ color: '#ff4d4f' }}>*</span>
            </Typography.Text>
            <InputNumber
              value={amount}
              onChange={(v) => setAmount(v ?? 0)}
              min={0}
              precision={2}
              prefix="PKR"
              style={{ width: '100%' }}
              size="large"
              placeholder="Enter amount paid"
            />
            <Typography.Text style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
              Amount owed: {formatCurrency(amountOwed)}
            </Typography.Text>
          </div>

          {/* Payment Date */}
          <div>
            <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
              Payment Date <span style={{ color: '#ff4d4f' }}>*</span>
            </Typography.Text>
            <DatePicker
              value={paidDate}
              onChange={(date) => setPaidDate(date ?? dayjs())}
              style={{ width: '100%' }}
              size="large"
              format="DD MMM YYYY"
            />
          </div>

          {/* Screenshot Upload */}
          <div>
            <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
              Payment Screenshot (Optional)
            </Typography.Text>
            <Upload.Dragger
              fileList={fileList}
              onChange={({ fileList: newFileList }) => setFileList(newFileList)}
              beforeUpload={() => false}
              maxCount={1}
              accept="image/*"
              onPreview={handlePreview}
              listType="picture"
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined style={{ color: '#1677ff' }} />
              </p>
              <p className="ant-upload-text">Click or drag image to upload</p>
              <p className="ant-upload-hint">
                Upload a screenshot of your payment confirmation
              </p>
            </Upload.Dragger>
          </div>
        </Space>
      </Modal>

      {/* Image Preview Modal */}
      <Modal
        open={previewOpen}
        title="Payment Screenshot"
        footer={null}
        onCancel={() => setPreviewOpen(false)}
      >
        <Image alt="Payment proof" style={{ width: '100%' }} src={previewImage} />
      </Modal>
    </>
  )
}

// Helper function to convert file to base64
function getBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })
}
