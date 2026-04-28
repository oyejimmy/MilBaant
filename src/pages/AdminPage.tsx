import { useState } from 'react'
import type { ColumnsType } from 'antd/es/table'
import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  Flex,
  Form,
  Grid,
  Input,
  InputNumber,
  Modal,
  Result,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  message,
} from 'antd'
import {
  DownloadOutlined,
  EditOutlined,
  LockOutlined,
  MailOutlined,
  PlusOutlined,
  SaveOutlined,
  TeamOutlined,
  UserAddOutlined,
  UserOutlined,
} from '@ant-design/icons'
import styled from 'styled-components'
import { AnnouncementComposer } from '@/components/AnnouncementComposer'
import { FlatFloorplan } from '@/components/FlatFloorplan'
import { PageHeader } from '@/components/PageHeader'
import { QueryState } from '@/components/QueryState'
import { PageStack, SectionBlock } from '@/components/Glass'
import { ROLE_OPTIONS } from '@/lib/constants'
import { exportUsersToExcel } from '@/lib/export'
import { useAnnouncements, useCreateAnnouncement } from '@/hooks/useAnnouncements'
import { useAuth } from '@/hooks/useAuth'
import { useAssignBed, useBedAssignments, useBeds, useRooms } from '@/hooks/useFlatLayout'
import {
  useAdminCreateUser,
  useProfiles,
  useUpdateProfilePermissions,
} from '@/hooks/useProfiles'
import { useMemberCountSetting, useUpsertMemberCount } from '@/hooks/useSettings'
import type { Profile, Role } from '@/lib/types'

const { useBreakpoint } = Grid

/* ─── Styled ──────────────────────────────────────────────────────────────── */

const MemberCard = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 7px;
  border: 1px solid var(--card-border);
  background: var(--card-bg);
  transition: border-color 0.15s ease;
  &:hover { border-color: var(--primary); }
`

const AVATAR_COLORS = [
  '#1c8ee5',
  '#6a6a6a',
  '#212121',
  '#52c41a',
  '#fa8c16',
  '#13c2c2',
  '#eb2f96',
  '#722ed1',
]

function avatarColor(name: string) {
  let hash = 0
  for (const ch of name) hash = ch.charCodeAt(0) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

export function AdminPage() {
  const { isAdmin, userId, profileLoading } = useAuth()
  const [composerOpen, setComposerOpen] = useState(false)
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [editUser, setEditUser] = useState<Profile | null>(null)
  const [memberCountDraft, setMemberCountDraft] = useState<number | null>(null)
  const screens = useBreakpoint()
  const isMobile = !screens.md

  const profilesQuery = useProfiles()
  const memberCountQuery = useMemberCountSetting()
  const updateProfile = useUpdateProfilePermissions()
  const createUser = useAdminCreateUser()
  const saveMemberCount = useUpsertMemberCount()
  const roomsQuery = useRooms()
  const bedsQuery = useBeds()
  const assignmentsQuery = useBedAssignments()
  const assignBed = useAssignBed()
  const announcementsQuery = useAnnouncements()
  const createAnnouncement = useCreateAnnouncement()

  const profiles = profilesQuery.data ?? []
  const rooms = roomsQuery.data ?? []
  const beds = bedsQuery.data ?? []
  const assignments = assignmentsQuery.data ?? []
  const memberCount = memberCountQuery.data ?? 6

  /* ── Handlers ── */

  async function handleRoleChange(profile: Profile, role: Profile['role']) {
    try {
      await updateProfile.mutateAsync({ userId: profile.id, role })
      message.success(`Role updated for ${profile.full_name}.`)
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Unable to update role.')
    }
  }

  async function handlePermissionChange(profile: Profile, canAddExpenses: boolean) {
    try {
      await updateProfile.mutateAsync({ userId: profile.id, canAddExpenses })
      message.success(`Permission updated for ${profile.full_name}.`)
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Unable to update permission.')
    }
  }

  async function handleNameChange(profile: Profile, fullName: string) {
    try {
      await updateProfile.mutateAsync({ userId: profile.id, fullName })
      message.success('Name updated.')
      setEditUser(null)
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Unable to update name.')
    }
  }

  async function handleAssign(bedId: number, assignedUserId: string | null) {
    try {
      await assignBed.mutateAsync({ bedId, userId: assignedUserId })
      message.success(assignedUserId ? 'Bed assigned.' : 'Bed cleared.')
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Unable to update bed.')
    }
  }

  async function handleSaveMemberCount() {
    const nextValue = memberCountDraft ?? memberCount
    if (nextValue < 1) { message.error('Must be at least 1.'); return }
    try {
      await saveMemberCount.mutateAsync(nextValue)
      message.success('Member count updated.')
      setMemberCountDraft(null)
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Unable to update.')
    }
  }

  async function handleCreateAnnouncement(values: { title: string; content: string }) {
    if (!userId) return
    try {
      await createAnnouncement.mutateAsync({ ...values, createdBy: userId })
      message.success('Announcement posted.')
      setComposerOpen(false)
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Unable to post.')
    }
  }

  /* ── Table columns ── */

  const columns: ColumnsType<Profile> = [
    {
      title: 'Member',
      key: 'member',
      render: (_: unknown, record: Profile) => (
        <Flex align="center" gap={10}>
          <Avatar
            size={32}
            style={{ background: avatarColor(record.full_name), color: '#fff', fontWeight: 700, fontSize: 12, flexShrink: 0 }}
          >
            {initials(record.full_name)}
          </Avatar>
          <div>
            <Typography.Text strong style={{ color: 'var(--text-strong)', display: 'block', fontSize: '0.88rem' }}>
              {record.full_name}
            </Typography.Text>
          </div>
        </Flex>
      ),
    },
    {
      title: 'Role',
      key: 'role',
      width: 150,
      render: (_: unknown, record: Profile) => (
        <Select
          size="small"
          style={{ width: 130 }}
          options={ROLE_OPTIONS}
          value={record.role}
          onChange={(value) => void handleRoleChange(record, value)}
        />
      ),
    },
    {
      title: 'Can Add Expenses',
      key: 'can_add_expenses',
      width: 150,
      render: (_: unknown, record: Profile) => (
        <Switch
          size="small"
          checked={record.can_add_expenses}
          onChange={(checked) => void handlePermissionChange(record, checked)}
        />
      ),
    },
    {
      title: '',
      key: 'edit',
      width: 50,
      render: (_: unknown, record: Profile) => (
        <Button
          size="small"
          icon={<EditOutlined />}
          onClick={() => setEditUser(record)}
        />
      ),
    },
  ]

  const isLoading =
    profilesQuery.isLoading || memberCountQuery.isLoading ||
    roomsQuery.isLoading || bedsQuery.isLoading ||
    assignmentsQuery.isLoading || announcementsQuery.isLoading

  const error =
    (profilesQuery.error as Error | null) ?? (memberCountQuery.error as Error | null) ??
    (roomsQuery.error as Error | null) ?? (bedsQuery.error as Error | null) ??
    (assignmentsQuery.error as Error | null) ?? (announcementsQuery.error as Error | null)

  // Wait for profile to load before checking admin status
  if (profileLoading) {
    return null
  }

  if (!isAdmin) {
    return (
      <Result
        status="403"
        title="Admin access only"
        subTitle="This section is restricted to flat admins."
      />
    )
  }

  return (
    <PageStack>
      <PageHeader
        title="Admin Panel"
        subtitle="Manage flatmates, permissions, member count, announcements, and bed assignments."
        actions={
          <Space wrap>
            <Button
              icon={<DownloadOutlined />}
              onClick={() => void exportUsersToExcel(profiles)}
            >
              Export
            </Button>
            <Button
              icon={<PlusOutlined />}
              onClick={() => setComposerOpen(true)}
            >
              Post Announcement
            </Button>
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              onClick={() => setAddUserOpen(true)}
            >
              Add User
            </Button>
          </Space>
        }
      />

      <QueryState isLoading={isLoading} error={error}>

        {/* Flat members overview */}
        <SectionBlock>
          <Flex align="center" gap={8} style={{ marginBottom: 16 }}>
            <TeamOutlined style={{ color: 'var(--primary)', fontSize: 16 }} />
            <Typography.Title level={5} style={{ margin: 0, color: 'var(--text-strong)' }}>
              Flat Members ({profiles.length})
            </Typography.Title>
          </Flex>
          <Row gutter={[10, 10]}>
            {profiles.map((p) => (
              <Col key={p.id} xs={24} sm={12} lg={8}>
                <MemberCard>
                  <Avatar
                    size={40}
                    style={{ background: avatarColor(p.full_name), color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0 }}
                  >
                    {initials(p.full_name)}
                  </Avatar>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Typography.Text strong style={{ color: 'var(--text-strong)', display: 'block', fontSize: '0.88rem' }}>
                      {p.full_name}
                    </Typography.Text>
                    <Flex gap={4} wrap style={{ marginTop: 3 }}>
                      <Tag
                        color={p.role === 'admin' ? 'gold' : 'default'}
                        style={{ fontSize: '0.7rem', padding: '0 5px', margin: 0 }}
                      >
                        {p.role === 'admin' ? 'Admin' : 'Member'}
                      </Tag>
                      {p.can_add_expenses && (
                        <Tag color="green" style={{ fontSize: '0.7rem', padding: '0 5px', margin: 0 }}>
                          Can Add Expenses
                        </Tag>
                      )}
                    </Flex>
                  </div>
                  <Button
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => setEditUser(p)}
                  />
                </MemberCard>
              </Col>
            ))}
          </Row>
        </SectionBlock>

        {/* User management table */}
        <SectionBlock>
          <Typography.Title level={5} style={{ margin: '0 0 12px', color: 'var(--text-strong)' }}>
            Permissions & Roles
          </Typography.Title>
          {isMobile ? (
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              {profiles.map((p) => (
                <div key={p.id} style={{ border: '1px solid var(--card-border)', borderRadius: 7, padding: '10px 12px', background: 'var(--card-bg)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Flex align="center" justify="space-between" gap={8}>
                    <Flex align="center" gap={8}>
                      <Avatar size={28} style={{ background: avatarColor(p.full_name), color: '#fff', fontWeight: 700, fontSize: 11, flexShrink: 0 }}>{initials(p.full_name)}</Avatar>
                      <Typography.Text strong style={{ color: 'var(--text-strong)', fontSize: 13 }}>{p.full_name}</Typography.Text>
                    </Flex>
                    <Button size="small" icon={<EditOutlined />} onClick={() => setEditUser(p)} />
                  </Flex>
                  <Flex gap={8} align="center" wrap>
                    <Typography.Text style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 40 }}>Role:</Typography.Text>
                    <Select size="small" style={{ flex: 1, minWidth: 110 }} options={ROLE_OPTIONS} value={p.role} onChange={(value) => void handleRoleChange(p, value)} />
                  </Flex>
                  <Flex gap={8} align="center">
                    <Typography.Text style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1 }}>Can Add Expenses</Typography.Text>
                    <Switch size="small" checked={p.can_add_expenses} onChange={(checked) => void handlePermissionChange(p, checked)} />
                  </Flex>
                </div>
              ))}
            </Space>
          ) : (
            <Table
              rowKey="id"
              size="small"
              columns={columns}
              dataSource={profiles}
              pagination={false}
              scroll={{ x: 450 }}
            />
          )}
        </SectionBlock>

        {/* Member count */}
        <SectionBlock>
          <Typography.Title level={5} style={{ margin: '0 0 12px', color: 'var(--text-strong)' }}>
            Member Count Setting
          </Typography.Title>
          <Space wrap>
            <InputNumber
              min={1}
              value={memberCountDraft ?? memberCount}
              onChange={(value) => setMemberCountDraft(value)}
            />
            <Button
              icon={<SaveOutlined />}
              loading={saveMemberCount.isPending}
              onClick={() => void handleSaveMemberCount()}
            >
              Save
            </Button>
          </Space>
          <Alert
            style={{ marginTop: 12 }}
            type="info"
            showIcon
            message="This number is used to split fixed monthly expenses equally."
          />
        </SectionBlock>

        {/* Flat layout */}
        <SectionBlock>
          <Typography.Title level={5} style={{ margin: '0 0 12px', color: 'var(--text-strong)' }}>
            Flat Layout & Bed Assignments
          </Typography.Title>
          <Typography.Text style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'block', marginBottom: 16 }}>
            Rooms: Yasir &amp; Haris · Sajid &amp; Raza · Jamil &amp; Ateeb. Click any bed to assign.
          </Typography.Text>
          <FlatFloorplan
            rooms={rooms}
            beds={beds}
            assignments={assignments}
            profiles={profiles}
            isAdmin
            saving={assignBed.isPending}
            onAssign={handleAssign}
          />
        </SectionBlock>

        {/* Recent announcements */}
        <Card>
          <Typography.Title level={5} style={{ margin: '0 0 12px', color: 'var(--text-strong)' }}>
            Recent Announcements
          </Typography.Title>
          {(announcementsQuery.data ?? []).length === 0 ? (
            <Typography.Text style={{ color: 'var(--text-muted)' }}>No announcements yet.</Typography.Text>
          ) : (
            (announcementsQuery.data ?? []).slice(0, 3).map((a) => (
              <div key={a.id} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid var(--card-border)' }}>
                <Typography.Text strong style={{ color: 'var(--text-strong)' }}>{a.title}</Typography.Text>
                <Typography.Paragraph style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {a.content}
                </Typography.Paragraph>
              </div>
            ))
          )}
        </Card>
      </QueryState>

      {/* Add User modal */}
      {addUserOpen && (
        <AddUserModal
          submitting={createUser.isPending}
          onClose={() => setAddUserOpen(false)}
          onSubmit={async (values) => {
            try {
              await createUser.mutateAsync(values)
              message.success(`${values.fullName} added successfully.`)
              setAddUserOpen(false)
            } catch (err) {
              message.error(err instanceof Error ? err.message : 'Unable to create user.')
            }
          }}
        />
      )}

      {/* Edit user modal */}
      {editUser && (
        <EditUserModal
          profile={editUser}
          submitting={updateProfile.isPending}
          onClose={() => setEditUser(null)}
          onSave={handleNameChange}
          onRoleChange={handleRoleChange}
          onPermissionChange={handlePermissionChange}
        />
      )}

      {/* Announcement composer */}
      <AnnouncementComposer
        open={composerOpen}
        confirmLoading={createAnnouncement.isPending}
        onClose={() => setComposerOpen(false)}
        onSubmit={handleCreateAnnouncement}
      />
    </PageStack>
  )
}

/* ─── Add User Modal ──────────────────────────────────────────────────────── */

interface AddUserFormValues {
  fullName: string
  email: string
  password: string
  role: Role
  canAddExpenses: boolean
}



function AddUserModal({
  submitting,
  onClose,
  onSubmit,
}: {
  submitting: boolean
  onClose: () => void
  onSubmit: (values: AddUserFormValues) => Promise<void>
}) {
  const [form] = Form.useForm<AddUserFormValues>()

  async function handleOk() {
    const values = await form.validateFields()
    await onSubmit(values)
    form.resetFields()
  }

  return (
    <Modal
      open
      title={
        <Flex align="center" gap={8}>
          <UserAddOutlined style={{ color: 'var(--primary)' }} />
          <span>Add New Flatmate</span>
        </Flex>
      }
      okText="Create Account"
      confirmLoading={submitting}
      onCancel={onClose}
      onOk={() => void handleOk()}
      width="min(460px, 95vw)"
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16, marginTop: 8 }}
        message="Make sure email confirmation is disabled in Supabase Auth settings for instant access."
      />

      <Form
        form={form}
        layout="vertical"
        initialValues={{ role: 'user', canAddExpenses: false }}
      >
        <Form.Item
          label="Full Name"
          name="fullName"
          rules={[{ required: true, message: 'Enter full name.' }]}
        >
          <Input
            prefix={<UserOutlined style={{ color: 'var(--text-muted)' }} />}
            placeholder="e.g. Yasir Momand"
          />
        </Form.Item>

        <Form.Item
          label="Email Address"
          name="email"
          rules={[
            { required: true, message: 'Enter email.' },
            { type: 'email', message: 'Enter a valid email.' },
          ]}
        >
          <Input
            prefix={<MailOutlined style={{ color: 'var(--text-muted)' }} />}
            placeholder="e.g. yasir@milbaant.com"
          />
        </Form.Item>

        <Form.Item
          label="Password"
          name="password"
          rules={[
            { required: true, message: 'Enter password.' },
            { min: 6, message: 'Password must be at least 6 characters.' },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined style={{ color: 'var(--text-muted)' }} />}
            placeholder="Minimum 6 characters"
          />
        </Form.Item>

        <Row gutter={12}>
          <Col xs={24} sm={12}>
            <Form.Item label="Role" name="role" rules={[{ required: true }]}>
              <Select options={ROLE_OPTIONS} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Can Add Expenses" name="canAddExpenses" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  )
}

/* ─── Edit User Modal ─────────────────────────────────────────────────────── */

function EditUserModal({
  profile,
  submitting,
  onClose,
  onSave,
  onRoleChange,
  onPermissionChange,
}: {
  profile: Profile
  submitting: boolean
  onClose: () => void
  onSave: (profile: Profile, name: string) => Promise<void>
  onRoleChange: (profile: Profile, role: Role) => Promise<void>
  onPermissionChange: (profile: Profile, can: boolean) => Promise<void>
}) {
  const [form] = Form.useForm<{ fullName: string; role: Role; canAddExpenses: boolean }>()

  async function handleOk() {
    const values = await form.validateFields()
    await onSave(profile, values.fullName)
    await onRoleChange({ ...profile, full_name: values.fullName }, values.role)
    await onPermissionChange({ ...profile }, values.canAddExpenses)
  }

  return (
    <Modal
      open
      title={
        <Flex align="center" gap={8}>
          <Avatar
            size={28}
            style={{ background: avatarColor(profile.full_name), color: '#fff', fontWeight: 700, fontSize: 11 }}
          >
            {initials(profile.full_name)}
          </Avatar>
          <span>Edit {profile.full_name}</span>
        </Flex>
      }
      okText="Save Changes"
      confirmLoading={submitting}
      onCancel={onClose}
      onOk={() => void handleOk()}
      width="min(400px, 95vw)"
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          fullName: profile.full_name,
          role: profile.role,
          canAddExpenses: profile.can_add_expenses,
        }}
        style={{ paddingTop: 8 }}
      >
        <Form.Item
          label="Full Name"
          name="fullName"
          rules={[{ required: true, message: 'Name is required.' }]}
        >
          <Input prefix={<UserOutlined style={{ color: 'var(--text-muted)' }} />} />
        </Form.Item>

        <Row gutter={12}>
          <Col xs={24} sm={12}>
            <Form.Item label="Role" name="role">
              <Select options={ROLE_OPTIONS} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Can Add Expenses" name="canAddExpenses" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  )
}
