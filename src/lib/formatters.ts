import dayjs, { type Dayjs } from 'dayjs'
import { DATE_FORMAT } from '@/lib/constants'

export const currencyFormatter = new Intl.NumberFormat('en-PK', {
  style: 'currency',
  currency: 'PKR',
  maximumFractionDigits: 2,
})

export function formatCurrency(value: number) {
  return currencyFormatter.format(Number.isFinite(value) ? value : 0)
}

export function formatDate(value: string) {
  return dayjs(value).format(DATE_FORMAT)
}

export function formatDateTime(value: string) {
  return dayjs(value).format('DD MMM YYYY, h:mm A')
}

export function formatMonthYear(value: Dayjs) {
  return value.format('MMMM YYYY')
}

export function getMonthRange(value: Dayjs) {
  return {
    start: value.startOf('month').format('YYYY-MM-DD'),
    end: value.endOf('month').format('YYYY-MM-DD'),
  }
}

export function isWeekendDate(value: Dayjs) {
  const weekday = value.day()
  return weekday === 0 || weekday === 6
}
