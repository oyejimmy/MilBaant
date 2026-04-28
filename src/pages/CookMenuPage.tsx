import { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import {
  Button,
  Card,
  Col,
  Flex,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  message,
  Alert,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  CoffeeOutlined,
  EditOutlined,
  MoonOutlined,
  SaveOutlined,
  SunOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import styled from 'styled-components'
import { PageHeader } from '@/components/PageHeader'
import { QueryState } from '@/components/QueryState'
import { PageStack, SectionBlock } from '@/components/Glass'
import { useAuth } from '@/hooks/useAuth'
import { useProfiles } from '@/hooks/useProfiles'
import {
  useMenuByDate,
  useCreateMenu,
  useUpdateMenu,
} from '@/hooks/useDailyMenu'

/* ─── Types ───────────────────────────────────────────────────────────────── */

type EggType = 'fried' | 'boiled' | 'omelette' | 'none'

interface BreakfastPreference {
  userId: string
  userName: string
  paratha: boolean
  egg: EggType
  tea: boolean
  notes?: string
}

interface WeeklyDinner {
  day: string
  meal: string
  time: string
}

/* ─── Styled Components ───────────────────────────────────────────────────── */

const TonightCard = styled(Card)`
  background: linear-gradient(135deg, rgba(114, 46, 209, 0.08) 0%, rgba(114, 46, 209, 0.02) 100%);
  border: 2px solid rgba(114, 46, 209, 0.2);
  border-radius: 16px;
  margin-bottom: 24px;
  
  .ant-card-body {
    padding: 24px;
  }
`

const DayCard = styled(Card)<{ $isToday?: boolean }>`
  border-radius: 12px;
  border: 2px solid ${props => props.$isToday ? '#722ed1' : 'var(--card-border)'};
  background: ${props => props.$isToday ? 'rgba(114, 46, 209, 0.05)' : 'var(--card-bg)'};
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #722ed1;
    box-shadow: 0 4px 12px rgba(114, 46, 209, 0.15);
  }
  
  .ant-card-body {
    padding: 16px;
  }
`

const MealTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: var(--text-strong);
  margin-bottom: 8px;
`

const MealTime = styled.div`
  font-size: 13px;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 6px;
`

/* ─── Weekly Dinner Schedule ─────────────────────────────────────────────── */

const WEEKLY_DINNER: WeeklyDinner[] = [
  { day: 'Monday', meal: 'Chicken Karahi + Roti', time: '9:00 PM' },
  { day: 'Tuesday', meal: 'Daal Chawal + Salad', time: '9:00 PM' },
  { day: 'Wednesday', meal: 'Chicken Biryani', time: '9:00 PM' },
  { day: 'Thursday', meal: 'Aloo Keema + Roti', time: '9:00 PM' },
  { day: 'Friday', meal: 'Chicken Qorma + Roti', time: '9:00 PM' },
  { day: 'Saturday', meal: 'Pulao + Raita', time: '9:00 PM' },
  { day: 'Sunday', meal: 'Nihari + Naan', time: '9:00 PM' },
]

const FLATMATES = [
  'Babar Jamil Ur Rahman',
  'Ateeb Raza',
  'Ahmad Raza',
  'Sajid Ali',
  'Muhammad Haris',
  'Yasir Ajmal Mehmand',
]

const EGG_OPTIONS = [
  { label: 'Fried', value: 'fried' },
  { label: 'Boiled', value: 'boiled' },
  { label: 'Omelette', value: 'omelette' },
  { label: 'None', value: 'none' },
]

/* ─── Main Component ──────────────────────────────────────────────────────── */

export function CookMenuPage() {
  const [breakfastPrefs, setBreakfastPrefs] = useState<BreakfastPreference[]>([])
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<BreakfastPreference | null>(null)

  const { userId } = useAuth()
  const profilesQuery = useProfiles()
  const profiles = profilesQuery.data ?? []

  const todayStr = dayjs().format('YYYY-MM-DD')
  const todayMenuQuery = useMenuByDate(todayStr)
  const todayMenu = todayMenuQuery.data

  const createMenu = useCreateMenu()
  const updateMenu = useUpdateMenu()

  // Get today's day name
  const todayDayName = dayjs().format('dddd')
  const tonightDinner = WEEKLY_DINNER.find(d => d.day === todayDayName)

  // Check if editing is allowed (before 10 PM)
  const currentHour = dayjs().hour()
  const isEditingAllowed = currentHour < 22 // Before 10 PM

  // Initialize breakfast preferences
  useEffect(() => {
    if (profiles.length > 0 && breakfastPrefs.length === 0) {
      // Try to load from today's menu notes (stored as JSON)
      if (todayMenu?.notes) {
        try {
          const saved = JSON.parse(todayMenu.notes) as BreakfastPreference[]
          setBreakfastPrefs(saved)
          return
        } catch {
          // If parsing fails, use defaults
        }
      }

      // Default preferences
      const defaults: BreakfastPreference[] = FLATMATES.map((name) => {
        const profile = profiles.find(p => p.full_name === name)
        return {
          userId: profile?.id ?? name,
          userName: name,
          paratha: true,
          egg: 'fried',
          tea: false,
          notes: '',
        }
      })
      setBreakfastPrefs(defaults)
    }
  }, [profiles, todayMenu, breakfastPrefs.length])

  async function handleSaveBreakfast() {
    if (!userId) return

    try {
      const prefsJson = JSON.stringify(breakfastPrefs)

      if (todayMenu) {
        await updateMenu.mutateAsync({
          payload: {
            id: todayMenu.id,
            breakfast: 'Breakfast preferences updated',
            notes: prefsJson,
          },
          userId,
        })
      } else {
        await createMenu.mutateAsync({
          date: todayStr,
          breakfast: 'Breakfast preferences set',
          notes: prefsJson,
          createdBy: userId,
        })
      }

      message.success('Breakfast preferences saved!')
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Unable to save preferences.')
    }
  }

  function handleEditUser(record: BreakfastPreference) {
    setEditingUser({ ...record })
    setEditModalOpen(true)
  }

  function handleUpdateUser(values: Partial<BreakfastPreference>) {
    if (!editingUser) return

    const updated = breakfastPrefs.map(pref =>
      pref.userId === editingUser.userId
        ? { ...pref, ...values }
        : pref
    )
    setBreakfastPrefs(updated)
    setEditModalOpen(false)
    setEditingUser(null)
  }

  const breakfastColumns: ColumnsType<BreakfastPreference> = [
    {
      title: 'Flatmate',
      dataIndex: 'userName',
      key: 'userName',
      width: 200,
      render: (name: string) => (
        <Typography.Text strong style={{ color: 'var(--text-strong)' }}>
          {name}
        </Typography.Text>
      ),
    },
    {
      title: 'Paratha',
      dataIndex: 'paratha',
      key: 'paratha',
      width: 100,
      align: 'center',
      render: (value: boolean) => (
        value ? <Tag color="green">Yes</Tag> : <Tag color="default">No</Tag>
      ),
    },
    {
      title: 'Egg Type',
      dataIndex: 'egg',
      key: 'egg',
      width: 120,
      render: (value: EggType) => {
        const colors: Record<EggType, string> = {
          fried: 'orange',
          boiled: 'blue',
          omelette: 'gold',
          none: 'default',
        }
        return <Tag color={colors[value]}>{value.charAt(0).toUpperCase() + value.slice(1)}</Tag>
      },
    },
    {
      title: 'Tea',
      dataIndex: 'tea',
      key: 'tea',
      width: 100,
      align: 'center',
      render: (value: boolean) => (
        value ? <Tag color="cyan">Yes</Tag> : <Tag color="default">No</Tag>
      ),
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
      render: (value: string) => (
        value ? <Typography.Text style={{ fontSize: 12 }}>{value}</Typography.Text> : '—'
      ),
    },
    {
      title: 'Action',
      key: 'action',
      width: 100,
      render: (_: unknown, record: BreakfastPreference) => (
        <Button
          size="small"
          icon={<EditOutlined />}
          onClick={() => handleEditUser(record)}
          disabled={!isEditingAllowed}
        >
          Edit
        </Button>
      ),
    },
  ]

  const isLoading = profilesQuery.isLoading || todayMenuQuery.isLoading
  const error = (profilesQuery.error as Error | null) ?? (todayMenuQuery.error as Error | null)

  return (
    <PageStack>
      <PageHeader
        title="Daily Menu"
        subtitle="Manage breakfast preferences and view the weekly dinner schedule"
        actions={
          <Space>
            {!isEditingAllowed && (
              <Tag color="red" icon={<ClockCircleOutlined />}>
                Editing closed (after 10 PM)
              </Tag>
            )}
            {isEditingAllowed && (
              <Tag color="green" icon={<CheckCircleOutlined />}>
                Editing open until 10 PM
              </Tag>
            )}
          </Space>
        }
      />

      <QueryState isLoading={isLoading} error={error}>
        {/* Tonight's Dinner Highlight */}
        {tonightDinner && (
          <TonightCard>
            <Flex align="center" justify="space-between" wrap gap={16}>
              <div>
                <Flex align="center" gap={12} style={{ marginBottom: 8 }}>
                  <MoonOutlined style={{ fontSize: 28, color: '#722ed1' }} />
                  <div>
                    <Typography.Title level={3} style={{ margin: 0, color: '#722ed1' }}>
                      Tonight's Dinner
                    </Typography.Title>
                    <Typography.Text style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                      {dayjs().format('dddd, DD MMMM YYYY')}
                    </Typography.Text>
                  </div>
                </Flex>
                <Typography.Text style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-strong)', display: 'block', marginTop: 8 }}>
                  {tonightDinner.meal}
                </Typography.Text>
                <MealTime style={{ marginTop: 8, fontSize: 14 }}>
                  <ClockCircleOutlined />
                  Serving Time: {tonightDinner.time}
                </MealTime>
              </div>
              <Tag color="purple" style={{ fontSize: 13, padding: '4px 12px' }}>
                Fixed Menu
              </Tag>
            </Flex>
          </TonightCard>
        )}

        {/* Breakfast Preferences */}
        <SectionBlock>
          <Flex align="center" justify="space-between" style={{ marginBottom: 16 }} wrap gap={8}>
            <div>
              <Typography.Title level={4} style={{ margin: 0, color: 'var(--text-strong)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <SunOutlined style={{ color: '#faad14', fontSize: 20 }} />
                Breakfast Preferences
              </Typography.Title>
              <Typography.Text style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                Default: 1 Paratha + 1 Egg per person. Customize your preferences below.
              </Typography.Text>
            </div>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={() => void handleSaveBreakfast()}
              loading={createMenu.isPending || updateMenu.isPending}
              disabled={!isEditingAllowed}
            >
              Save Preferences
            </Button>
          </Flex>

          {!isEditingAllowed && (
            <Alert
              type="warning"
              showIcon
              message="Editing Closed"
              description="Breakfast preferences can only be edited before 10:00 PM. Changes made after this time will not be saved."
              style={{ marginBottom: 16 }}
            />
          )}

          <Table
            rowKey="userId"
            columns={breakfastColumns}
            dataSource={breakfastPrefs}
            pagination={false}
            size="small"
            bordered
          />
        </SectionBlock>

        {/* Weekly Dinner Schedule */}
        <SectionBlock>
          <Typography.Title level={4} style={{ margin: '0 0 16px', color: 'var(--text-strong)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <CoffeeOutlined style={{ color: '#1890ff', fontSize: 20 }} />
            Weekly Dinner Schedule
          </Typography.Title>
          <Typography.Text style={{ color: 'var(--text-muted)', fontSize: 13, display: 'block', marginBottom: 16 }}>
            Fixed weekly menu. All meals served at 9:00 PM.
          </Typography.Text>

          <Row gutter={[16, 16]}>
            {WEEKLY_DINNER.map((dinner) => {
              const isToday = dinner.day === todayDayName
              return (
                <Col xs={24} sm={12} md={8} lg={6} key={dinner.day}>
                  <DayCard $isToday={isToday}>
                    <Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
                      <Typography.Text strong style={{ color: isToday ? '#722ed1' : 'var(--text-strong)' }}>
                        {dinner.day}
                      </Typography.Text>
                      {isToday && <Tag color="purple">Today</Tag>}
                    </Flex>
                    <MealTitle>{dinner.meal}</MealTitle>
                    <MealTime>
                      <ClockCircleOutlined />
                      {dinner.time}
                    </MealTime>
                  </DayCard>
                </Col>
              )
            })}
          </Row>
        </SectionBlock>
      </QueryState>

      {/* Edit Breakfast Modal */}
      {editModalOpen && editingUser && (
        <EditBreakfastModal
          user={editingUser}
          onClose={() => {
            setEditModalOpen(false)
            setEditingUser(null)
          }}
          onSave={handleUpdateUser}
        />
      )}
    </PageStack>
  )
}

/* ─── Edit Breakfast Modal ────────────────────────────────────────────────── */

function EditBreakfastModal({
  user,
  onClose,
  onSave,
}: {
  user: BreakfastPreference
  onClose: () => void
  onSave: (values: Partial<BreakfastPreference>) => void
}) {
  const [form] = Form.useForm()

  function handleOk() {
    const values = form.getFieldsValue()
    onSave(values)
  }

  return (
    <Modal
      open
      title={
        <Flex align="center" gap={8}>
          <SunOutlined style={{ color: '#faad14' }} />
          <span>Edit Breakfast - {user.userName}</span>
        </Flex>
      }
      okText="Save Changes"
      onCancel={onClose}
      onOk={handleOk}
      width="min(480px, 95vw)"
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          paratha: user.paratha,
          egg: user.egg,
          tea: user.tea,
          notes: user.notes,
        }}
        style={{ paddingTop: 16 }}
      >
        <Form.Item label="Paratha" name="paratha" valuePropName="checked">
          <Switch checkedChildren="Yes" unCheckedChildren="No" />
        </Form.Item>

        <Form.Item label="Egg Type" name="egg">
          <Select options={EGG_OPTIONS} />
        </Form.Item>

        <Form.Item label="Tea" name="tea" valuePropName="checked">
          <Switch checkedChildren="Yes" unCheckedChildren="No" />
        </Form.Item>

        <Form.Item label="Notes (Optional)" name="notes">
          <Input.TextArea
            rows={2}
            placeholder="e.g., Extra spicy, No onions, etc."
            maxLength={100}
            showCount
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
