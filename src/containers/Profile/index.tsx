import { useCallback, useEffect, useRef, useState } from 'react'
import {
  App,
  Avatar,
  Button,
  Flex,
  Form,
  Grid,
  Input,
  Tag,
  Typography,
} from 'antd'
import {
  CameraOutlined,
  CheckCircleOutlined,
  CoffeeOutlined,
  CrownOutlined,
  EditOutlined,
  IdcardOutlined,
  PhoneOutlined,
  SafetyOutlined,
  SaveOutlined,
  UserOutlined,
} from '@ant-design/icons'
import styled, { keyframes } from 'styled-components'
import { useDropzone } from 'react-dropzone'
import { PageStack } from '@/components/Glass/index'
import { useAuth } from '@/hooks/useAuth'
import { useUpdateOwnProfile } from '@/hooks/useProfiles'
import { uploadAvatar } from '@/lib/storage'
import type { Role } from '@/lib/types'

const { useBreakpoint } = Grid

/* ── Animations ─────────────────────────────────────────────────────────── */

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
`

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.6; }
`

/* ── Styled components ──────────────────────────────────────────────────── */

const PageWrap = styled.div`
  animation: ${fadeUp} 0.25s ease;
  max-width: 1200px;
  margin: 0 auto;
`

const ProfileHeader = styled.div`
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;

  @media (max-width: 767px) {
    padding: 16px;
    flex-direction: column;
    align-items: stretch;
  }
`

const ProfileIdentity = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 0;

  @media (max-width: 767px) {
    flex-direction: column;
    text-align: center;
  }
`

const AvatarWrap = styled.div`
  position: relative;
  display: inline-block;
  flex-shrink: 0;
`

const AvatarOverlay = styled.div`
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
  cursor: pointer;

  ${AvatarWrap}:hover & {
    opacity: 1;
  }
`

const UploadingPulse = styled.div`
  animation: ${pulse} 1.2s ease infinite;
`

const IdentityText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  flex: 1;
`

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
  flex-shrink: 0;

  @media (max-width: 767px) {
    width: 100%;
    
    button {
      flex: 1;
    }
  }
`

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;

  @media (min-width: 768px) {
    grid-template-columns: 2fr 1fr;
    gap: 20px;
  }
`

const Section = styled.div`
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 12px;
  padding: 20px;

  @media (max-width: 767px) {
    padding: 16px;
  }
`

const SectionTitle = styled.div`
  font-size: 13px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;

  svg {
    font-size: 14px;
  }
`

const DataGrid = styled.div`
  display: grid;
  gap: 16px;
`

const DataRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-light);

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
`

const DataLabel = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.3px;
`

const DataValue = styled.div`
  font-size: 15px;
  font-weight: 500;
  color: var(--text-strong);
  word-break: break-word;
`

const StatusGrid = styled.div`
  display: grid;
  gap: 12px;
`

const StatusCard = styled.div`
  background: var(--card-bg);
  border: none;
  border-radius: 10px;
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  &:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.1), 0 2px 6px rgba(0,0,0,0.06); }
`

const StatusIcon = styled.div<{ $variant: 'success' | 'info' | 'warning' }>`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
  
  ${({ $variant }) => {
    if ($variant === 'success') return `
      background: rgba(76, 175, 80, 0.12);
      color: var(--success);
    `
    if ($variant === 'info') return `
      background: var(--primary-soft);
      color: var(--primary);
    `
    return `
      background: rgba(249, 168, 37, 0.12);
      color: var(--warning);
    `
  }}
`

const StatusText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
`

const StatusLabel = styled.div`
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.3px;
`

const StatusValue = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: var(--text-strong);
`

/* ── Role config ─────────────────────────────────────────────────────────── */

const ROLE_META: Record<Role, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
  admin: { color: '#cf1322', bg: '#fff1f0', icon: <CrownOutlined />,  label: 'Administrator'  },
  user:  { color: '#595959', bg: '#f5f5f5', icon: <UserOutlined />,   label: 'Member' },
  cook:  { color: '#d46b08', bg: '#fff7e6', icon: <CoffeeOutlined />, label: 'Cook'   },
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

const AVATAR_COLORS = [
  '#1c8ee5', '#6a6a6a', '#52c41a', '#fa8c16',
  '#13c2c2', '#eb2f96', '#722ed1', '#cf1322',
]

function avatarColor(name: string) {
  let h = 0
  for (const ch of name) h = ch.charCodeAt(0) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

/* ── Form values ─────────────────────────────────────────────────────────── */

interface ProfileFormValues {
  full_name: string
  phone: string
  bio: string
}

/* ── Component ───────────────────────────────────────────────────────────── */

export function ProfilePage() {
  const { profile, userId, email } = useAuth()
  const { message } = App.useApp()
  const screens = useBreakpoint()
  const isMobile = !screens.md
  const updateProfile = useUpdateOwnProfile()

  const [editing, setEditing] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [form] = Form.useForm<ProfileFormValues>()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sync form when profile loads
  useEffect(() => {
    if (profile) {
      form.setFieldsValue({
        full_name: profile.full_name,
        phone:     profile.phone ?? '',
        bio:       profile.bio   ?? '',
      })
    }
  }, [profile, form])

  // ── Avatar upload via dropzone ──────────────────────────────────────────
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (!file || !userId) return

      if (file.size > 3 * 1024 * 1024) {
        void message.error('Image must be smaller than 3 MB.')
        return
      }

      setAvatarPreview(URL.createObjectURL(file))
      setUploadingAvatar(true)

      try {
        const url = await uploadAvatar(userId, file)
        await updateProfile.mutateAsync({ userId, avatarUrl: url })
        void message.success('Profile picture updated.')
      } catch (err) {
        setAvatarPreview(null)
        void message.error(err instanceof Error ? err.message : 'Upload failed.')
      } finally {
        setUploadingAvatar(false)
      }
    },
    [userId, updateProfile, message],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1,
    noClick: true,
  })

  async function handleSave() {
    if (!userId) return
    try {
      const values = await form.validateFields()
      await updateProfile.mutateAsync({
        userId,
        fullName: values.full_name.trim(),
        phone:    values.phone.trim() || undefined,
        bio:      values.bio.trim()   || undefined,
      })
      void message.success('Profile updated.')
      setEditing(false)
    } catch (err) {
      if (err instanceof Error) void message.error(err.message)
    }
  }

  if (!profile) return null

  const displayAvatar = avatarPreview ?? profile.avatar_url ?? null
  const avatarSize = isMobile ? 64 : 72
  const roleMeta = ROLE_META[profile.role]

  return (
    <PageWrap>
      <PageStack>

        {/* ── Profile header card ── */}
        <ProfileHeader>
          <ProfileIdentity>
            {/* Avatar */}
            <div {...getRootProps()}>
              <input {...getInputProps()} />
              <AvatarWrap
                onClick={() => fileInputRef.current?.click()}
                title="Click or drag to change photo"
              >
                {uploadingAvatar ? (
                  <UploadingPulse>
                    <Avatar
                      size={avatarSize}
                      src={displayAvatar}
                      style={{
                        background: avatarColor(profile.full_name),
                        border: '3px solid var(--card-bg)',
                        fontSize: avatarSize * 0.35,
                        fontWeight: 700,
                      }}
                    >
                      {!displayAvatar && initials(profile.full_name)}
                    </Avatar>
                  </UploadingPulse>
                ) : (
                  <Avatar
                    size={avatarSize}
                    src={displayAvatar}
                    style={{
                      background: avatarColor(profile.full_name),
                      border: '3px solid var(--card-bg)',
                      fontSize: avatarSize * 0.35,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {!displayAvatar && initials(profile.full_name)}
                  </Avatar>
                )}
                <AvatarOverlay>
                  <CameraOutlined style={{ color: '#fff', fontSize: 18 }} />
                </AvatarOverlay>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) void onDrop([file])
                    e.target.value = ''
                  }}
                />
              </AvatarWrap>
            </div>

            {/* Name + role + email */}
            <IdentityText>
              <Typography.Title
                level={isMobile ? 4 : 3}
                style={{ margin: 0, color: 'var(--text-strong)', lineHeight: 1.2 }}
              >
                {profile.full_name}
              </Typography.Title>
              <Flex align="center" gap={8} wrap="wrap" justify={isMobile ? 'center' : 'flex-start'}>
                <Tag
                  style={{
                    background: roleMeta?.bg,
                    color: roleMeta?.color,
                    border: `1px solid ${roleMeta?.color ?? '#d9d9d9'}30`,
                    borderRadius: 20,
                    fontWeight: 700,
                    fontSize: 12,
                    margin: 0,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  {roleMeta?.icon} {roleMeta?.label}
                </Tag>
                {profile.is_active !== false ? (
                  <Tag color="success" style={{ margin: 0, borderRadius: 20 }}>Active</Tag>
                ) : (
                  <Tag color="error" style={{ margin: 0, borderRadius: 20 }}>Deactivated</Tag>
                )}
              </Flex>
              <Typography.Text style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                {email}
              </Typography.Text>
            </IdentityText>
          </ProfileIdentity>

          {/* Action buttons */}
          <ActionButtons>
            {editing ? (
              <>
                <Button
                  onClick={() => { setEditing(false); form.resetFields() }}
                  style={{ flex: isMobile ? 1 : undefined }}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  loading={updateProfile.isPending}
                  onClick={() => void handleSave()}
                  style={{ flex: isMobile ? 1 : undefined }}
                >
                  Save
                </Button>
              </>
            ) : (
              <Button
                icon={<EditOutlined />}
                onClick={() => setEditing(true)}
                style={{ width: isMobile ? '100%' : undefined }}
              >
                Edit Profile
              </Button>
            )}
          </ActionButtons>
        </ProfileHeader>

        {/* ── Drag-to-upload hint ── */}
        {isDragActive && (
          <div style={{
            padding: '12px 16px',
            borderRadius: 10,
            border: '2px dashed var(--primary)',
            background: 'var(--primary-soft)',
            textAlign: 'center',
          }}>
            <Typography.Text style={{ color: 'var(--primary)', fontWeight: 600 }}>
              Drop image to update your profile picture
            </Typography.Text>
          </div>
        )}

        {/* ── Edit form ── */}
        {editing && (
          <Section>
            <SectionTitle>
              <EditOutlined />
              Edit Information
            </SectionTitle>
            <Form form={form} layout="vertical" requiredMark={false}>
              <Form.Item
                label="Full Name"
                name="full_name"
                rules={[{ required: true, message: 'Name is required.' }]}
              >
                <Input
                  prefix={<UserOutlined style={{ color: 'var(--text-muted)' }} />}
                  placeholder="Your full name"
                  size="large"
                />
              </Form.Item>

              <Form.Item label="Phone Number" name="phone">
                <Input
                  prefix={<PhoneOutlined style={{ color: 'var(--text-muted)' }} />}
                  placeholder="+92 300 0000000"
                  size="large"
                />
              </Form.Item>

              <Form.Item label="Bio" name="bio" style={{ marginBottom: 0 }}>
                <Input.TextArea
                  placeholder="A short bio about yourself…"
                  rows={3}
                  maxLength={200}
                  showCount
                  style={{ resize: 'none' }}
                />
              </Form.Item>
            </Form>
          </Section>
        )}

        {/* ── Main content grid (view mode) ── */}
        {!editing && (
          <ContentGrid>
            {/* Left: Contact details */}
            <Section>
              <SectionTitle>
                <IdcardOutlined />
                Contact Details
              </SectionTitle>
              <DataGrid>
                <DataRow>
                  <DataLabel>Email Address</DataLabel>
                  <DataValue style={{ fontSize: 14 }}>{email ?? '—'}</DataValue>
                </DataRow>
                <DataRow>
                  <DataLabel>Phone Number</DataLabel>
                  <DataValue style={{ color: profile.phone ? 'var(--text-strong)' : 'var(--text-disabled)' }}>
                    {profile.phone ?? 'Not set'}
                  </DataValue>
                </DataRow>
                {profile.bio && (
                  <DataRow>
                    <DataLabel>Bio</DataLabel>
                    <DataValue style={{ fontSize: 14, fontWeight: 400, lineHeight: 1.65, color: 'var(--text-secondary)' }}>
                      {profile.bio}
                    </DataValue>
                  </DataRow>
                )}
              </DataGrid>
            </Section>

            {/* Right: Account status */}
            <Section>
              <SectionTitle>
                <SafetyOutlined />
                Account Status
              </SectionTitle>
              <StatusGrid>
                <StatusCard>
                  <StatusIcon $variant={profile.is_active !== false ? 'success' : 'warning'}>
                    <CheckCircleOutlined />
                  </StatusIcon>
                  <StatusText>
                    <StatusLabel>Account</StatusLabel>
                    <StatusValue>{profile.is_active !== false ? 'Active' : 'Deactivated'}</StatusValue>
                  </StatusText>
                </StatusCard>

                <StatusCard>
                  <StatusIcon $variant="info">
                    {roleMeta?.icon}
                  </StatusIcon>
                  <StatusText>
                    <StatusLabel>Role</StatusLabel>
                    <StatusValue>{roleMeta?.label}</StatusValue>
                  </StatusText>
                </StatusCard>

                <StatusCard>
                  <StatusIcon $variant={profile.can_add_expenses ? 'success' : 'warning'}>
                    <UserOutlined />
                  </StatusIcon>
                  <StatusText>
                    <StatusLabel>Expense Access</StatusLabel>
                    <StatusValue>{profile.can_add_expenses ? 'Can add expenses' : 'View only'}</StatusValue>
                  </StatusText>
                </StatusCard>
              </StatusGrid>
            </Section>
          </ContentGrid>
        )}

      </PageStack>
    </PageWrap>
  )
}
