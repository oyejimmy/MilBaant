import { Space } from 'antd'
import { ActionsRow, PageIntro, PageSubtitle, PageTitle } from '@/components/Glass'

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle: string
  actions?: React.ReactNode
}) {
  return (
    <PageIntro>
      <ActionsRow>
        <Space direction="vertical" size={6} style={{ maxWidth: 760 }}>
          <PageTitle>{title}</PageTitle>
          <PageSubtitle>{subtitle}</PageSubtitle>
        </Space>
        {actions}
      </ActionsRow>
    </PageIntro>
  )
}
