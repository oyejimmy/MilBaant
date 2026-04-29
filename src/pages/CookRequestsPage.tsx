import { useState } from 'react'
import dayjs from 'dayjs'
import {
  App,
  Badge,
  Button,
  Col,
  Empty,
  Flex,
  Form,
  Grid,
  Input,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  CommentOutlined,
  DeleteOutlined,
  EyeOutlined,
  InboxOutlined,
  MessageOutlined,
  PlusOutlined,
  SyncOutlined,
} from '@ant-design/icons'
import styled, { keyframes } from 'styled-components'
import { PageHeader } from '@/components/PageHeader'
import { QueryState } from '@/components/QueryState'
import { PageStack, SectionBlock, MobileCard, MobileRow, MobileLabel } from '@/components/Glass'
import { SummaryStat } from '@/components/SummaryStat'
import { useAuth } from '@/hooks/useAuth'
import {
  useCookRequests,
  useCreateCookRequest,
  useDeleteCookRequest,
  useCookReply,
} from '@/hooks/useCookRequests'
import type { CookRequest, CookRequestStatus } from '@/lib/types'

const { useBreakpoint } = Grid

/* ─── Status config ───────────────────────────────────────────────────────── */

const STATUS_META: Record<
  CookRequestStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  pending:      { label: 'Pending',      color: '#f9a825', icon: <ClockCircleOutlined /> },
  acknowledged: { label: 'Acknowledged', color: '#1890ff', icon: <SyncOutlined spin /> },
  done:         { label: 'Done',         color: '#52c41a', icon: <CheckCircleOutlined /> },
  rejected:     { label: 'Rejected',     color: '#ff4d4f', icon: <CloseCircleOutlined /> },
}

const STATUS_OPTIONS: Array<{ label: string; value: CookRequestStatus }> = [
  { label: 'Pending',      value: 'pending' },
  { label: 'Acknowledged', value: 'acknowledged' },
  { label: 'Done',         value: 'done' },
  { label: 'Rejected',     value: 'rejected' },
]

/* ─── Animations ──────────────────────────────────────────────────────────── */

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
`

/* ─── Styled ──────────────────────────────────────────────────────────────── */

const PageWrap = styled.div`
  animation: ${fadeUp} 0.22s ease;
`

const StatusBadge = styled.span<{ $status: CookRequestStatus }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
  background: ${({ $status }) => STATUS_META[$status].color}18;
  color: ${({ $status }) => STATUS_META[$status].color};
  border: 1px solid ${({ $status }) => STATUS_META[$status].color}30;
`

const CommentBubble = styled.div`
  background: var(--content-bg);
  border: 1px solid var(--card-border);
  border-left: 3px solid #f97316;
  border-radius: 0 8px 8px 8px;
  padding: 8px 12px;
  font-size: 12px;
  color: var(--text-strong);
  line-height: 1.5;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: -1px;
    left: -3px;
    width: 3px;
    height: 12px;
    background: #f97316;
    border-radius: 3px 0 0 0;
  }
`

const EmptyWrap = styled.div`
  padding: 40px 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
`

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function formatRelative(ts: string) {
  const d = dayjs(ts)
  const diff = dayjs().diff(d, 'minute')
  if (diff < 1)  return 'just now'
  if (diff < 60) return `${diff}m ago`
  const h = Math.floor(diff / 60)
  if (h < 24)    return `${h}h ago`
  return d.format('DD MMM, h:mm A')
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

export function CookRequestsPage() {
  const { userId, isCook, isAdmin } = useAuth()
  const { message } = App.useApp()
  const screens  = useBreakpoint()
  const isMobile = !screens.md

  const [addOpen,      setAddOpen]      = useState(false)
  const [replyTarget,  setReplyTarget]  = useState<CookRequest | null>(null)
  const [viewItem,     setViewItem]     = useState<CookRequest | null>(null)
  const [filterStatus, setFilterStatus] = useState<CookRequestStatus | 'all'>('all')

  const requestsQuery = useCookRequests()
  const createRequest = useCreateCookRequest()
  const cookReply     = useCookReply()
  const deleteRequest = useDeleteCookRequest()

  const allRequests = requestsQuery.data ?? []

  const filtered = filterStatus === 'all'
    ? allRequests
    : allRequests.filter((r) => r.status === filterStatus)

  const pendingCount      = allRequests.filter((r) => r.status === 'pending').length
  const acknowledgedCount = allRequests.filter((r) => r.status === 'acknowledged').length
  const doneCount         = allRequests.filter((r) => r.status === 'done').length
  const rejectedCount     = allRequests.filter((r) => r.status === 'rejected').length

  /* ── Handlers ── */

  async function handleCreate(values: { item: string; quantity?: string; note?: string }) {
    if (!userId) return
    try {
      await createRequest.mutateAsync({ item: values.item, quantity: values.quantity, note: values.note, requestedBy: userId })
      message.success('Request submitted to cook.')
      setAddOpen(false)
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Unable to submit.')
    }
  }

  async function handleReply(req: CookRequest, status: CookRequestStatus, comment: string) {
    if (!userId) return
    try {
      await cookReply.mutateAsync({ id: req.id, status, cookComment: comment, userId })
      message.success(`Reply saved — marked as ${STATUS_META[status].label}.`)
      setReplyTarget(null)
      // refresh viewItem if open
      if (viewItem?.id === req.id) setViewItem(null)
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Unable to save reply.')
    }
  }

  async function handleDelete(id: string) {
    if (!userId) return
    try {
      await deleteRequest.mutateAsync({ id, userId })
      message.success('Request removed.')
      if (viewItem?.id === id) setViewItem(null)
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Unable to delete.')
    }
  }

  /* ── Table columns ── */

  const columns: ColumnsType<CookRequest> = [
    {
      title: 'Item',
      key: 'item',
      render: (_: unknown, r: CookRequest) => (
        <div>
          <Typography.Text strong style={{ color: 'var(--text-strong)', display: 'block' }}>
            {r.item}
          </Typography.Text>
          {r.quantity && (
            <Typography.Text style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Qty: {r.quantity}
            </Typography.Text>
          )}
        </div>
      ),
    },
    {
      title: 'Requested By',
      key: 'requester',
      width: 130,
      render: (_: unknown, r: CookRequest) => (
        <Tag color="blue" style={{ fontSize: 11 }}>
          {r.requester?.full_name ?? '—'}
        </Tag>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 130,
      render: (_: unknown, r: CookRequest) => (
        <StatusBadge $status={r.status}>
          {STATUS_META[r.status].icon} {STATUS_META[r.status].label}
        </StatusBadge>
      ),
    },
    {
      title: "Cook's Reply",
      key: 'cook_comment',
      ellipsis: true,
      responsive: ['md'] as ('md')[],
      render: (_: unknown, r: CookRequest) =>
        r.cook_comment ? (
          <Typography.Text style={{ fontSize: 12, color: '#f97316', fontStyle: 'italic' }}>
            "{r.cook_comment}"
          </Typography.Text>
        ) : (
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>No reply yet</Typography.Text>
        ),
    },
    {
      title: 'When',
      key: 'created_at',
      width: 90,
      responsive: ['lg'] as ('lg')[],
      render: (_: unknown, r: CookRequest) => (
        <Typography.Text style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {formatRelative(r.created_at)}
        </Typography.Text>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 90,
      render: (_: unknown, r: CookRequest) => {
        const canDelete = (r.requested_by === userId || isAdmin) && !isCook
        return (
          <Flex gap={4} justify="flex-end">
            <Tooltip title="View details">
              <Button size="small" icon={<EyeOutlined />} onClick={() => setViewItem(r)} />
            </Tooltip>
            {isCook && (
              <Tooltip title="Reply">
                <Button
                  size="small"
                  icon={<MessageOutlined />}
                  style={{ color: '#f97316', borderColor: '#f97316' }}
                  onClick={() => setReplyTarget(r)}
                />
              </Tooltip>
            )}
            {canDelete && (
              <Popconfirm title="Remove this request?" onConfirm={() => void handleDelete(r.id)}>
                <Button size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            )}
          </Flex>
        )
      },
    },
  ]

  const pageSubtitle = isCook
    ? 'View requests from flatmates and reply with a status and comment.'
    : 'Request items or groceries from the cook. The cook will reply with a status.'

  return (
    <PageWrap>
      <PageStack>
        <PageHeader
          title="Cook Requests"
          subtitle={pageSubtitle}
          breadcrumbs={[{ title: 'Home', path: '/' }, { title: 'Management' }, { title: 'Cook Requests' }]}
          actions={
            <Space wrap>
              <Select
                value={filterStatus}
                onChange={(v) => setFilterStatus(v as CookRequestStatus | 'all')}
                style={{ width: 140 }}
                options={[{ label: 'All Requests', value: 'all' }, ...STATUS_OPTIONS]}
              />
              {/* Cook cannot create requests */}
              {!isCook && !!userId && (
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddOpen(true)}>
                  New Request
                </Button>
              )}
            </Space>
          }
        />

        <QueryState isLoading={requestsQuery.isLoading} error={requestsQuery.error as Error | null}>

          {/* ── Stats ── */}
          <Row gutter={[10, 10]}>
            <Col xs={12} sm={6}>
              <SummaryStat title="Pending"      value={pendingCount}      subtitle="Awaiting reply"   icon={<ClockCircleOutlined />} color="#f9a825" />
            </Col>
            <Col xs={12} sm={6}>
              <SummaryStat title="Acknowledged" value={acknowledgedCount} subtitle="Cook is aware"    icon={<SyncOutlined />}        color="#1890ff" />
            </Col>
            <Col xs={12} sm={6}>
              <SummaryStat title="Done"         value={doneCount}         subtitle="Completed"        icon={<CheckCircleOutlined />} color="#52c41a" />
            </Col>
            <Col xs={12} sm={6}>
              <SummaryStat title="Rejected"     value={rejectedCount}     subtitle="Not fulfilled"    icon={<CloseCircleOutlined />} color="#ff4d4f" />
            </Col>
          </Row>

          {/* ── List ── */}
          <SectionBlock>
            <Flex align="center" justify="space-between" style={{ marginBottom: 14 }} wrap gap={8}>
              <Flex align="center" gap={8}>
                <InboxOutlined style={{ color: 'var(--primary)', fontSize: 15 }} />
                <Typography.Title level={5} style={{ margin: 0, color: 'var(--text-strong)' }}>
                  {isCook ? 'Requests from Flatmates' : 'All Requests'}
                </Typography.Title>
                <Badge count={pendingCount} style={{ background: '#f9a825' }} showZero={false} />
              </Flex>
              {isCook && (
                <Typography.Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Click Reply to set status and leave a comment
                </Typography.Text>
              )}
            </Flex>

            {filtered.length === 0 ? (
              <EmptyWrap>
                <InboxOutlined style={{ fontSize: 40, color: 'var(--text-muted)' }} />
                <Typography.Text style={{ color: 'var(--text-muted)' }}>
                  {filterStatus === 'all'
                    ? isCook ? 'No requests from flatmates yet.' : 'No requests yet. Be the first!'
                    : `No ${STATUS_META[filterStatus as CookRequestStatus]?.label.toLowerCase()} requests.`}
                </Typography.Text>
                {!isCook && !!userId && filterStatus === 'all' && (
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddOpen(true)}>
                    New Request
                  </Button>
                )}
              </EmptyWrap>
            ) : isMobile ? (
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                {filtered.map((r) => {
                  const canDelete = (r.requested_by === userId || isAdmin) && !isCook
                  return (
                    <MobileCard key={r.id}>
                      <MobileRow>
                        <Typography.Text strong style={{ color: 'var(--text-strong)', fontSize: 13 }}>
                          {r.item}
                        </Typography.Text>
                        <StatusBadge $status={r.status}>
                          {STATUS_META[r.status].icon} {STATUS_META[r.status].label}
                        </StatusBadge>
                      </MobileRow>

                      {r.quantity && (
                        <MobileRow>
                          <MobileLabel>Quantity</MobileLabel>
                          <Typography.Text style={{ fontSize: 12, color: 'var(--text-strong)' }}>
                            {r.quantity}
                          </Typography.Text>
                        </MobileRow>
                      )}

                      <MobileRow>
                        <Flex gap={6} align="center">
                          <Tag color="blue" style={{ margin: 0, fontSize: 10 }}>
                            {r.requester?.full_name ?? '—'}
                          </Tag>
                          <MobileLabel>{formatRelative(r.created_at)}</MobileLabel>
                        </Flex>
                        <Flex gap={4}>
                          <Button size="small" icon={<EyeOutlined />} onClick={() => setViewItem(r)} />
                          {isCook && (
                            <Button
                              size="small"
                              icon={<MessageOutlined />}
                              style={{ color: '#f97316', borderColor: '#f97316' }}
                              onClick={() => setReplyTarget(r)}
                            />
                          )}
                          {canDelete && (
                            <Popconfirm title="Remove?" onConfirm={() => void handleDelete(r.id)}>
                              <Button size="small" danger icon={<DeleteOutlined />} />
                            </Popconfirm>
                          )}
                        </Flex>
                      </MobileRow>

                      {/* Cook's comment visible to everyone */}
                      {r.cook_comment && (
                        <div>
                          <MobileLabel style={{ marginBottom: 4, display: 'block' }}>
                            Cook's Reply
                          </MobileLabel>
                          <CommentBubble>{r.cook_comment}</CommentBubble>
                        </div>
                      )}

                      {r.note && (
                        <Typography.Text style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          Note: {r.note}
                        </Typography.Text>
                      )}
                    </MobileCard>
                  )
                })}
              </Space>
            ) : (
              <Table<CookRequest>
                rowKey="id"
                size="small"
                columns={columns}
                dataSource={filtered}
                pagination={{ pageSize: 12, hideOnSinglePage: true, size: 'small',
                  showTotal: (total, range) => `${range[0]}–${range[1]} of ${total}` }}
                scroll={{ x: 520 }}
                locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No requests found." /> }}
              />
            )}
          </SectionBlock>

        </QueryState>
      </PageStack>

      {/* ── Add Request Modal (users only) ── */}
      {addOpen && (
        <AddRequestModal
          submitting={createRequest.isPending}
          onClose={() => setAddOpen(false)}
          onSubmit={handleCreate}
        />
      )}

      {/* ── Cook Reply Modal ── */}
      {replyTarget && (
        <CookReplyModal
          request={replyTarget}
          submitting={cookReply.isPending}
          onClose={() => setReplyTarget(null)}
          onSubmit={(status, comment) => void handleReply(replyTarget, status, comment)}
        />
      )}

      {/* ── View Detail Modal ── */}
      {viewItem && (
        <ViewRequestModal
          request={viewItem}
          isCook={isCook}
          canDelete={(viewItem.requested_by === userId || isAdmin) && !isCook}
          deleting={deleteRequest.isPending}
          onClose={() => setViewItem(null)}
          onReply={() => { setViewItem(null); setReplyTarget(viewItem) }}
          onDelete={() => void handleDelete(viewItem.id)}
        />
      )}
    </PageWrap>
  )
}

/* ─── Add Request Modal ───────────────────────────────────────────────────── */

interface AddFormValues { item: string; quantity?: string; note?: string }

function AddRequestModal({ submitting, onClose, onSubmit }: {
  submitting: boolean
  onClose: () => void
  onSubmit: (v: AddFormValues) => Promise<void>
}) {
  const [form] = Form.useForm<AddFormValues>()
  async function handleOk() {
    const values = await form.validateFields()
    await onSubmit(values)
    form.resetFields()
  }
  return (
    <Modal
      open
      title={<Flex align="center" gap={8}><InboxOutlined style={{ color: 'var(--primary)' }} /><span>Request Item from Cook</span></Flex>}
      okText="Submit Request"
      confirmLoading={submitting}
      onCancel={onClose}
      onOk={() => void handleOk()}
      width="min(460px, 95vw)"
    >
      <Form form={form} layout="vertical" style={{ paddingTop: 8 }}>
        <Form.Item label="Item Name" name="item" rules={[{ required: true, message: 'Please enter the item name.' }]}>
          <Input placeholder="e.g. Chicken, Tomatoes, Bread, Eggs" prefix={<InboxOutlined style={{ color: 'var(--text-muted)' }} />} autoFocus />
        </Form.Item>
        <Form.Item label="Quantity (optional)" name="quantity">
          <Input placeholder="e.g. 2 kg, 1 dozen, 500g" />
        </Form.Item>
        <Form.Item label="Note (optional)" name="note" style={{ marginBottom: 0 }}>
          <Input.TextArea rows={2} placeholder="Any special instructions…" maxLength={200} showCount />
        </Form.Item>
      </Form>
    </Modal>
  )
}

/* ─── Cook Reply Modal ────────────────────────────────────────────────────── */

interface ReplyFormValues { status: CookRequestStatus; cook_comment: string }

function CookReplyModal({ request, submitting, onClose, onSubmit }: {
  request: CookRequest
  submitting: boolean
  onClose: () => void
  onSubmit: (status: CookRequestStatus, comment: string) => void
}) {
  const [form] = Form.useForm<ReplyFormValues>()

  function handleOk() {
    void form.validateFields().then((values) => {
      onSubmit(values.status, values.cook_comment ?? '')
    })
  }

  return (
    <Modal
      open
      title={
        <Flex align="center" gap={8}>
          <CommentOutlined style={{ color: '#f97316' }} />
          <span>Reply to Request</span>
        </Flex>
      }
      okText="Save Reply"
      okButtonProps={{ style: { background: '#f97316', borderColor: '#f97316' } }}
      confirmLoading={submitting}
      onCancel={onClose}
      onOk={handleOk}
      width="min(460px, 95vw)"
    >
      {/* Request summary */}
      <div style={{
        padding: '10px 14px',
        background: 'var(--content-bg)',
        border: '1px solid var(--card-border)',
        borderRadius: 8,
        marginBottom: 16,
        marginTop: 8,
      }}>
        <Typography.Text style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
          Request
        </Typography.Text>
        <Typography.Title level={5} style={{ margin: '4px 0 0', color: 'var(--text-strong)' }}>
          {request.item}
          {request.quantity && (
            <Typography.Text style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 8 }}>
              ({request.quantity})
            </Typography.Text>
          )}
        </Typography.Title>
        {request.note && (
          <Typography.Text style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginTop: 4 }}>
            Note: {request.note}
          </Typography.Text>
        )}
        <Typography.Text style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginTop: 4 }}>
          From: {request.requester?.full_name ?? '—'}
        </Typography.Text>
      </div>

      <Form
        form={form}
        layout="vertical"
        initialValues={{ status: request.status, cook_comment: request.cook_comment ?? '' }}
      >
        <Form.Item label="Update Status" name="status" rules={[{ required: true }]}>
          <Select
            options={[
              { label: '⏳  Pending',      value: 'pending' },
              { label: '👀  Acknowledged', value: 'acknowledged' },
              { label: '✅  Done',         value: 'done' },
              { label: '❌  Rejected',     value: 'rejected' },
            ]}
          />
        </Form.Item>
        <Form.Item
          label="Comment / Reason"
          name="cook_comment"
          rules={[{ required: true, message: 'Please leave a comment for the requester.' }]}
          style={{ marginBottom: 0 }}
        >
          <Input.TextArea
            rows={3}
            placeholder="e.g. Will bring tomorrow, Item not available today, Already bought, Not in budget…"
            maxLength={300}
            showCount
            autoFocus
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}

/* ─── View Request Modal ──────────────────────────────────────────────────── */

function ViewRequestModal({ request, isCook, canDelete, deleting, onClose, onReply, onDelete }: {
  request: CookRequest
  isCook: boolean
  canDelete: boolean
  deleting: boolean
  onClose: () => void
  onReply: () => void
  onDelete: () => void
}) {
  const meta = STATUS_META[request.status]

  return (
    <Modal
      open
      title={<Flex align="center" gap={8}><InboxOutlined style={{ color: 'var(--primary)' }} /><span>Request Details</span></Flex>}
      footer={
        <Flex justify="space-between" align="center">
          <Flex gap={8}>
            {canDelete && (
              <Popconfirm title="Delete this request?" onConfirm={onDelete}>
                <Button danger size="small" icon={<DeleteOutlined />} loading={deleting}>Delete</Button>
              </Popconfirm>
            )}
            {isCook && (
              <Button
                size="small"
                icon={<MessageOutlined />}
                style={{ color: '#f97316', borderColor: '#f97316' }}
                onClick={onReply}
              >
                Reply
              </Button>
            )}
          </Flex>
          <Button onClick={onClose}>Close</Button>
        </Flex>
      }
      onCancel={onClose}
      width="min(460px, 95vw)"
    >
      <Space direction="vertical" size={12} style={{ width: '100%', paddingTop: 8 }}>
        {/* Item name */}
        <div>
          <Typography.Text style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
            Item
          </Typography.Text>
          <Typography.Title level={4} style={{ margin: '4px 0 0', color: 'var(--text-strong)' }}>
            {request.item}
          </Typography.Title>
        </div>

        <Row gutter={[10, 10]}>
          {request.quantity && (
            <Col xs={12}>
              <div style={{ padding: '10px 12px', background: 'var(--content-bg)', borderRadius: 8, border: '1px solid var(--card-border)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Quantity</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-strong)' }}>{request.quantity}</div>
              </div>
            </Col>
          )}
          <Col xs={request.quantity ? 12 : 24}>
            <div style={{ padding: '10px 12px', background: 'var(--content-bg)', borderRadius: 8, border: '1px solid var(--card-border)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Requested By</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-strong)' }}>{request.requester?.full_name ?? '—'}</div>
            </div>
          </Col>
          <Col xs={12}>
            <div style={{ padding: '10px 12px', background: 'var(--content-bg)', borderRadius: 8, border: '1px solid var(--card-border)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Submitted</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-strong)' }}>{formatRelative(request.created_at)}</div>
            </div>
          </Col>
          <Col xs={12}>
            <div style={{ padding: '10px 12px', background: 'var(--content-bg)', borderRadius: 8, border: '1px solid var(--card-border)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Status</div>
              <StatusBadge $status={request.status}>{meta.icon} {meta.label}</StatusBadge>
            </div>
          </Col>
        </Row>

        {/* User's note */}
        {request.note && (
          <div style={{ padding: '10px 12px', background: 'var(--content-bg)', borderRadius: 8, border: '1px solid var(--card-border)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Note from requester</div>
            <Typography.Text style={{ fontSize: 13, color: 'var(--text-strong)' }}>{request.note}</Typography.Text>
          </div>
        )}

        {/* Cook's comment — always visible */}
        <div>
          <Flex align="center" gap={6} style={{ marginBottom: 6 }}>
            <CommentOutlined style={{ color: '#f97316', fontSize: 13 }} />
            <Typography.Text style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Cook's Reply
            </Typography.Text>
          </Flex>
          {request.cook_comment ? (
            <CommentBubble>{request.cook_comment}</CommentBubble>
          ) : (
            <Typography.Text style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
              No reply yet — the cook hasn't responded to this request.
            </Typography.Text>
          )}
        </div>
      </Space>
    </Modal>
  )
}
