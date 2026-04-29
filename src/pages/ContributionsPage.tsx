import { useState } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import { Button, App, Col, DatePicker, Flex, Form, Grid, Image, Input, InputNumber, Modal, Row, Space, Table, Tag, Typography, Upload } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { UploadFile } from 'antd/es/upload/interface'
import { CalendarOutlined, CheckCircleOutlined, CloseCircleOutlined, DeleteOutlined, EyeOutlined, PictureOutlined, UploadOutlined, DollarOutlined, WalletOutlined, HomeOutlined } from '@ant-design/icons'
import styled from 'styled-components'
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

// ── Shared modal styled components ────────────────────────────────────────

const PayModalHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 24px 0;
`

const PayHeaderIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, #1b5e20 0%, #52c41a 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(27,94,32,0.35);
  .anticon { color: white; font-size: 18px; }
`

const PayFormBody = styled.div`
  padding: 16px 24px 0;
`

const PayTwoCol = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  @media (max-width: 480px) { grid-template-columns: 1fr; }
`

const PaySectionLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
  .anticon { color: var(--primary); font-size: 13px; }
`

const PayDivider = styled.div`
  height: 1px;
  background: var(--border-light);
  margin: 14px 0;
`

const MonthBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  background: rgba(82,196,26,0.10);
  border: 1px solid rgba(82,196,26,0.25);
  color: #52c41a;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 16px;
`

const UploadZone = styled.div<{ $hasFile: boolean }>`
  border: 1.5px dashed ${({ $hasFile }) => ($hasFile ? '#52c41a' : 'var(--border-default)')};
  border-radius: 12px;
  padding: 16px;
  background: ${({ $hasFile }) => ($hasFile ? 'rgba(82,196,26,0.05)' : 'var(--bg-elevated)')};
  cursor: pointer;
  transition: all 0.18s ease;
  display: flex;
  align-items: center;
  gap: 12px;
  &:hover { border-color: var(--primary); background: var(--primary-soft); }
`

const UploadIconBox = styled.div<{ $hasFile: boolean }>`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: ${({ $hasFile }) => ($hasFile ? 'rgba(82,196,26,0.12)' : 'rgba(64,150,255,0.10)')};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  .anticon { font-size: 16px; color: ${({ $hasFile }) => ($hasFile ? '#52c41a' : 'var(--primary)')}; }
`

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
      if (fileList.length > 0 && fileList[0].originFileObj) {
        screenshotUrl = await uploadPaymentScreenshot(userId, fileList[0].originFileObj)
      }

      await onSubmit.mutateAsync({
        userId,
        month,
        amount: values.amount,
        paidAt: values.paidAt.format('YYYY-MM-DD'),
        screenshotUrl,
        note: values.note?.trim() || undefined,
        createdBy: currentUserId,
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

  const hasFile = fileList.length > 0

  return (
    <Modal
      open={open}
      title={null}
      okText="Submit Payment"
      confirmLoading={uploading || onSubmit.isPending}
      onCancel={onClose}
      onOk={() => void handleSubmit()}
      width="min(500px, 95vw)"
      style={{ top: 24 }}
      styles={{
        body: { padding: 0, maxHeight: 'calc(100vh - 140px)', overflowY: 'auto' },
        footer: { padding: '12px 24px 20px', borderTop: '1px solid var(--border-light)', margin: 0 },
      }}
      okButtonProps={{ size: 'large' }}
      cancelButtonProps={{ size: 'large' }}
    >
      {/* Header */}
      <PayModalHeader>
        <PayHeaderIcon>
          <DollarOutlined />
        </PayHeaderIcon>
        <div>
          <Typography.Title level={5} style={{ margin: 0, color: 'var(--text-strong)', lineHeight: 1.3 }}>
            Submit Payment
          </Typography.Title>
          <Typography.Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {userName}
          </Typography.Text>
        </div>
      </PayModalHeader>

      <PayFormBody>
        {/* Month badge */}
        <MonthBadge>
          <CalendarOutlined style={{ fontSize: 12 }} />
          {dayjs(month, 'YYYY-MM').format('MMMM YYYY')}
        </MonthBadge>

        <Form form={form} layout="vertical" requiredMark={false} initialValues={{ paidAt: dayjs() }}>

          {/* Section: Payment Details */}
          <PaySectionLabel>
            <DollarOutlined />
            <Typography.Text strong style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Payment Details
            </Typography.Text>
          </PaySectionLabel>

          <PayTwoCol>
            <Form.Item
              label="Amount (PKR)"
              name="amount"
              rules={[{ required: true, message: 'Please enter the amount' }]}
              style={{ marginBottom: 12 }}
            >
              <InputNumber
                min={1}
                precision={2}
                style={{ width: '100%' }}
                placeholder="e.g. 5000"
                prefix={<DollarOutlined style={{ color: 'var(--text-muted)' }} />}
              />
            </Form.Item>

            <Form.Item
              label="Payment Date"
              name="paidAt"
              rules={[{ required: true, message: 'Please select payment date' }]}
              style={{ marginBottom: 12 }}
            >
              <DatePicker
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
                suffixIcon={<CalendarOutlined style={{ color: 'var(--text-muted)' }} />}
              />
            </Form.Item>
          </PayTwoCol>

          {/* Section: Screenshot */}
          <PayDivider />
          <PaySectionLabel>
            <PictureOutlined />
            <Typography.Text strong style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Payment Screenshot
              <Typography.Text style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400, marginLeft: 4 }}>(optional)</Typography.Text>
            </Typography.Text>
          </PaySectionLabel>

          <Form.Item name="screenshot" style={{ marginBottom: 12 }}>
            <Upload
              listType="text"
              fileList={fileList}
              showUploadList={false}
              beforeUpload={(file) => {
                if (!file.type.startsWith('image/')) { message.error('Only image files allowed!'); return false }
                if (file.size / 1024 / 1024 > 5) { message.error('Image must be under 5MB!'); return false }
                setFileList([file])
                return false
              }}
              onRemove={() => setFileList([])}
              maxCount={1}
            >
              <UploadZone $hasFile={hasFile}>
                <UploadIconBox $hasFile={hasFile}>
                  {hasFile ? <CheckCircleOutlined /> : <UploadOutlined />}
                </UploadIconBox>
                <div>
                  <Typography.Text strong style={{ fontSize: 13, color: 'var(--text-strong)', display: 'block' }}>
                    {hasFile ? fileList[0].name : 'Upload screenshot'}
                  </Typography.Text>
                  <Typography.Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {hasFile
                      ? `${((fileList[0].size ?? 0) / 1024).toFixed(0)} KB — click to change`
                      : 'PNG, JPG, WEBP — click to browse'}
                  </Typography.Text>
                </div>
                {hasFile && (
                  <Button
                    size="small"
                    danger
                    type="text"
                    icon={<CloseCircleOutlined />}
                    style={{ marginLeft: 'auto', flexShrink: 0 }}
                    onClick={(e) => { e.stopPropagation(); setFileList([]) }}
                  />
                )}
              </UploadZone>
            </Upload>
          </Form.Item>

          {/* Note */}
          <PayDivider />
          <Form.Item label="Note (optional)" name="note" style={{ marginBottom: 16 }}>
            <Input.TextArea rows={2} placeholder="e.g. Paid via Easypaisa" maxLength={200} style={{ resize: 'none' }} />
          </Form.Item>
        </Form>
      </PayFormBody>
    </Modal>
  )
}
