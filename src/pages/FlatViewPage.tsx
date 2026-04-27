import { Suspense, lazy } from 'react'
import { LoadingOutlined } from '@ant-design/icons'
import { PageHeader } from '@/components/PageHeader'
import { PageStack } from '@/components/Glass'

const FlatViewKonva = lazy(() => import('@/components/flat-view/FlatViewKonva'))

export function FlatViewPage() {
  return (
    <PageStack>
      <PageHeader
        title="Flat View"
        subtitle="Interactive floor plan — click any bed to assign a flatmate. Admins can drag avatars to reassign."
      />
      <Suspense
        fallback={
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
            <LoadingOutlined style={{ fontSize: 36, color: '#909ffa' }} spin />
          </div>
        }
      >
        <FlatViewKonva />
      </Suspense>
    </PageStack>
  )
}
