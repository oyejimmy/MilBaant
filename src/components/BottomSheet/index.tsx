import type { ReactNode } from 'react'
import { Drawer } from 'antd'
import type { DrawerProps } from 'antd'
import { useMobileLayout } from '@/hooks/useResponsive'

interface BottomSheetProps extends Omit<DrawerProps, 'placement'> {
  children: ReactNode
  open: boolean
  onClose: () => void
  title?: string
  height?: string | number
  forceBottomSheet?: boolean
}

/**
 * BottomSheet - Mobile-friendly modal alternative
 * 
 * On mobile: Slides up from bottom (bottom sheet)
 * On desktop: Shows as a regular right-side drawer
 * 
 * Use forceBottomSheet={true} to always use bottom sheet on all devices
 */
export function BottomSheet({
  children,
  open,
  onClose,
  title,
  height = 'auto',
  forceBottomSheet = false,
  ...drawerProps
}: BottomSheetProps) {
  const isMobile = useMobileLayout()
  const useBottomSheet = forceBottomSheet || isMobile

  return (
    <Drawer
      {...drawerProps}
      open={open}
      onClose={onClose}
      title={title}
      placement={useBottomSheet ? 'bottom' : 'right'}
      height={useBottomSheet ? height : undefined}
      width={useBottomSheet ? undefined : 480}
      classNames={{
        body: isMobile ? 'mobile-drawer-body' : undefined,
        header: isMobile ? 'mobile-drawer-header' : undefined,
      }}
      style={{
        ...(useBottomSheet && {
          borderRadius: '16px 16px 0 0',
        }),
        ...drawerProps.style,
      }}
    >
      {children}
    </Drawer>
  )
}
