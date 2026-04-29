import { useState } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import { Button, App, Col, DatePicker, Flex, Form, Grid, Image, Input, InputNumber, Modal, Row, Space, Table, Tag, Typography, Upload } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { UploadFile } from 'antd/es/upload/interface'
import { CalendarOutlined, CheckCircleOutlined, CloseCircleOutlined, DeleteOutlined, EyeOutlined, PictureOutlined, UploadOutlined, DollarOutlined, WalletOutlined, HomeOutlined } from '@ant-design/icons'
import { PageStack, SectionBlock } from '@/components/Glass'
import { PageHeader } from '@/components/PageHeader'
import { SummaryStat } from '@/components/SummaryStat'
import { QueryState } from '@/components/QueryState'
import { useAuth } from '@/hooks/useAuth'
import { useContributionPayments, useDeleteContributionPayment, useCreateContributionPayment } from '@/hooks/useContributions'
import { useProfiles } from '@/hooks/useProfiles'
import { formatCurrency, formatDateTime } from '@/lib/formatters'
import { uploadPaymentScreenshot } from '@/lib/storage'

const { useBreakpoint } = Grid

export function ContributionsPage() {
  const { isAdmin, userId } = useAuth()
  const screens = useBreakpoint()
  const isMobile = !screens.md

  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(dayjs().startOf('month'))
  const monthStr = selectedMonth.format('YYYY-MM')

  const paymentsQuery = useContributionPayments(monthStr)
  const profilesQuery = useProfiles()
  const deletePayment = useDeleteContributionPayment()
  const createPayment = useCreateContributionPayment()

  const [previewImage, setPreviewImage] = useState<string>('')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null)

  const payments = paymentsQuery.data ?? []
  const profiles = profilesQuery.data ?? []

  // Build summary: who paid, who didn't
  const paymentMap = new Map(payments.map((p) => [p.user_id, p]))
  const summary = profiles.map((profile) => {
    const payment = paymentMap.get(profile.id)
    return {
      userId: profile.id,
      fullName: profile.full_name,
      paid: !!payment,
      payment: payment ?? null,
    }
  })

  const handleDelete = async (id: string) => {
    if (!userId) return
    Modal.confirm({
      title: 'Delete Payment Record',
      content: 'Are you sure you want to delete this payment record?',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        await deletePayment.mutateAsync({ id, userId })
      },
    })
  }

  const columns: ColumnsType<typeof summary[0]> = [
    {
      title: 'Flatmate',
      dataIndex: 'fullName',
      key: 'fullName',
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: unknown, record: typeof summary[0]) => {
        if (record.paid && record.payment) {
          return <Tag color="success">Paid</Tag>
        }
        return <Tag color="error">Not Paid</Tag>
      },
    },
    {
      title: 'Amount',
      key: 'amount',
      render: (_: unknown, record: typeof summary[0]) => {
        if (record.payment) {
          return (
            <Typography.Text strong style={{ color: '#52c41a' }}>
              {formatCurrency(record.payment.amount)}
            </Typography.Text>
          )
        }
        return <Typography.Text style={{ color: 'var(--text-muted)' }}>—</Typography.Text>
      },
    },
    {
      title: 'Payment Date',
      key: 'paidAt',
      render: (_: unknown, record: typeof summary[0]) => {
        if (record.payment) {
          return dayjs(record.payment.paid_at).format('DD MMM YYYY')
        }
        return <Typography.Text style={{ color: 'var(--text-muted)' }}>—</Typography.Text>
      },
    },
    {
      title: 'Screenshot',
      key: 'screenshot',
      render: (_: unknown, record: typeof summary[0]) => {
        if (record.payment?.screenshot_url) {
          return (
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => {
                setPreviewImage(record.payment!.screenshot_url!)
                setPreviewOpen(true)
              }}
            >
              View
            </Button>
          )
        }
        return <Typography.Text style={{ color: 'var(--text-muted)' }}>No screenshot</Typography.Text>
      },
    },
    {
      title: 'Submitted',
      key: 'createdAt',
      render: (_: unknown, record: typeof summary[0]) => {
        if (record.payment) {
          return (
            <Typography.Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {formatDateTime(record.payment.created_at)}
            </Typography.Text>
          )
        }
        return <Typography.Text style={{ color: 'var(--text-muted)' }}>—</Typography.Text>
      },
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: unknown, record: typeof summary[0]) => {
        // If payment exists, show delete button for admin or creator
        if (record.payment && (isAdmin || record.payment.created_by === userId)) {
          return (
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => void handleDelete(record.payment!.id)}
              loading={deletePayment.isPending}
            >
              Delete
            </Button>
          )
        }
        
        // If no payment, show submit button for:
        // 1. The user viewing their own record
        // 2. Admin viewing any record
        if (!record.payment && (record.userId === userId || isAdmin)) {
          return (
            <Button
              size="small"
              type="primary"
              icon={<DollarOutlined />}
              onClick={() => {
                setSelectedUser({ id: record.userId, name: record.fullName })
                setPaymentModalOpen(true)
              }}
            >
              Submit Payment
            </Button>
          )
        }
        
        // If no payment and not the user's record and not admin, show unpaid status
        if (!record.payment) {
          return <Tag color="error">Unpaid</Tag>
        }
        
        return null
      },
    },
  ]

  const paidCount = summary.filter((s) => s.paid).length
  const unpaidCount = summary.length - paidCount
  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0)

  return (
    <PageStack>
      <PageHeader
        title="Contribution Payments"
        subtitle="Track monthly contribution payments from all flatmates."
        breadcrumbs={[{ title: 'Home', path: '/', icon: <HomeOutlined /> }, { title: 'Management' }, { title: 'Contributions' }]}
      />
      <QueryState isLoading={paymentsQuery.isLoading || profilesQuery.isLoading} error={paymentsQuery.error as Error | null}>
        <SectionBlock>
          <Flex justify="space-between" align="center" wrap="wrap" gap={16} style={{ marginBottom: 20 }}>

            <DatePicker
              value={selectedMonth}
              onChange={(date) => setSelectedMonth(date ?? dayjs())}
              picker="month"
              format="MMMM YYYY"
              size="large"
              suffixIcon={<CalendarOutlined />}
              style={{ minWidth: 200 }}
            />
          </Flex>

          {/* Summary Cards */}
          <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
            <Col xs={24} sm={8}>
              <SummaryStat
                title="Paid"
                value={`${paidCount} / ${summary.length}`}
                subtitle="Members who paid"
                icon={<CheckCircleOutlined />}
                color="var(--success)"
              />
            </Col>
            <Col xs={24} sm={8}>
              <SummaryStat
                title="Unpaid"
                value={unpaidCount}
                subtitle="Still pending"
                icon={<CloseCircleOutlined />}
                color="var(--error)"
              />
            </Col>
            <Col xs={24} sm={8}>
              <SummaryStat
                title="Total Collected"
                value={formatCurrency(totalCollected)}
                subtitle="This month"
                icon={<WalletOutlined />}
                color="var(--primary)"
              />
            </Col>
          </Row>

          {/* Table */}
          {isMobile ? (
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              {summary.map((record) => (
                <div
                  key={record.userId}
                  style={{
                    padding: '12px 14px',
                    background: 'var(--content-bg)',
                    borderRadius: 8,
                    border: `1.5px solid ${record.paid ? '#52c41a' : '#ff4d4f'}`,
                  }}
                >
                  <Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
                    <Typography.Text strong style={{ fontSize: 14, color: 'var(--text-strong)' }}>
                      {record.fullName}
                    </Typography.Text>
                    {record.paid ? (
                      <Tag color="success">Paid</Tag>
                    ) : (
                      <Tag color="error">Not Paid</Tag>
                    )}
                  </Flex>

                  {record.payment && (
                    <>
                      <Typography.Text style={{ fontSize: 13, color: 'var(--text-base)', display: 'block' }}>
                        Amount: <strong style={{ color: '#52c41a' }}>{formatCurrency(record.payment.amount)}</strong>
                      </Typography.Text>
                      <Typography.Text style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block' }}>
                        Paid on: {dayjs(record.payment.paid_at).format('DD MMM YYYY')}
                      </Typography.Text>
                      <Flex gap={8} style={{ marginTop: 10 }}>
                        {record.payment.screenshot_url && (
                          <Button
                            size="small"
                            icon={<PictureOutlined />}
                            onClick={() => {
                              setPreviewImage(record.payment!.screenshot_url!)
                              setPreviewOpen(true)
                            }}
                          >
                            Screenshot
                          </Button>
                        )}
                        {(isAdmin || record.payment.created_by === userId) && (
                          <Button
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => void handleDelete(record.payment!.id)}
                            loading={deletePayment.isPending}
                          >
                            Delete
                          </Button>
                        )}
                      </Flex>
                    </>
                  )}
                  
                  {!record.payment && (record.userId === userId || isAdmin) && (
                    <Button
                      size="small"
                      type="primary"
                      icon={<DollarOutlined />}
                      onClick={() => {
                        setSelectedUser({ id: record.userId, name: record.fullName })
                        setPaymentModalOpen(true)
                      }}
                      style={{ marginTop: 10, width: '100%' }}
                    >
                      Submit Payment
                    </Button>
                  )}
                </div>
              ))}
            </Space>
          ) : (
            <Table
              rowKey="userId"
              columns={columns}
              dataSource={summary}
              pagination={false}
              scroll={{ x: 800 }}
            />
          )}
        </SectionBlock>
      </QueryState>

      {/* Image Preview Modal */}
      <Modal
        open={previewOpen}
        title="Payment Screenshot"
        footer={null}
        onCancel={() => setPreviewOpen(false)}
        width={700}
      >
        <Image alt="Payment proof" style={{ width: '100%' }} src={previewImage} preview={false} />
      </Modal>

      {/* Submit Payment Modal */}
      {paymentModalOpen && selectedUser && userId && (
        <PaymentSubmitModal
          open={paymentModalOpen}
          userId={selectedUser.id}
          userName={selectedUser.name}
          month={monthStr}
          currentUserId={userId}
          onClose={() => {
            setPaymentModalOpen(false)
            setSelectedUser(null)
          }}
          onSubmit={createPayment}
        />
      )}
    </PageStack>
  )
}

/* ─── Payment Submit Modal ────────────────────────────────────────────────── */

interface PaymentSubmitModalProps {
  open: boolean
  userId: string
  userName: string
  month: string
  currentUserId: string
  onClose: () => void
  onSubmit: ReturnType<typeof useCreateContributionPayment>
}

function PaymentSubmitModal({ open, userId, userName, month, currentUserId, onClose, onSubmit }: PaymentSubmitModalProps) {
  const [form] = Form.useForm()
  const { message } = App.useApp()
  const [uploading, setUploading] = useState(false)
  const [fileList, setFileList] = useState<UploadFile[]>([])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setUploading(true)

      let screenshotUrl: string | null = null

      // Upload screenshot if provided
      if (fileList.length > 0 && fileList[0].originFileObj) {
        screenshotUrl = await uploadPaymentScreenshot(userId, fileList[0].originFileObj)
      }

      await onSubmit.mutateAsync({
        userId, // The user this payment is for
        month,
        amount: values.amount,
        paidAt: values.paidAt.format('YYYY-MM-DD'),
        screenshotUrl,
        note: values.note?.trim() || undefined,
        createdBy: currentUserId, // The user who is submitting (could be admin)
      })

      message.success('Payment submitted successfully!')
      form.resetFields()
      setFileList([])
      onClose()
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Failed to submit payment')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Modal
      open={open}
      title={
        <Flex align="center" gap={8}>
          <DollarOutlined style={{ color: '#52c41a' }} />
          <span>Submit Payment - {userName}</span>
        </Flex>
      }
      okText="Submit Payment"
      confirmLoading={uploading || onSubmit.isPending}
      onCancel={onClose}
      onOk={() => void handleSubmit()}
      width="min(500px, 95vw)"
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          paidAt: dayjs(),
        }}
        style={{ paddingTop: 16 }}
      >
        <Typography.Text style={{ display: 'block', marginBottom: 16, color: 'var(--text-muted)' }}>
          Month: <strong>{dayjs(month, 'YYYY-MM').format('MMMM YYYY')}</strong>
        </Typography.Text>

        <Form.Item
          label="Amount (PKR)"
          name="amount"
          rules={[{ required: true, message: 'Please enter the amount' }]}
        >
          <InputNumber
            min={1}
            precision={2}
            style={{ width: '100%' }}
            placeholder="e.g. 5000"
            size="large"
          />
        </Form.Item>

        <Form.Item
          label="Payment Date"
          name="paidAt"
          rules={[{ required: true, message: 'Please select payment date' }]}
        >
          <DatePicker
            style={{ width: '100%' }}
            format="DD/MM/YYYY"
            size="large"
          />
        </Form.Item>

        <Form.Item
          label="Payment Screenshot"
          name="screenshot"
          extra="Upload a screenshot of your payment confirmation (optional)"
        >
          <Upload
            listType="picture-card"
            fileList={fileList}
            beforeUpload={(file) => {
              const isImage = file.type.startsWith('image/')
              if (!isImage) {
                message.error('You can only upload image files!')
                return false
              }
              const isLt5M = file.size / 1024 / 1024 < 5
              if (!isLt5M) {
                message.error('Image must be smaller than 5MB!')
                return false
              }
              setFileList([file])
              return false
            }}
            onRemove={() => {
              setFileList([])
            }}
            maxCount={1}
          >
            {fileList.length === 0 && (
              <div>
                <UploadOutlined />
                <div style={{ marginTop: 8 }}>Upload</div>
              </div>
            )}
          </Upload>
        </Form.Item>

        <Form.Item label="Note (optional)" name="note">
          <Input.TextArea
            rows={2}
            placeholder="e.g. Paid via Easypaisa"
            maxLength={200}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
