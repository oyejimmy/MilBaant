import { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import {
  Alert,
  Avatar,
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
  Tag,
  Typography,
  message,
} from 'antd'
import {
  CoffeeOutlined,
  EditOutlined,
  MoonOutlined,
  SaveOutlined,
  SunOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  UserOutlined,
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
    padding: 16px;

    @media (min-width: 768px) {
      padding: 24px;
    }
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
    padding: 12px;

    @media (min-width: 768px) {
      padding: 16px;
    }
  }
`

const MealTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: var(--text-strong);
  margin-bottom: 6px;

  @media (min-width: 768px) {
    font-size: 16px;
    margin-bottom: 8px;
  }
`

const MealTime = styled.div`
  font-size: 12px;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 6px;
`

/* ─── My Breakfast Card ───────────────────────────────────────────────────── */

const MyBreakfastCard = styled(Card)`
  background: linear-gradient(135deg, rgba(250, 173, 20, 0.08) 0%, rgba(250, 173, 20, 0.02) 100%);
  border: 2px solid rgba(250, 173, 20, 0.3);
  border-radius: 16px;
  margin-bottom: 16px;

  .ant-card-body {
    padding: 16px;
  }
`

const PrefItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid var(--border-light);

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
`

const PrefLabel = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: var(--text-muted);
`

/* ─── Flatmate Card ───────────────────────────────────────────────────────── */

const FlatmateCard = styled(Card)`
  border-radius: 12px;
  border: 1px solid var(--card-border);
  background: var(--card-bg);
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--primary);
    box-shadow: 0 2px 8px rgba(114, 46, 209, 0.1);
  }

  .ant-card-body {
    padding: 12px;
  }
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

function eggColor(egg: EggType) {
  const map: Record<EggType, string> = { fried: 'orange', boiled: 'blue', omelette: 'gold', none: 'default' }
  return map[egg]
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

/* ─── Main Component ──────────────────────────────────────────────────────── */

export function CookMenuPage() {
  const [breakfastPrefs, setBreakfastPrefs] = useState<BreakfastPreference[]>([])
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<BreakfastPreference | null>(null)

  const { userId, profile } = useAuth()
  const profilesQuery = useProfiles()
  const profiles = profilesQuery.data ?? []

  const todayStr = dayjs().format('YYYY-MM-DD')
  const todayMenuQuery = useMenuByDate(todayStr)
  const todayMenu = todayMenuQuery.data

  const createMenu = useCreateMenu()
  const updateMenu = useUpdateMenu()

  const todayDayName = dayjs().format('dddd')
  const tonightDinner = WEEKLY_DINNER.find(d => d.day === todayDayName)

  const currentHour = dayjs().hour()
  const isEditingAllowed = currentHour < 22

  // My own preference
  const myPref = breakfastPrefs.find(p => p.userId === userId)

  // Initialize breakfast preferences
  useEffect(() => {
    if (profiles.length > 0 && breakfastPrefs.length === 0) {
      if (todayMenu?.notes) {
        try {
          const saved = JSON.parse(todayMenu.notes) as BreakfastPreference[]
          setBreakfastPrefs(saved)
          return
        } catch {
          // fall through to defaults
        }
      }

      const defaults: BreakfastPreference[] = FLATMATES.map((name) => {
        const p = profiles.find(pr => pr.full_name === name)
        return {
          userId: p?.id ?? name,
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
          payload: { id: todayMenu.id, breakfast: 'Breakfast preferences updated', notes: prefsJson },
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
      pref.userId === editingUser.userId ? { ...pref, ...values } : pref
    )
    setBreakfastPrefs(updated)
    setEditModalOpen(false)
    setEditingUser(null)
  }

  const isLoading = profilesQuery.isLoading || todayMenuQuery.isLoading
  const error = (profilesQuery.error as Error | null) ?? (todayMenuQuery.error as Error | null)

  return (
    <PageStack>
      <PageHeader
        title="Daily Menu"
        subtitle="Manage breakfast preferences and view the weekly dinner schedule"
        breadcrumbs={[{ title: 'Home', path: '/' }, { title: 'Management' }, { title: 'Daily Menu' }]}
        actions={
          <Space wrap size="small">
            {!isEditingAllowed && (
              <Tag color="red" icon={<ClockCircleOutlined />}>Editing closed (after 10 PM)</Tag>
            )}
            {isEditingAllowed && (
              <Tag color="green" icon={<CheckCircleOutlined />}>Editing open until 10 PM</Tag>
            )}
          </Space>
        }
      />

      <QueryState isLoading={isLoading} error={error}>
        {/* Tonight's Dinner Highlight */}
        {tonightDinner && (
          <TonightCard>
            <Flex align="center" justify="space-between" wrap gap={12}>
              <div>
                <Flex align="center" gap={10} style={{ marginBottom: 6 }}>
                  <MoonOutlined style={{ fontSize: 24, color: '#722ed1' }} />
                  <div>
                    <Typography.Title level={4} style={{ margin: 0, color: '#722ed1', fontSize: 'clamp(16px, 4vw, 20px)' }}>
                      Tonight's Dinner
                    </Typography.Title>
                    <Typography.Text style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      {dayjs().format('dddd, DD MMMM YYYY')}
                    </Typography.Text>
                  </div>
                </Flex>
                <Typography.Text style={{ fontSize: 'clamp(15px, 3.5vw, 18px)', fontWeight: 600, color: 'var(--text-strong)', display: 'block', marginTop: 6 }}>
                  {tonightDinner.meal}
                </Typography.Text>
                <MealTime style={{ marginTop: 6 }}>
                  <ClockCircleOutlined />
                  Serving Time: {tonightDinner.time}
                </MealTime>
              </div>
              <Tag color="purple" style={{ fontSize: 12, padding: '3px 10px' }}>Fixed Menu</Tag>
            </Flex>
          </TonightCard>
        )}

        {/* My Breakfast Preferences (logged-in user) */}
        {myPref && (
          <MyBreakfastCard>
            <Flex align="center" justify="space-between" wrap gap={8} style={{ marginBottom: 12 }}>
              <Flex align="center" gap={8}>
                <SunOutlined style={{ color: '#faad14', fontSize: 18 }} />
                <div>
                  <Typography.Title level={5} style={{ margin: 0, color: 'var(--text-strong)' }}>
                    My Breakfast
                  </Typography.Title>
                  <Typography.Text style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                    {profile?.full_name ?? 'Your preferences for today'}
                  </Typography.Text>
                </div>
              </Flex>
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEditUser(myPref)}
                disabled={!isEditingAllowed}
                type="primary"
                ghost
              >
                Edit
              </Button>
            </Flex>
            <Row gutter={[12, 0]}>
              <Col xs={8}>
                <PrefItem>
                  <div style={{ textAlign: 'center', width: '100%' }}>
                    <PrefLabel>Paratha</PrefLabel>
                    <Tag color={myPref.paratha ? 'green' : 'default'} style={{ marginTop: 4 }}>
                      {myPref.paratha ? 'Yes' : 'No'}
                    </Tag>
                  </div>
                </PrefItem>
              </Col>
              <Col xs={8}>
                <PrefItem>
                  <div style={{ textAlign: 'center', width: '100%' }}>
                    <PrefLabel>Egg</PrefLabel>
                    <Tag color={eggColor(myPref.egg)} style={{ marginTop: 4 }}>
                      {myPref.egg.charAt(0).toUpperCase() + myPref.egg.slice(1)}
                    </Tag>
                  </div>
                </PrefItem>
              </Col>
              <Col xs={8}>
                <PrefItem>
                  <div style={{ textAlign: 'center', width: '100%' }}>
                    <PrefLabel>Tea</PrefLabel>
                    <Tag color={myPref.tea ? 'cyan' : 'default'} style={{ marginTop: 4 }}>
                      {myPref.tea ? 'Yes' : 'No'}
                    </Tag>
                  </div>
                </PrefItem>
              </Col>
            </Row>
            {myPref.notes && (
              <Typography.Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: 'block' }}>
                Note: {myPref.notes}
              </Typography.Text>
            )}
          </MyBreakfastCard>
        )}

        {/* All Flatmates Breakfast Preferences */}
        <SectionBlock>
          <Flex align="center" justify="space-between" wrap gap={8} style={{ marginBottom: 16 }}>
            <div>
              <Typography.Title level={4} style={{ margin: 0, color: 'var(--text-strong)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 'clamp(14px, 3.5vw, 18px)' }}>
                <SunOutlined style={{ color: '#faad14', fontSize: 18 }} />
                Breakfast Preferences
              </Typography.Title>
              <Typography.Text style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                Default: 1 Paratha + 1 Egg per person
              </Typography.Text>
            </div>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={() => void handleSaveBreakfast()}
              loading={createMenu.isPending || updateMenu.isPending}
              disabled={!isEditingAllowed}
              size="middle"
            >
              Save All
            </Button>
          </Flex>

          {!isEditingAllowed && (
            <Alert
              type="warning"
              showIcon
              message="Editing Closed"
              description="Breakfast preferences can only be edited before 10:00 PM."
              style={{ marginBottom: 16 }}
            />
          )}

          {/* Mobile-friendly card grid instead of table */}
          <Row gutter={[12, 12]}>
            {breakfastPrefs.map((pref) => {
              const isMe = pref.userId === userId
              return (
                <Col xs={24} sm={12} lg={8} key={pref.userId}>
                  <FlatmateCard style={isMe ? { borderColor: '#faad14', background: 'rgba(250,173,20,0.04)' } : {}}>
                    <Flex align="center" justify="space-between" style={{ marginBottom: 10 }}>
                      <Flex align="center" gap={8}>
                        <Avatar
                          size={32}
                          style={{ background: isMe ? '#faad14' : 'var(--primary)', color: '#fff', fontSize: 12, flexShrink: 0 }}
                          icon={<UserOutlined />}
                        >
                          {initials(pref.userName)}
                        </Avatar>
                        <div>
                          <Typography.Text strong style={{ fontSize: 13, color: 'var(--text-strong)', display: 'block', lineHeight: 1.3 }}>
                            {pref.userName}
                            {isMe && <Tag color="gold" style={{ marginLeft: 6, fontSize: 10, padding: '0 4px' }}>Me</Tag>}
                          </Typography.Text>
                        </div>
                      </Flex>
                      <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleEditUser(pref)}
                        disabled={!isEditingAllowed}
                        type={isMe ? 'primary' : 'default'}
                        ghost={isMe}
                      />
                    </Flex>
                    <Flex gap={6} wrap>
                      <Tag color={pref.paratha ? 'green' : 'default'} style={{ fontSize: 11 }}>
                        🫓 {pref.paratha ? 'Paratha' : 'No Paratha'}
                      </Tag>
                      <Tag color={eggColor(pref.egg)} style={{ fontSize: 11 }}>
                        🥚 {pref.egg.charAt(0).toUpperCase() + pref.egg.slice(1)}
                      </Tag>
                      <Tag color={pref.tea ? 'cyan' : 'default'} style={{ fontSize: 11 }}>
                        ☕ {pref.tea ? 'Tea' : 'No Tea'}
                      </Tag>
                    </Flex>
                    {pref.notes && (
                      <Typography.Text type="secondary" style={{ fontSize: 11, marginTop: 6, display: 'block' }}>
                        {pref.notes}
                      </Typography.Text>
                    )}
                  </FlatmateCard>
                </Col>
              )
            })}
          </Row>
        </SectionBlock>

        {/* Weekly Dinner Schedule */}
        <SectionBlock>
          <Typography.Title level={4} style={{ margin: '0 0 12px', color: 'var(--text-strong)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 'clamp(14px, 3.5vw, 18px)' }}>
            <CoffeeOutlined style={{ color: '#1890ff', fontSize: 18 }} />
            Weekly Dinner Schedule
          </Typography.Title>
          <Typography.Text style={{ color: 'var(--text-muted)', fontSize: 12, display: 'block', marginBottom: 14 }}>
            Fixed weekly menu · All meals served at 9:00 PM
          </Typography.Text>

          <Row gutter={[10, 10]}>
            {WEEKLY_DINNER.map((dinner) => {
              const isToday = dinner.day === todayDayName
              return (
                <Col xs={12} sm={8} md={6} key={dinner.day}>
                  <DayCard $isToday={isToday}>
                    <Flex justify="space-between" align="center" style={{ marginBottom: 6 }}>
                      <Typography.Text strong style={{ color: isToday ? '#722ed1' : 'var(--text-strong)', fontSize: 13 }}>
                        {dinner.day}
                      </Typography.Text>
                      {isToday && <Tag color="purple" style={{ fontSize: 10, padding: '0 4px' }}>Today</Tag>}
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
          onClose={() => { setEditModalOpen(false); setEditingUser(null) }}
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
          <span>Edit Breakfast — {user.userName}</span>
        </Flex>
      }
      okText="Save Changes"
      onCancel={onClose}
      onOk={handleOk}
      width="min(480px, 95vw)"
      styles={{ body: { paddingTop: 16 } }}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ paratha: user.paratha, egg: user.egg, tea: user.tea, notes: user.notes }}
      >
        <Row gutter={16}>
          <Col xs={8}>
            <Form.Item label="Paratha" name="paratha" valuePropName="checked">
              <Switch checkedChildren="Yes" unCheckedChildren="No" />
            </Form.Item>
          </Col>
          <Col xs={8}>
            <Form.Item label="Tea" name="tea" valuePropName="checked">
              <Switch checkedChildren="Yes" unCheckedChildren="No" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Egg Type" name="egg">
          <Select options={EGG_OPTIONS} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item label="Notes (Optional)" name="notes">
          <Input.TextArea
            rows={2}
            placeholder="Add a note (optional)"
            maxLength={100}
            showCount
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
