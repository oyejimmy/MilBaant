/**
 * UI Helper Functions
 * Reusable utilities for consistent UI patterns
 */

const AVATAR_COLORS = [
  '#909ffa', '#52c41a', '#fa8c16', '#13c2c2',
  '#eb2f96', '#722ed1', '#1c8ee5', '#f5222d',
]

/**
 * Generate consistent avatar color based on name
 */
export function getAvatarColor(name: string): string {
  let hash = 0
  for (const ch of name) {
    hash = ch.charCodeAt(0) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

/**
 * Get initials from full name (max 2 characters)
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

/**
 * Get status color based on balance
 */
export function getBalanceColor(balance: number): string {
  if (balance > 0.01) return '#52c41a' // green
  if (balance < -0.01) return '#ff4d4f' // red
  return '#909ffa' // blue
}

/**
 * Get status type based on balance
 */
export function getBalanceStatus(balance: number): 'surplus' | 'deficit' | 'zero' {
  if (balance > 0.01) return 'surplus'
  if (balance < -0.01) return 'deficit'
  return 'zero'
}
