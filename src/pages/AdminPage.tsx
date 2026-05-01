import { useMemo, useState } from 'react'
import type { ColumnsType } from 'antd/es/table'
import {
  Alert,
  App,
  Avatar,
  Button,
  Col,
  Empty,
  Flex,
  Form,
  Grid,
  Input,
  InputNumber,
  Modal,
  Result,
  Row,
  Select,
  Skeleton,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd'
import {
  CheckCircleOutlined,
  CoffeeOutlined,
  CrownOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  LockOutlined,
  MailOutlined,
  SaveOutlined,
  SearchOutlined,
  StopOutlined,
  TeamOutlined,
  UserAddOutlined,
  UserOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import styled, { keyframes } from 'styled-components'
import { FlatFloorplan } from '@/components/FlatFloorplan'
import { PageHeader } from '@/components/PageHeader'
import { QueryState } from '@/components/QueryState'
import { PageStack, SectionBlock, ResponsiveGrid } from '@/components/Glass'
import { SummaryStat } from '@/components/SummaryStat'
import { ROLE_OPTIONS } from '@/lib/constants'
import { exportUsersToExcel } from '@/lib/export'
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

/* ─── Role config ─────────────────────────────────────────────────────────── */

const ROLE_META: Record<Role, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
  admin: { color: '#cf1322', bg: '#fff1f0', icon: <CrownOutlined />,  label: 'Admin' },
  user:  { color: '#595959', bg: '#f5f5f5', icon: <UserOutlined />,   label: 'User'  },
  cook:  { color: '#d46b08', bg: '#fff7e6', icon: <CoffeeOutlined />, label: 'Cook'  },
}

/* ─── Animations ──────────────────────────────────────────────────────────── */

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
`

const shimmer = keyframes`
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
`

/* ─── Styled components ───────────────────────────────────────────────────── */

const PageWrap = styled.div`
  animation: ${fadeUp} 0.25s ease;
`

const ToolbarWrap = styled.div`
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  @media (max-width: 600px) { > * { flex: 1; min-width: 120px; } }
`

const FilterSelect = styled(Select)`
  .ant-select-selector {
    height: 34px  ; border-radius: 8px  ;
    border: 1px solid var(--card-border)  ;
    background: transparent  ; box-shadow: none  ;
  }
  &.ant-select-focused .ant-select-selector { border-color: var(--primary)  ; box-shadow: none  ; }
` as typeof Select

const UserCard = styled.div<{ $removed?: boolean }>`
  background: var(--card-bg); border: 1px solid var(--card-border);
  border-radius: 12px; padding: 14px;
  display: flex; flex-direction: column; gap: 12px;
  transition: box-shadow 0.2s ease;
  opacity: ${({ $removed }) => ($removed ? 0.55 : 1)};
  &:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.07); }
`

const CardTop = styled.div`
  display: flex; align-items: center; gap: 10px;
`

const CardMeta = styled.div`
  flex: 1; min-width: 0;
`

const CardActions = styled.div`
  display: flex; flex-direction: column; gap: 8px;
`

const CardRow = styled.div`
  display: flex; align-items: center; gap: 8px;
`

const RoleTag = styled.span<{ $role: Role }>`
  display: inline-flex; align-items: center; gap: 4px;
  padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 700;
  background: ${({ $role }) => ROLE_META[$role]?.bg ?? '#f5f5f5'};
  color: ${({ $role }) => ROLE_META[$role]?.color ?? '#595959'};
  border: 1px solid ${({ $role }) => ROLE_META[$role]?.color ?? '#d9d9d9'}30;
  white-space: nowrap;
`

const StatusDot = styled.span<{ $active: boolean }>`
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 11px; font-weight: 600;
  color: ${({ $active }) => ($active ? '#389e0d' : '#8c8c8c')};
  &::before {
    content: ''; width: 6px; height: 6px; border-radius: 50%;
    background: ${({ $active }) => ($active ? '#52c41a' : '#bfbfbf')}; flex-shrink: 0;
  }
`

const SkeletonRow = styled.div`
  height: 48px; border-radius: 8px;
  background: linear-gradient(90deg, var(--card-border) 25%, var(--card-bg) 50%, var(--card-border) 75%);
  background-size: 400px 100%;
  animation: ${shimmer} 1.4s ease infinite;
  margin-bottom: 8px;
`

const DangerBtn = styled(Button)`
  border-color: transparent  ; background: transparent  ;
  color: var(--error)  ; box-shadow: none  ;
  &:hover { background: var(--error-light)  ; border-color: var(--error)  ; color: var(--error)  ; }
`

const RestoreBtn = styled(Button)`
  border-color: transparent  ; background: transparent  ;
  color: var(--success)  ; box-shadow: none  ;
  &:hover { background: var(--success-light)  ; border-color: var(--success)  ; }
`

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

const AVATAR_COLORS = ['#1c8ee5', '#6a6a6a', '#52c41a', '#fa8c16', '#13c2c2', '#eb2f96', '#722ed1', '#cf1322']

function avatarColor(name: string) {
  let h = 0
  for (const ch of name) h = ch.charCodeAt(0) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}


/* ─── Page ────────────────────────────────────────────────────────────────── */

export function AdminPage() {
  const { isAdmin, userId, profileLoading } = useAuth()
  const { message } = App.useApp()

  const [search, setSearch]             = useState('')
  const [roleFilter, setRoleFilter]     = useState<Role | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'removed'>('all')
  const [editUser, setEditUser]         = useState<Profile | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null)
  const [addUserOpen, setAddUserOpen]   = useState(false)
  const [memberCountDraft, setMemberCountDraft] = useState<number | null>(null)

  const screens  = useBreakpoint()
  const isMobile = !screens.md

  const profilesQuery      = useProfiles()
  const memberCountQuery   = useMemberCountSetting()
  const updateProfile      = useUpdateProfilePermissions()
  const createUser         = useAdminCreateUser()
  const saveMemberCount    = useUpsertMemberCount()
  const roomsQuery         = useRooms()
  const bedsQuery          = useBeds()
  const assignmentsQuery   = useBedAssignments()
  const assignBed          = useAssignBed()

  const allProfiles = useMemo(() => profilesQuery.data ?? [], [profilesQuery.data])
  const rooms       = useMemo(() => roomsQuery.data ?? [], [roomsQuery.data])
  const beds        = useMemo(() => bedsQuery.data ?? [], [bedsQuery.data])
  const assignments = useMemo(() => assignmentsQuery.data ?? [], [assignmentsQuery.data])
  const memberCount = memberCountQuery.data ?? 6

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return allProfiles.filter((p) => {
      const matchSearch = !q || p.full_name.toLowerCase().includes(q)
      const matchRole   = roleFilter === 'all' || p.role === roleFilter
      const isRemoved   = p.is_active === false
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active'  && !isRemoved) ||
        (statusFilter === 'removed' && isRemoved)
      return matchSearch && matchRole && matchStatus
    })
  }, [allProfiles, search, roleFilter, statusFilter])

  const adminCount   = allProfiles.filter((p) => p.role === 'admin').length
  const cookCount    = allProfiles.filter((p) => p.role === 'cook').length
  const removedCount = allProfiles.filter((p) => p.is_active === false).length

  async function handleRoleChange(profile: Profile, role: Role) {
    try {
      await updateProfile.mutateAsync({ userId: profile.id, role })
      message.success(`Role updated to ${ROLE_META[role].label} for ${profile.full_name}.`)
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Unable to update role.')
    }
  }

  async function handlePermissionChange(profile: Profile, canAddExpenses: boolean) {
    try {
      await updateProfile.mutateAsync({ userId: profile.id, canAddExpenses })
      message.success(`Permission updated for ${profile.full_name}.`)
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Unable to update permission.')
    }
  }

  async function handleNameChange(profile: Profile, fullName: string) {
    try {
      await updateProfile.mutateAsync({ userId: profile.id, fullName })
      message.success('Name updated.')
      setEditUser(null)
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Unable to update name.')
    }
  }

  async function handleDeleteUser(profile: Profile) {
    try {
      await updateProfile.mutateAsync({ userId: profile.id, isActive: false })
      message.success(`${profile.full_name} has been deactivated.`)
      setDeleteTarget(null)
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Unable to deactivate user.')
    }
  }

  async function handleRestoreUser(profile: Profile) {
    try {
      await updateProfile.mutateAsync({ userId: profile.id, isActive: true })
      message.success(`${profile.full_name} has been reactivated.`)
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Unable to reactivate user.')
    }
  }

  async function handleAssign(bedId: number, assignedUserId: string | null) {
    try {
      await assignBed.mutateAsync({ bedId, userId: assignedUserId })
      message.success(assignedUserId ? 'Bed assigned.' : 'Bed cleared.')
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Unable to update bed.')
    }
  }

  async function handleSaveMemberCount() {
    const next = memberCountDraft ?? memberCount
    if (next < 1) { message.error('Must be at least 1.'); return }
    try {
      await saveMemberCount.mutateAsync(next)
      message.success('Member count updated.')
      setMemberCountDraft(null)
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Unable to update.')
    }
  }

  const columns: ColumnsType<Profile> = [
    {
      title: 'Member',
      key: 'member',
      render: (_: unknown, p: Profile) => {
        const isRemoved = p.is_active === false
        return (
          <Flex align="center" gap={10}>
            <Avatar size={34} style={{ background: isRemoved ? '#bfbfbf' : avatarColor(p.full_name), color: '#fff', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
              {initials(p.full_name)}
            </Avatar>
            <div>
              <Typography.Text strong style={{ color: isRemoved ? 'var(--text-muted)' : 'var(--text-strong)', display: 'block', fontSize: '0.88rem', textDecoration: isRemoved ? 'line-through' : 'none' }}>
                {p.full_name}
              </Typography.Text>
              <StatusDot $active={!isRemoved}>{isRemoved ? 'Deactivated' : 'Active'}</StatusDot>
            </div>
          </Flex>
        )
      },
    },
    {
      title: 'Role',
      key: 'role',
      width: 160,
      render: (_: unknown, p: Profile) => {
        const isRemoved = p.is_active === false
        return (
          <Select
            size="small"
            style={{ width: 140 }}
            value={p.role}
            disabled={isRemoved}
            onChange={(val) => void handleRoleChange(p, val)}
            options={ROLE_OPTIONS}
            labelRender={(opt) => {
              const meta = ROLE_META[opt.value as Role]
              if (!meta) return <span>{opt.label as string}</span>
              return <RoleTag $role={opt.value as Role}>{meta.icon} {meta.label}</RoleTag>
            }}
          />
        )
      },
    },
    {
      title: 'Expenses',
      key: 'can_add_expenses',
      width: 110,
      align: 'center' as const,
      render: (_: unknown, p: Profile) => {
        const isRemoved = p.is_active === false
        return (
          <Tooltip title={p.can_add_expenses ? 'Can add expenses' : 'View only'}>
            <Switch size="small" checked={p.can_add_expenses} disabled={isRemoved} onChange={(checked) => void handlePermissionChange(p, checked)} />
          </Tooltip>
        )
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      align: 'right' as const,
      render: (_: unknown, p: Profile) => {
        const isRemoved = p.is_active === false
        const isSelf    = p.id === userId
        return (
          <Flex gap={4} justify="flex-end">
            <Tooltip title="Edit user">
              <Button size="small" icon={<EditOutlined />} onClick={() => setEditUser(p)} disabled={isRemoved} />
            </Tooltip>
            {isRemoved ? (
              <Tooltip title="Reactivate user">
                <RestoreBtn size="small" icon={<CheckCircleOutlined />} onClick={() => void handleRestoreUser(p)} />
              </Tooltip>
            ) : (
              <Tooltip title={isSelf ? "Can't deactivate yourself" : 'Deactivate user'}>
                <DangerBtn size="small" icon={<DeleteOutlined />} disabled={isSelf} onClick={() => setDeleteTarget(p)} />
              </Tooltip>
            )}
          </Flex>
        )
      },
    },
  ]

  if (profileLoading) {
    return (
      <PageStack>
        <SectionBlock>{[1,2,3,4,5].map((i) => <SkeletonRow key={i} />)}</SectionBlock>
      </PageStack>
    )
  }

  if (!isAdmin) {
    return <Result status="403" title="Admin access only" subTitle="This section is restricted to flat admins." />
  }

  const isLoading =
    profilesQuery.isLoading || memberCountQuery.isLoading ||
    roomsQuery.isLoading || bedsQuery.isLoading || assignmentsQuery.isLoading

  const error =
    (profilesQuery.error as Error | null) ??
    (memberCountQuery.error as Error | null) ??
    (roomsQuery.error as Error | null)

  return (
    <PageWrap>
      <PageStack>
        <PageHeader
          title="Admin Panel"
          subtitle="Manage flatmates, roles, permissions, and flat settings."
          breadcrumbs={[{ title: 'Home', path: '/' }, { title: 'Admin Panel' }]}
          actions={
            <Space wrap>
              <Button icon={<DownloadOutlined />} onClick={() => void exportUsersToExcel(allProfiles)}>Export</Button>
              <Button type="primary" icon={<UserAddOutlined />} onClick={() => setAddUserOpen(true)}>Add User</Button>
            </Space>
          }
        />

        <QueryState isLoading={isLoading} error={error}>
          <ResponsiveGrid>
            <SummaryStat title="Total Users"  value={allProfiles.length} subtitle="All flatmates" icon={<TeamOutlined />}   color="var(--primary)" />
            <SummaryStat title="Admins"       value={adminCount}         subtitle="Admin role"     icon={<CrownOutlined />}  color="#cf1322" />
            <SummaryStat title="Cooks"        value={cookCount}          subtitle="Cook role"      icon={<CoffeeOutlined />} color="#d46b08" />
            <SummaryStat title="Deactivated"  value={removedCount}       subtitle="Inactive"       icon={<StopOutlined />}   color="#8c8c8c" />
          </ResponsiveGrid>

          <SectionBlock>
            <Flex align="center" justify="space-between" wrap gap={10} style={{ marginBottom: 14 }}>
              <Flex align="center" gap={6}>
                <TeamOutlined style={{ color: 'var(--primary)', fontSize: 15 }} />
                <Typography.Title level={5} style={{ margin: 0, color: 'var(--text-strong)' }}>User Management</Typography.Title>
                <Tag style={{ marginLeft: 4 }}>{filtered.length}</Tag>
              </Flex>
              <ToolbarWrap>
                <Input
                  prefix={<SearchOutlined style={{ color: 'var(--text-muted)', fontSize: 12 }} />}
                  placeholder="Search by name…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  allowClear
                />
                <FilterSelect
                  value={roleFilter}
                  onChange={(v) => setRoleFilter(v as Role | 'all')}
                  style={{ width: 120, height: 34 }}
                  options={[{ label: 'All Roles', value: 'all' }, ...ROLE_OPTIONS]}
                />
                <FilterSelect
                  value={statusFilter}
                  onChange={(v) => setStatusFilter(v as 'all' | 'active' | 'removed')}
                  style={{ width: 130, height: 34 }}
                  options={[
                    { label: 'All Status',  value: 'all' },
                    { label: 'Active',      value: 'active' },
                    { label: 'Deactivated', value: 'removed' },
                  ]}
                />
              </ToolbarWrap>
            </Flex>

            {!isMobile ? (
              profilesQuery.isLoading ? (
                <Space direction="vertical" style={{ width: '100%' }}>
                  {[1,2,3,4,5].map((i) => <SkeletonRow key={i} />)}
                </Space>
              ) : filtered.length === 0 ? (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={
                  <Typography.Text style={{ color: 'var(--text-muted)' }}>No users match your filters.</Typography.Text>
                } />
              ) : (
                <Table<Profile>
                  rowKey="id"
                  size="small"
                  columns={columns}
                  dataSource={filtered}
                  pagination={{ pageSize: 10, hideOnSinglePage: true, size: 'small',
                    showTotal: (total, range) => `${range[0]}–${range[1]} of ${total}` }}
                  scroll={{ x: 500 }}
                />
              )
            ) : (
              profilesQuery.isLoading ? (
                <Space direction="vertical" style={{ width: '100%' }}>
                  {[1,2,3].map((i) => <Skeleton key={i} active avatar paragraph={{ rows: 2 }} />)}
                </Space>
              ) : filtered.length === 0 ? (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No users match your filters." />
              ) : (
                <Space direction="vertical" size={10} style={{ width: '100%' }}>
                  {filtered.map((p) => {
                    const isRemoved = p.is_active === false
                    const isSelf    = p.id === userId
                    return (
                      <UserCard key={p.id} $removed={isRemoved}>
                        <CardTop>
                          <Avatar size={40} style={{ background: isRemoved ? '#bfbfbf' : avatarColor(p.full_name), color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                            {initials(p.full_name)}
                          </Avatar>
                          <CardMeta>
                            <Typography.Text strong style={{ color: isRemoved ? 'var(--text-muted)' : 'var(--text-strong)', display: 'block', fontSize: 14, textDecoration: isRemoved ? 'line-through' : 'none' }}>
                              {p.full_name}
                            </Typography.Text>
                            <Flex gap={6} align="center" style={{ marginTop: 3 }}>
                              <RoleTag $role={p.role}>{ROLE_META[p.role]?.icon} {ROLE_META[p.role]?.label}</RoleTag>
                              <StatusDot $active={!isRemoved}>{isRemoved ? 'Deactivated' : 'Active'}</StatusDot>
                            </Flex>
                          </CardMeta>
                          <Button size="small" icon={<EditOutlined />} disabled={isRemoved} onClick={() => setEditUser(p)} />
                        </CardTop>
                        <CardActions>
                          <CardRow>
                            <Typography.Text style={{ fontSize: 12, color: 'var(--text-muted)', width: 60 }}>Role</Typography.Text>
                            <Select size="small" style={{ flex: 1 }} value={p.role} disabled={isRemoved} onChange={(val) => void handleRoleChange(p, val)} options={ROLE_OPTIONS} />
                          </CardRow>
                          <CardRow>
                            <Typography.Text style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1 }}>Can Add Expenses</Typography.Text>
                            <Switch size="small" checked={p.can_add_expenses} disabled={isRemoved} onChange={(checked) => void handlePermissionChange(p, checked)} />
                          </CardRow>
                          {isRemoved ? (
                            <RestoreBtn block icon={<CheckCircleOutlined />} onClick={() => void handleRestoreUser(p)}>Reactivate User</RestoreBtn>
                          ) : (
                            <DangerBtn block icon={<DeleteOutlined />} disabled={isSelf} onClick={() => setDeleteTarget(p)}>
                              {isSelf ? "Can't deactivate yourself" : 'Deactivate User'}
                            </DangerBtn>
                          )}
                        </CardActions>
                      </UserCard>
                    )
                  })}
                </Space>
              )
            )}
          </SectionBlock>

          <SectionBlock>
            <Flex align="center" gap={8} style={{ marginBottom: 16 }}>
              <TeamOutlined style={{ color: 'var(--primary)', fontSize: 15 }} />
              <Typography.Title level={5} style={{ margin: 0, color: 'var(--text-strong)' }}>
                Bill Distribution
              </Typography.Title>
            </Flex>

            {/* Active members preview */}
            <div style={{
              background: 'var(--content-bg)',
              border: '1px solid var(--card-border)',
              borderRadius: 10,
              padding: '12px 14px',
              marginBottom: 16,
            }}>
              <Typography.Text style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: 10 }}>
                Active Flatmates ({allProfiles.filter(p => p.is_active !== false).length})
              </Typography.Text>
              <Flex wrap gap={6}>
                {allProfiles
                  .filter(p => p.is_active !== false)
                  .map(p => (
                    <Flex key={p.id} align="center" gap={5} style={{
                      padding: '4px 10px 4px 4px',
                      borderRadius: 20,
                      background: 'var(--card-bg)',
                      border: '1px solid var(--card-border)',
                    }}>
                      <Avatar size={20} style={{ background: avatarColor(p.full_name), color: '#fff', fontSize: 9, fontWeight: 700, flexShrink: 0 }}>
                        {initials(p.full_name)}
                      </Avatar>
                      <Typography.Text style={{ fontSize: 12, color: 'var(--text-strong)', fontWeight: 500 }}>
                        {p.full_name.split(' ')[0]}
                      </Typography.Text>
                    </Flex>
                  ))
                }
              </Flex>
            </div>

            {/* Member count editor */}
            <Flex align="flex-start" gap={12} wrap>
              <div style={{ flex: 1, minWidth: 200 }}>
                <Typography.Text style={{ fontSize: 13, color: 'var(--text-strong)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                  Members sharing the bill
                </Typography.Text>
                <Typography.Text style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 10 }}>
                  Fixed monthly expenses are split equally among this many flatmates.
                </Typography.Text>
                <Flex align="center" gap={8} wrap>
                  <InputNumber
                    min={1}
                    max={50}
                    value={memberCountDraft ?? memberCount}
                    onChange={(v) => setMemberCountDraft(v)}
                    style={{ width: 100 }}
                    size="large"
                  />
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    loading={saveMemberCount.isPending}
                    onClick={() => void handleSaveMemberCount()}
                    size="large"
                  >
                    Save
                  </Button>
                  {allProfiles.filter(p => p.is_active !== false).length !== memberCount && (
                    <Button
                      size="large"
                      onClick={() => setMemberCountDraft(allProfiles.filter(p => p.is_active !== false).length)}
                    >
                      Use active count ({allProfiles.filter(p => p.is_active !== false).length})
                    </Button>
                  )}
                </Flex>
              </div>

              {/* Live preview */}
              <div style={{
                background: 'var(--primary-soft)',
                border: '1px solid var(--primary)',
                borderRadius: 10,
                padding: '12px 16px',
                minWidth: 160,
                flexShrink: 0,
              }}>
                <Typography.Text style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: 4 }}>
                  Current setting
                </Typography.Text>
                <Typography.Text style={{ fontSize: 28, fontWeight: 800, color: 'var(--primary)', display: 'block', lineHeight: 1.1 }}>
                  {memberCountDraft ?? memberCount}
                </Typography.Text>
                <Typography.Text style={{ fontSize: 12, color: 'var(--primary)', opacity: 0.8 }}>
                  flatmates splitting bills
                </Typography.Text>
              </div>
            </Flex>
          </SectionBlock>

          <SectionBlock>
            <Typography.Title level={5} style={{ margin: '0 0 12px', color: 'var(--text-strong)' }}>Flat Layout &amp; Bed Assignments</Typography.Title>
            <Typography.Text style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'block', marginBottom: 16 }}>Click any bed to assign a flatmate.</Typography.Text>
            <FlatFloorplan rooms={rooms} beds={beds} assignments={assignments} profiles={allProfiles} isAdmin saving={assignBed.isPending} onAssign={handleAssign} />
          </SectionBlock>

        </QueryState>
      </PageStack>

      {deleteTarget && (
        <DeleteUserModal
          profile={deleteTarget}
          submitting={updateProfile.isPending}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => void handleDeleteUser(deleteTarget)}
        />
      )}

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
    </PageWrap>
  )
}

/* ─── Delete User Modal ───────────────────────────────────────────────────── */

function DeleteUserModal({ profile, submitting, onClose, onConfirm }: {
  profile: Profile; submitting: boolean; onClose: () => void; onConfirm: () => void
}) {
  return (
    <Modal
      open
      title={<Flex align="center" gap={8}><WarningOutlined style={{ color: '#cf1322' }} /><span>Deactivate User</span></Flex>}
      okText="Yes, Deactivate"
      okButtonProps={{ danger: true, loading: submitting }}
      cancelText="Cancel"
      onCancel={onClose}
      onOk={onConfirm}
      width="min(420px, 95vw)"
    >
      <div style={{ padding: '8px 0 4px' }}>
        <Flex align="center" gap={12} style={{ marginBottom: 16 }}>
          <Avatar size={44} style={{ background: avatarColor(profile.full_name), color: '#fff', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
            {initials(profile.full_name)}
          </Avatar>
          <div>
            <Typography.Text strong style={{ color: 'var(--text-strong)', display: 'block', fontSize: 15 }}>{profile.full_name}</Typography.Text>
            <RoleTag $role={profile.role}>{ROLE_META[profile.role]?.icon} {ROLE_META[profile.role]?.label}</RoleTag>
          </div>
        </Flex>
        <Alert
          type="warning"
          showIcon
          title="Are you sure you want to deactivate this user?"
          description="This user will no longer be able to log in. They will see: 'Your account has been deactivated. Please contact Admin.' You can reactivate them at any time."
        />
      </div>
    </Modal>
  )
}

/* ─── Add User Modal ──────────────────────────────────────────────────────── */

interface AddUserFormValues {
  fullName: string; email: string; password: string; role: Role; canAddExpenses: boolean
}

function AddUserModal({ submitting, onClose, onSubmit }: {
  submitting: boolean; onClose: () => void; onSubmit: (values: AddUserFormValues) => Promise<void>
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
      title={<Flex align="center" gap={8}><UserAddOutlined style={{ color: 'var(--primary)' }} /><span>Add New Flatmate</span></Flex>}
      okText="Create Account"
      confirmLoading={submitting}
      onCancel={onClose}
      onOk={() => void handleOk()}
      width="min(460px, 95vw)"
    >
      <Alert type="info" showIcon style={{ marginBottom: 16, marginTop: 8 }}
        title="Make sure email confirmation is disabled in Supabase Auth settings for instant access." />
      <Form form={form} layout="vertical" initialValues={{ role: 'user', canAddExpenses: false }}>
        <Form.Item label="Full Name" name="fullName" rules={[{ required: true, message: 'Enter full name.' }]}>
          <Input prefix={<UserOutlined style={{ color: 'var(--text-muted)' }} />} placeholder="Enter full name" />
        </Form.Item>
        <Form.Item label="Email Address" name="email" rules={[{ required: true, message: 'Enter email.' }, { type: 'email', message: 'Enter a valid email.' }]}>
          <Input prefix={<MailOutlined style={{ color: 'var(--text-muted)' }} />} placeholder="Enter email address" />
        </Form.Item>
        <Form.Item label="Password" name="password" rules={[{ required: true, message: 'Enter password.' }, { min: 6, message: 'Password must be at least 6 characters.' }]}>
          <Input.Password prefix={<LockOutlined style={{ color: 'var(--text-muted)' }} />} placeholder="Minimum 6 characters" />
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

function EditUserModal({ profile, submitting, onClose, onSave, onRoleChange, onPermissionChange }: {
  profile: Profile; submitting: boolean; onClose: () => void
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
          <Avatar size={28} style={{ background: avatarColor(profile.full_name), color: '#fff', fontWeight: 700, fontSize: 11 }}>
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
      <Form form={form} layout="vertical"
        initialValues={{ fullName: profile.full_name, role: profile.role, canAddExpenses: profile.can_add_expenses }}
        style={{ paddingTop: 8 }}
      >
        <Form.Item label="Full Name" name="fullName" rules={[{ required: true, message: 'Name is required.' }]}>
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
