import { Button, Tooltip } from 'antd'
import type { ButtonProps } from 'antd'
import type { ReactNode } from 'react'
import styled from 'styled-components'
import { useButtonSize } from '@/hooks/useResponsive'

const StyledButton = styled(Button)<{ $touchFriendly: boolean }>`
  ${({ $touchFriendly }) =>
    $touchFriendly &&
    `
    min-width: 44px  ;
    min-height: 44px  ;
    display: flex  ;
    align-items: center  ;
    justify-content: center  ;
    padding: 0  ;
  `}
`

interface IconButtonProps extends Omit<ButtonProps, 'size'> {
  icon: ReactNode
  tooltip?: string
  touchFriendly?: boolean
  ariaLabel?: string
}

/**
 * IconButton - Touch-friendly icon button
 * 
 * Automatically adjusts size for mobile (44x44px minimum)
 * Shows tooltip on desktop, uses aria-label for accessibility
 */
export function IconButton({
  icon,
  tooltip,
  touchFriendly = true,
  ariaLabel,
  ...buttonProps
}: IconButtonProps) {
  const buttonSize = useButtonSize()

  const button = (
    <StyledButton
      {...buttonProps}
      icon={icon}
      size={buttonSize}
      $touchFriendly={touchFriendly}
      aria-label={ariaLabel || tooltip}
      shape={buttonProps.shape || 'circle'}
    />
  )

  // Only show tooltip on desktop
  if (tooltip && buttonSize === 'middle') {
    return <Tooltip title={tooltip}>{button}</Tooltip>
  }

  return button
}
