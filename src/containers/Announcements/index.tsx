import { useState } from 'react'
import {
  Button,
  Card,
  FloatButton,
  Popconfirm,
  Space,
  Typography,
  message,
} from 'antd'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { AnnouncementComposer } from '@/components/AnnouncementComposer'
import { PageHeader } from '@/components/PageHeader/index'
import { QueryState } from '@/components/QueryState'
import { PageStack, SectionBlock } from '@/components/Glass/index'
import { IconButton } from '@/components/IconButton/index'
import { useAnnouncements, useCreateAnnouncement, useDeleteAnnouncement } from '@/hooks/useAnnouncements'
import { useAuth } from '@/hooks/useAuth'
import { useResponsive, useButtonSize } from '@/hooks/useResponsive'
import { formatDateTime } from '@/lib/formatters'

export function AnnouncementsPage() {
  const [composerOpen, setComposerOpen] = useState(false)
  const { isAdmin, userId } = useAuth()
  const { isMobile } = useResponsive()
  const buttonSize = useButtonSize()
  const announcementsQuery = useAnnouncements()
  const createAnnouncement = useCreateAnnouncement()
  const deleteAnnouncement = useDeleteAnnouncement()

  const announcements = announcementsQuery.data ?? []

  async function handleCreate(values: { title: string; content: string }) {
    if (!userId) {
      message.error('You must be signed in.')
      return
    }

    try {
      await createAnnouncement.mutateAsync({ ...values, createdBy: userId })
      message.success('Announcement published.')
      setComposerOpen(false)
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : 'Unable to publish announcement.',
      )
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteAnnouncement.mutateAsync({ announcementId: id, userId: userId ?? '' })
      message.success('Announcement deleted.')
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : 'Unable to delete announcement.',
      )
    }
  }

  return (
    <PageStack>
      <PageHeader
        title="Announcements"
        subtitle="A simple flat-wide board for updates, reminders, and operational notices."
        actions={
          isAdmin ? (
            <Button
              type="primary"
              size={buttonSize}
              icon={<PlusOutlined />}
              onClick={() => setComposerOpen(true)}
            >
              New Announcement
            </Button>
          ) : null
        }
      />

      <QueryState
        isLoading={announcementsQuery.isLoading}
        error={(announcementsQuery.error as Error | null) ?? null}
      >
        <SectionBlock>
          {announcements.length === 0 ? (
            <Typography.Text type="secondary">No announcements have been posted yet.</Typography.Text>
          ) : (
          <Space direction="vertical" size={isMobile ? 12 : 18} style={{ width: '100%' }}>
            {announcements.map((announcement) => (
              <Card
                key={announcement.id}
                size={isMobile ? 'small' : 'default'}
                extra={
                  isAdmin ? (
                    <Popconfirm
                      title="Delete this announcement?"
                      onConfirm={() => void handleDelete(announcement.id)}
                    >
                      <IconButton
                        icon={<DeleteOutlined />}
                        tooltip="Delete"
                        danger
                        type="text"
                      />
                    </Popconfirm>
                  ) : null
                }
              >
                <Space direction="vertical" size={isMobile ? 6 : 8}>
                  <Typography.Title 
                    level={isMobile ? 5 : 4} 
                    style={{ margin: 0, color: 'var(--text-strong)' }}
                  >
                    {announcement.title}
                  </Typography.Title>
                  <Typography.Paragraph
                    style={{ 
                      margin: 0, 
                      color: 'var(--text-base)',
                      fontSize: isMobile ? '13px' : '14px',
                    }}
                  >
                    {announcement.content}
                  </Typography.Paragraph>
                  <Typography.Text 
                    style={{ 
                      color: 'var(--text-muted)',
                      fontSize: isMobile ? '11px' : '12px',
                    }}
                  >
                    {announcement.creator?.full_name ?? 'Admin'} •{' '}
                    {formatDateTime(announcement.created_at)}
                  </Typography.Text>
                </Space>
              </Card>
            ))}
          </Space>
          )}
        </SectionBlock>
      </QueryState>

      {/* Mobile: Floating Action Button */}
      {isAdmin && isMobile && (
        <FloatButton
          icon={<PlusOutlined />}
          type="primary"
          tooltip="New Announcement"
          style={{
            bottom: 72, // Above bottom nav (56px + 16px spacing)
            right: 16,
            width: 56,
            height: 56,
          }}
          onClick={() => setComposerOpen(true)}
        />
      )}

      <AnnouncementComposer
        open={composerOpen}
        confirmLoading={createAnnouncement.isPending}
        onClose={() => setComposerOpen(false)}
        onSubmit={handleCreate}
      />
    </PageStack>
  )
}
