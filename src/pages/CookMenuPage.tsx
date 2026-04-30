import { useState, useMemo } from 'react'
import dayjs from 'dayjs'
import {
  App,
  Avatar,
  Button,
  Form,
  Input,
  Modal,
  Select,
  Skeleton,
  Switch,
  Tag,
  Tooltip,
  Typography,
} from 'antd'
import {
  BulbOutlined,
  CheckOutlined,
  DeleteOutlined,
  EditOutlined,
  HomeOutlined,
  LockOutlined,
  MoonOutlined,
  SendOutlined,
  SunOutlined,
  UnlockOutlined,
  UserOutlined,
} from '@ant-design/icons'
import styled from 'styled-components'
import { PageStack } from '@/components/Glass'
import { PageHeader } from '@/components/PageHeader'
import { QueryState } from '@/components/QueryState'
import { useAuth } from '@/hooks/useAuth'
import { useProfiles } from '@/hooks/useProfiles'
import {
  useMenuByDate,
  useCreateMenu,
  useUpdateMenu,
} from '@/hooks/useDailyMenu'

/* ══════════════════════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════════════════════ */

type EggPref = 'fried' | 'boiled' | 'omelette' | 'none'

interface BreakfastPref {
  paratha: boolean
  sadaRoti: boolean
  egg: EggPref
  tea: boolean
}

interface Suggestion {
  id: string
  userId: string
  userName: string
  text: string
  createdAt: string
}

interface NotesData {
  breakfastPrefs?: Record<string, BreakfastPref>   // userId → pref
  suggestions?: Suggestion[]
}

/* ══════════════════════════════════════════════════════════════════════════
   FIXED WEEKLY DINNER MENU
══════════════════════════════════════════════════════════════════════════ */

const WEEKLY_DINNER: Record<string, string> = {
  Sunday:    'Nihari + Naan',
  Monday:    'Chicken Karahi + Roti',
  Tuesday:   'Daal Chawal + Salad',
  Wednesday: 'Chicken Biryani',
  Thursday:  'Aloo Keema + Roti',
  Friday:    'Chicken Qorma + Roti',
  Saturday:  'Pulao + Raita',
}

const EGG_OPTIONS = [
  { label: '🍳 Fried',    value: 'fried' },
  { label: '🥚 Boiled',   value: 'boiled' },
  { label: '🫕 Omelette', value: 'omelette' },
  { label: '✗ None',      value: 'none' },
]

const DEFAULT_PREF: BreakfastPref = { paratha: true, sadaRoti: false, egg: 'fried', tea: false }

/* ══════════════════════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════════════════════ */

function parseNotes(raw: string | null): NotesData {
  if (!raw) return {}
  try { return JSON.parse(raw) as NotesData } catch { return {} }
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

function eggLabel(e: EggPref) {
  return { fried: 'Fried', boiled: 'Boiled', omelette: 'Omelette', none: 'No egg' }[e]
}

function eggColor(e: EggPref) {
  return { fried: 'orange', boiled: 'blue', omelette: 'gold', none: 'default' }[e]
}

/* ══════════════════════════════════════════════════════════════════════════
   STYLED COMPONENTS
══════════════════════════════════════════════════════════════════════════ */

const SectionCard = styled.div`
  background: var(--card-bg);
  border-radius: 14px;
  border: 1px solid var(--border-light);
  overflow: hidden;
  box-shadow: 0 1px 6px rgba(0,0,0,0.05);
`

const SectionHead = styled.div`
  padding: 14px 18px;
  border-bottom: 1px solid var(--border-light);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;

  @media (min-width: 768px) { padding: 16px 22px; }
`

const SectionTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
  color: var(--text-strong);
`

const SectionBody = styled.div`
  padding: 16px 18px;
  @media (min-width: 768px) { padding: 18px 22px; }
`

/* ── Dinner card ── */
const DinnerDisplay = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`

const DinnerMeal = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: var(--text-strong);
  letter-spacing: -0.3px;

  @media (max-width: 480px) { font-size: 16px; }
`

const DinnerMeta = styled.div`
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 3px;
`

/* ── Breakfast grid ── */
const BreakfastGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
`

const PersonCard = styled.div<{ $isMe?: boolean }>`
  border-radius: 10px;
  border: 1.5px solid ${p => p.$isMe ? 'var(--primary)' : 'var(--border-light)'};
  background: ${p => p.$isMe ? 'var(--primary-soft)' : 'var(--bg-elevated)'};
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 7px;
`

const PersonRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
`

const PersonName = styled.div`
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-strong);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const PrefTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
`

/* ── Suggestions ── */
const SuggestionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 14px;
`

const SuggestionItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-light);
`

const SuggestionText = styled.div`
  flex: 1;
  font-size: 13.5px;
  color: var(--text-strong);
  line-height: 1.45;
`

const SuggestionMeta = styled.div`
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
`

const AddSuggestionRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: flex-start;
`

/* ══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════════ */

export function CookMenuPage() {
  const { userId, profile, isAdmin, isCook } = useAuth()
  const { message } = App.useApp()
  const profilesQuery = useProfiles()
  const profiles = profilesQuery.data ?? []

  const canEditDinner = isAdmin || isCook
  const today = dayjs()
  const todayStr = today.format('YYYY-MM-DD')
  const todayDay = today.format('dddd')

  const todayQuery = useMenuByDate(todayStr)
  const createMenu = useCreateMenu()
  const updateMenu = useUpdateMenu()

  const todayMenu = todayQuery.data
  const notesData = useMemo(() => parseNotes(todayMenu?.notes ?? null), [todayMenu?.notes])

  const breakfastPrefs: Record<string, BreakfastPref> = notesData.breakfastPrefs ?? {}
  const suggestions: Suggestion[] = notesData.suggestions ?? []

  // Fixed dinner for today, overridable by admin/cook
  const fixedDinner = WEEKLY_DINNER[todayDay] ?? 'Not set'
  const actualDinner = todayMenu?.dinner ?? fixedDinner

  // Dinner override modal
  const [dinnerModalOpen, setDinnerModalOpen] = useState(false)
  const [dinnerForm] = Form.useForm()

  // Breakfast edit modal
  const [bfModalOpen, setBfModalOpen] = useState(false)
  const [bfTargetId, setBfTargetId] = useState<string | null>(null)
  const [bfForm] = Form.useForm()

  // Suggestion input
  const [suggestionText, setSuggestionText] = useState('')
  const [submittingSuggestion, setSubmittingSuggestion] = useState(false)

  const isSaving = createMenu.isPending || updateMenu.isPending

  /* ── Persist helper ──────────────────────────────────────────────────────
   * Only sends the fields that are in `patch` — never overwrites other
   * columns. This prevents a notes-only save from clearing dinner, and
   * a dinner-only save from clearing notes.
   * ─────────────────────────────────────────────────────────────────────── */
  async function persistMenu(patch: Partial<{ dinner: string; notes: string }>) {
    if (!userId) return

    if (todayMenu) {
      // UPDATE — only the patched fields are sent
      await updateMenu.mutateAsync({
        payload: { id: todayMenu.id, ...patch },
        userId,
      })
    } else {
      // INSERT — create the row; unpatched fields default to null
      await createMenu.mutateAsync({
        date: todayStr,
        dinner: patch.dinner,
        notes:  patch.notes,
        createdBy: userId,
      })
    }
  }

  /* ── Save dinner override ── */
  async function handleSaveDinner() {
    const { dinner } = dinnerForm.getFieldsValue() as { dinner: string }
    try {
      await persistMenu({ dinner: dinner?.trim() || fixedDinner })
      message.success('Dinner updated!')
      setDinnerModalOpen(false)
    } catch { message.error('Failed to save.') }
  }

  /* ── Reset dinner to fixed ── */
  async function handleResetDinner() {
    try {
      // Pass dinner as empty string — the hook converts '' to null, which
      // means "no override" and the UI falls back to the fixed weekly menu
      await persistMenu({ dinner: '' })
      message.success('Dinner reset to fixed menu.')
    } catch { message.error('Failed to reset.') }
  }

  /* ── Open breakfast edit ── */
  function openBreakfastEdit(targetUserId: string) {
    setBfTargetId(targetUserId)
    const pref = breakfastPrefs[targetUserId] ?? DEFAULT_PREF
    bfForm.setFieldsValue(pref)
    setBfModalOpen(true)
  }

  /* ── Save breakfast pref ── */
  async function handleSaveBreakfast() {
    if (!bfTargetId) return
    const values = bfForm.getFieldsValue() as BreakfastPref
    const updated: NotesData = {
      ...notesData,
      breakfastPrefs: { ...breakfastPrefs, [bfTargetId]: values },
    }
    try {
      await persistMenu({ notes: JSON.stringify(updated) })
      message.success('Breakfast preference saved!')
      setBfModalOpen(false)
      setBfTargetId(null)
    } catch { message.error('Failed to save.') }
  }

  /* ── Add suggestion ── */
  async function handleAddSuggestion() {
    if (!userId || !suggestionText.trim()) return
    setSubmittingSuggestion(true)
    const newSuggestion: Suggestion = {
      id: Date.now().toString(),
      userId,
      userName: profile?.full_name ?? 'Unknown',
      text: suggestionText.trim(),
      createdAt: new Date().toISOString(),
    }
    const updated: NotesData = {
      ...notesData,
      suggestions: [...suggestions, newSuggestion],
    }
    try {
      await persistMenu({ notes: JSON.stringify(updated) })
      setSuggestionText('')
      message.success('Suggestion added!')
    } catch { message.error('Failed to add suggestion.') }
    finally { setSubmittingSuggestion(false) }
  }

  /* ── Delete suggestion ── */
  async function handleDeleteSuggestion(id: string) {
    const updated: NotesData = {
      ...notesData,
      suggestions: suggestions.filter(s => s.id !== id),
    }
    try {
      await persistMenu({ notes: JSON.stringify(updated) })
    } catch { message.error('Failed to delete.') }
  }

  /* ── Mark suggestion as done (admin/cook) ── */
  async function handleApplySuggestion(text: string) {
    try {
      await persistMenu({ dinner: text })
      message.success('Dinner set from suggestion!')
    } catch { message.error('Failed.') }
  }

  const isLoading = todayQuery.isLoading || profilesQuery.isLoading
  const error = (todayQuery.error ?? profilesQuery.error) as Error | null

  const isOverridden = !!todayMenu?.dinner && todayMenu.dinner !== fixedDinner

  return (
    <PageStack>
      <PageHeader
        title="Daily Menu"
        subtitle="Breakfast preferences, tonight's dinner, and meal suggestions."
        breadcrumbs={[
          { title: 'Home', path: '/', icon: <HomeOutlined /> },
          { title: 'Daily Menu' },
        ]}
      />

      <QueryState isLoading={isLoading} error={error}>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 1 — DINNER
        ══════════════════════════════════════════════════════════════ */}
        <SectionCard>
          <SectionHead>
            <SectionTitle>
              <MoonOutlined style={{ color: '#722ed1', fontSize: 16 }} />
              Tonight's Dinner
              <Tag
                color={isOverridden ? 'purple' : 'default'}
                style={{ margin: 0, fontSize: 11 }}
              >
                {isOverridden ? 'Custom' : 'Fixed menu'}
              </Tag>
            </SectionTitle>

            {canEditDinner && (
              <div style={{ display: 'flex', gap: 6 }}>
                {isOverridden && (
                  <Tooltip title="Reset to fixed weekly menu">
                    <Button
                      size="small"
                      icon={<UnlockOutlined />}
                      onClick={() => void handleResetDinner()}
                      loading={isSaving}
                    >
                      Reset
                    </Button>
                  </Tooltip>
                )}
                <Button
                  size="small"
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => {
                    dinnerForm.setFieldsValue({ dinner: actualDinner })
                    setDinnerModalOpen(true)
                  }}
                >
                  Change
                </Button>
              </div>
            )}
          </SectionHead>

          <SectionBody>
            {todayQuery.isLoading ? (
              <Skeleton active paragraph={{ rows: 1 }} />
            ) : (
              <DinnerDisplay>
                <div>
                  <DinnerMeal>{actualDinner}</DinnerMeal>
                  <DinnerMeta>
                    {today.format('dddd, DD MMMM YYYY')} · Serving ~9:00 PM
                    {isOverridden && (
                      <span style={{ marginLeft: 8, color: '#722ed1' }}>
                        · Overridden by {canEditDinner ? 'you' : 'admin/cook'}
                      </span>
                    )}
                  </DinnerMeta>
                </div>
                {!isOverridden && (
                  <Tag color="default" style={{ fontSize: 11 }}>
                    <LockOutlined style={{ marginRight: 4 }} />
                    Weekly fixed
                  </Tag>
                )}
              </DinnerDisplay>
            )}

            {/* Weekly schedule preview */}
            <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {Object.entries(WEEKLY_DINNER).map(([day, meal]) => {
                const isToday = day === todayDay
                return (
                  <Tag
                    key={day}
                    color={isToday ? 'purple' : 'default'}
                    style={{ fontSize: 11, margin: 0 }}
                  >
                    <span style={{ fontWeight: 600 }}>{day.slice(0, 3)}</span>
                    {' · '}{meal}
                  </Tag>
                )
              })}
            </div>
          </SectionBody>
        </SectionCard>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 2 — BREAKFAST
        ══════════════════════════════════════════════════════════════ */}
        <SectionCard>
          <SectionHead>
            <SectionTitle>
              <SunOutlined style={{ color: '#f9a825', fontSize: 16 }} />
              Breakfast Preferences
            </SectionTitle>
            <Typography.Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Each person sets their own · Default: Paratha + Fried egg
            </Typography.Text>
          </SectionHead>

          <SectionBody>
            {todayQuery.isLoading || profilesQuery.isLoading ? (
              <Skeleton active paragraph={{ rows: 2 }} />
            ) : (
              <BreakfastGrid>
                {profiles.map(p => {
                  const pref = breakfastPrefs[p.id] ?? DEFAULT_PREF
                  const isMe = p.id === userId
                  const canEdit = isMe || canEditDinner

                  return (
                    <PersonCard key={p.id} $isMe={isMe}>
                      <PersonRow>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                          <Avatar
                            size={26}
                            style={{
                              background: isMe ? 'var(--primary)' : 'var(--bg-elevated)',
                              color: isMe ? '#fff' : 'var(--text-muted)',
                              fontSize: 10,
                              flexShrink: 0,
                              border: '1px solid var(--border-light)',
                            }}
                            icon={<UserOutlined />}
                          >
                            {initials(p.full_name)}
                          </Avatar>
                          <PersonName>{isMe ? 'Me' : p.full_name.split(' ')[0]}</PersonName>
                        </div>
                        {canEdit && (
                          <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => openBreakfastEdit(p.id)}
                            style={{ flexShrink: 0, padding: '0 4px', height: 22 }}
                          />
                        )}
                      </PersonRow>

                      <PrefTags>
                        <Tag
                          color={pref.paratha ? 'green' : 'default'}
                          style={{ fontSize: 10, margin: 0, padding: '0 5px' }}
                        >
                          🫓 {pref.paratha ? 'Paratha' : 'No paratha'}
                        </Tag>
                        {pref.sadaRoti && (
                          <Tag
                            color="lime"
                            style={{ fontSize: 10, margin: 0, padding: '0 5px' }}
                          >
                            🍞 Sada Roti
                          </Tag>
                        )}
                        <Tag
                          color={eggColor(pref.egg)}
                          style={{ fontSize: 10, margin: 0, padding: '0 5px' }}
                        >
                          🥚 {eggLabel(pref.egg)}
                        </Tag>
                        {pref.tea && (
                          <Tag
                            color="cyan"
                            style={{ fontSize: 10, margin: 0, padding: '0 5px' }}
                          >
                            ☕ Tea
                          </Tag>
                        )}
                      </PrefTags>
                    </PersonCard>
                  )
                })}
              </BreakfastGrid>
            )}
          </SectionBody>
        </SectionCard>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 3 — SUGGESTIONS
        ══════════════════════════════════════════════════════════════ */}
        <SectionCard>
          <SectionHead>
            <SectionTitle>
              <BulbOutlined style={{ color: '#f9a825', fontSize: 16 }} />
              Dinner Suggestions
            </SectionTitle>
            <Typography.Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Anyone can suggest · Admin/cook can apply
            </Typography.Text>
          </SectionHead>

          <SectionBody>
            {suggestions.length > 0 ? (
              <SuggestionList>
                {suggestions.map(s => {
                  const isOwner = s.userId === userId
                  const canDelete = isOwner || canEditDinner
                  return (
                    <SuggestionItem key={s.id}>
                      <Avatar
                        size={28}
                        style={{
                          background: 'var(--primary-soft)',
                          color: 'var(--primary)',
                          fontSize: 11,
                          flexShrink: 0,
                          border: '1px solid var(--border-light)',
                        }}
                      >
                        {initials(s.userName)}
                      </Avatar>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <SuggestionText>{s.text}</SuggestionText>
                        <SuggestionMeta>
                          {s.userName} · {dayjs(s.createdAt).format('h:mm A')}
                        </SuggestionMeta>
                      </div>
                      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                        {canEditDinner && (
                          <Tooltip title="Set as tonight's dinner">
                            <Button
                              size="small"
                              type="primary"
                              ghost
                              icon={<CheckOutlined />}
                              onClick={() => void handleApplySuggestion(s.text)}
                              style={{ padding: '0 6px' }}
                            />
                          </Tooltip>
                        )}
                        {canDelete && (
                          <Button
                            size="small"
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => void handleDeleteSuggestion(s.id)}
                            style={{ padding: '0 6px' }}
                          />
                        )}
                      </div>
                    </SuggestionItem>
                  )
                })}
              </SuggestionList>
            ) : (
              <Typography.Text
                style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic', display: 'block', marginBottom: 14 }}
              >
                No suggestions yet. Be the first to suggest something!
              </Typography.Text>
            )}

            {/* Add suggestion input */}
            <AddSuggestionRow>
              <Input
                placeholder="Suggest a meal for tonight…"
                value={suggestionText}
                onChange={e => setSuggestionText(e.target.value)}
                onPressEnter={() => void handleAddSuggestion()}
                maxLength={120}
                style={{ flex: 1 }}
                suffix={
                  <Typography.Text style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {suggestionText.length}/120
                  </Typography.Text>
                }
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={() => void handleAddSuggestion()}
                loading={submittingSuggestion}
                disabled={!suggestionText.trim()}
              >
                Send
              </Button>
            </AddSuggestionRow>
          </SectionBody>
        </SectionCard>

      </QueryState>

      {/* ── Dinner override modal ── */}
      <Modal
        open={dinnerModalOpen}
        title={<span style={{ fontSize: 14, fontWeight: 700 }}>Change Tonight's Dinner</span>}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button size="small" onClick={() => setDinnerModalOpen(false)}>Cancel</Button>
            <Button size="small" type="primary" loading={isSaving} onClick={() => void handleSaveDinner()}>
              Save
            </Button>
          </div>
        }
        onCancel={() => setDinnerModalOpen(false)}
        width="min(400px, 95vw)"
        style={{ top: 80 }}
        styles={{ body: { paddingTop: 12 } }}
      >
        <Typography.Text style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 12 }}>
          Fixed menu for {todayDay}: <strong>{fixedDinner}</strong>
        </Typography.Text>
        <Form form={dinnerForm} layout="vertical" requiredMark={false}>
          <Form.Item name="dinner" label="Override with" style={{ marginBottom: 0 }}>
            <Input
              placeholder={fixedDinner}
              allowClear
              autoFocus
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Breakfast preference modal ── */}
      <Modal
        open={bfModalOpen}
        title={
          <span style={{ fontSize: 14, fontWeight: 700 }}>
            Breakfast — {bfTargetId === userId ? 'My Preference' : (profiles.find(p => p.id === bfTargetId)?.full_name ?? '')}
          </span>
        }
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button size="small" onClick={() => setBfModalOpen(false)}>Cancel</Button>
            <Button size="small" type="primary" loading={isSaving} onClick={() => void handleSaveBreakfast()}>
              Save
            </Button>
          </div>
        }
        onCancel={() => setBfModalOpen(false)}
        width="min(360px, 95vw)"
        style={{ top: 80 }}
        styles={{ body: { paddingTop: 12 } }}
      >
        <Form form={bfForm} layout="vertical" requiredMark={false}>
          <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
            <Form.Item name="paratha" valuePropName="checked" label="Paratha" style={{ marginBottom: 0 }}>
              <Switch size="small" checkedChildren="Yes" unCheckedChildren="No" />
            </Form.Item>
            <Form.Item name="sadaRoti" valuePropName="checked" label="Sada Roti" style={{ marginBottom: 0 }}>
              <Switch size="small" checkedChildren="Yes" unCheckedChildren="No" />
            </Form.Item>
            <Form.Item name="tea" valuePropName="checked" label="Tea" style={{ marginBottom: 0 }}>
              <Switch size="small" checkedChildren="Yes" unCheckedChildren="No" />
            </Form.Item>
          </div>
          <Form.Item name="egg" label="Egg" style={{ marginBottom: 0 }}>
            <Select options={EGG_OPTIONS} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </PageStack>
  )
}
