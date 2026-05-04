import { DatePicker } from 'antd'
import { CalendarOutlined } from '@ant-design/icons'
import type { Dayjs } from 'dayjs'

interface MonthFilterProps {
  value: Dayjs
  onChange: (date: Dayjs) => void
  size?: 'small' | 'middle' | 'large'
  style?: React.CSSProperties
}

export function MonthFilter({ value, onChange, size = 'large', style }: MonthFilterProps) {
  return (
    <DatePicker
      value={value}
      onChange={(date) => date && onChange(date)}
      picker="month"
      format="MMMM YYYY"
      size={size}
      suffixIcon={<CalendarOutlined />}
      style={{ minWidth: 200, ...style }}
    />
  )
}
