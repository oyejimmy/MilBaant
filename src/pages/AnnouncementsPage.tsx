import { useState } from 'react'
import {
  Button,
  Card,
  Popconfirm,
  Space,
  Typography,
  message,
} from 'antd'
import { DeleteOutlined, DownloadOutlined, PlusOutlined } from '@ant-design/icons'
import { AnnouncementComposer } from '@/components/AnnouncementComposer'
import { PageHeader } from '@/components/PageHeader'
import { QueryState } from '@/components/QueryState'
import { PageStack, SectionBlock } from '@/components/Glass'
import { useAnnouncements, useCreateAnnouncement, useDeleteAnnouncement } from '@/hooks/useAnnouncements'
import { useAuth } from '@/hooks/useAuth'
import { exportAnnouncementsToExcel } from '@/lib/export'
import { formatDateTime } from '@/lib/formatters'

export function AnnouncementsPage() {
  const [composerOpen, setComposerOpen] = useState(false)
  const { isAdmin, userId } = useAuth()
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
          <Space wrap>
            {isAdmin ? (
              <>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={() => void exportAnnouncementsToExcel(announcements)}
                >
                  Download Excel
                </Button>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setComposerOpen(true)}
                >
                  New Announcement
                </Button>
              </>
            ) : null}
          </Space>
        }
      />

      <QueryState
        isLoading={announcementsQuery.isLoading}
        error={(announcementsQuery.error as Error | null) ?? null}
        isEmpty={!announcements.length}
        emptyMessage="No announcements have been posted yet."
      >
        <SectionBlock>
          <Space direction="vertical" size={18} style={{ width: '100%' }}>
            {announcements.map((announcement) => (
              <Card
                key={announcement.id}
                extra={
                  isAdmin ? (
                    <Popconfirm
                      title="Delete this announcement?"
                      onConfirm={() => void handleDelete(announcement.id)}
                    >
                      <Button danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  ) : null
                }
              >
                <Space direction="vertical" size={8}>
                  <Typography.Title level={4} style={{ margin: 0, color: 'var(--text-strong)' }}>
                    {announcement.title}
                  </Typography.Title>
                  <Typography.Paragraph
                    style={{ margin: 0, color: 'var(--text-base)' }}
                  >
                    {announcement.content}
                  </Typography.Paragraph>
                  <Typography.Text style={{ color: 'var(--text-muted)' }}>
                    {announcement.creator?.full_name ?? 'Admin'} •{' '}
                    {formatDateTime(announcement.created_at)}
                  </Typography.Text>
                </Space>
              </Card>
            ))}
          </Space>
        </SectionBlock>
      </QueryState>

      <AnnouncementComposer
        open={composerOpen}
        confirmLoading={createAnnouncement.isPending}
        onClose={() => setComposerOpen(false)}
        onSubmit={handleCreate}
      />
    </PageStack>
  )
}
