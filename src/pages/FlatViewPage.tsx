import { Suspense, lazy } from 'react'
import { LoadingOutlined } from '@ant-design/icons'
import { PageHeader } from '@/components/PageHeader'
import { PageStack } from '@/components/Glass'

const FlatView3D = lazy(() => import('@/components/flat-view-3d/FlatView3D'))

export function FlatViewPage() {
  return (
    <PageStack>
      <PageHeader
        title="3D Flat View"
        subtitle="Interactive 3D apartment — click any bed to assign a flatmate (admin only). Orbit, zoom, and pan to explore."
      />
      <Suspense
        fallback={
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            width: '100%',
          }}>
            <LoadingOutlined style={{ fontSize: 48, color: '#909ffa' }} spin />
          </div>
        }
      >
        <FlatView3D />
      </Suspense>
    </PageStack>
  )
}
