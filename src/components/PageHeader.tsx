import styled from 'styled-components'
import { ActionsRow, PageIntro, PageSubtitle, PageTitle } from '@/components/Glass'

const TitleBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  flex: 1;
`

const ActionsBlock = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;

  @media (max-width: 767px) {
    width: 100%;

    .ant-space {
      width: 100%;
      flex-wrap: wrap;
    }

    .ant-space-item {
      flex: 1;
      min-width: 120px;
    }

    .ant-btn,
    .ant-picker {
      width: 100% !important;
    }
  }
`

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
        <TitleBlock>
          <PageTitle>{title}</PageTitle>
          <PageSubtitle>{subtitle}</PageSubtitle>
        </TitleBlock>
        {actions && <ActionsBlock>{actions}</ActionsBlock>}
      </ActionsRow>
    </PageIntro>
  )
}
