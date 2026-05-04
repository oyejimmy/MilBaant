import { Breadcrumb } from 'antd'
import { HomeOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { ActionsRow, PageSubtitle, PageTitle } from '@/components/Glass/index'

const HeaderWrap = styled.div`
  padding: 0;
`

const TitleBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
  flex: 1;
`

const ActionsBlock = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
`

const BreadcrumbWrap = styled.div`
  margin-bottom: 8px;

  .ant-breadcrumb { font-size: 12px; }

  .ant-breadcrumb-link {
    color: var(--text-muted);
    transition: color 0.15s ease;
    &:hover { color: var(--primary); }
  }

  .ant-breadcrumb-separator {
    color: var(--text-muted);
    opacity: 0.4;
  }
`

export interface BreadcrumbItem {
  title: string
  path?: string
  icon?: React.ReactNode
}

export function PageHeader({
  title,
  subtitle,
  actions,
  breadcrumbs,
}: {
  title: string
  subtitle: string
  actions?: React.ReactNode
  breadcrumbs?: BreadcrumbItem[]
}) {
  const navigate = useNavigate()

  const defaultCrumbs: BreadcrumbItem[] = [
    { title: 'Home', path: '/', icon: <HomeOutlined /> },
    { title },
  ]

  const crumbs = breadcrumbs ?? defaultCrumbs

  return (
    <HeaderWrap>
      {crumbs.length > 0 && (
        <BreadcrumbWrap>
          <Breadcrumb
            items={crumbs.map((crumb, i) => ({
              title: crumb.path && i < crumbs.length - 1 ? (
                <span
                  onClick={() => crumb.path && navigate(crumb.path)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}
                >
                  {crumb.icon}{crumb.title}
                </span>
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  {crumb.icon}{crumb.title}
                </span>
              ),
            }))}
          />
        </BreadcrumbWrap>
      )}
      <ActionsRow>
        <TitleBlock>
          <PageTitle>{title}</PageTitle>
          <PageSubtitle>{subtitle}</PageSubtitle>
        </TitleBlock>
        {actions && <ActionsBlock>{actions}</ActionsBlock>}
      </ActionsRow>
    </HeaderWrap>
  )
}
