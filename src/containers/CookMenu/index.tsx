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
  Switch,
  Tag,
  Tooltip,
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
import { PageStack } from '@/components/Glass/index'
import { PageHeader } from '@/components/PageHeader/index'
import { QueryState } from '@/components/QueryState'
import { useAuth } from '@/hooks/useAuth'
import { useProfiles } from '@/hooks/useProfiles'
import {
  useMenuByDate,
  useCreateMenu,
  useUpdateMenu,
} from '@/hooks/useDailyMenu'
import {
  SectionCard, SectionHead, SectionTitle, SectionBody,
  DinnerDisplay, DinnerMeal, DinnerMeta, DinnerInfo, DinnerDescText,
  DinnerMetaOverride, WeeklyRow, DayLabel, SectionActions,
  BreakfastGrid, PersonCard, PersonRow, PersonName, AvatarRow, PrefTags,
  SuggestionList, SuggestionItem, SuggestionText, SuggestionMeta,
  SuggestionContent, SuggestionActions, AddSuggestionRow,
  ModalFooter, ModalTitle, SwitchRow,
  EmptySuggestion, HintText, FixedMenuHint, CharCount,
} from './styles'
import type { BreakfastPref, NotesData, Suggestion } from './types'

/* ══════════════════════════════════════════════════════════════════════════
   CONSTANTS
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

function eggLabel(e: BreakfastPref['egg']) {
  return { fried: 'Fried', boiled: 'Boiled', omelette: 'Omelette', none: 'No egg' }[e]
}

function eggColor(e: BreakfastPref['egg']) {
  return { fried: 'orange', boiled: 'blue', omelette: 'gold', none: 'default' }[e]
}

/* ══════════════════════════════════════════════════════════════════════════
   COMPONENT
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

  const fixedDinner = WEEKLY_DINNER[todayDay] ?? 'Not set'
  const actualDinner = todayMenu?.dinner ?? fixedDinner

  const [dinnerModalOpen, setDinnerModalOpen] = useState(false)
  const [dinnerForm] = Form.useForm()

  const [bfModalOpen, setBfModalOpen] = useState(false)
  const [bfTargetId, setBfTargetId] = useState<string | null>(null)
  const [bfForm] = Form.useForm()

  const [suggestionText, setSuggestionText] = useState('')
  const [submittingSuggestion, setSubmittingSuggestion] = useState(false)

  const isSaving = createMenu.isPending || updateMenu.isPending

  /* ── Persist helper ──────────────────────────────────────────────────────
   * Sparse update — only sends fields present in `patch`.
   * Pass `dinner: ''` to clear the override (falls back to fixed menu).
   * Pass `dinnerDescription: ''` to clear the description.
   * ─────────────────────────────────────────────────────────────────────── */
  async function persistMenu(patch: Partial<{ dinner: string; dinnerDescription: string; notes: string }>) {
    if (!userId) throw new Error('Not authenticated')

    if (todayMenu) {
      await updateMenu.mutateAsync({
        payload: { id: todayMenu.id, ...patch },
        userId,
      })
    } else {
      await createMenu.mutateAsync({
        date:              todayStr,
        dinner:            patch.dinner,
        dinnerDescription: patch.dinnerDescription,
        notes:             patch.notes,
        createdBy:         userId,
      })
    }
  }

  async function handleSaveDinner() {
    const { dinner, dinnerDescription } = dinnerForm.getFieldsValue() as {
      dinner: string | undefined
      dinnerDescription: string | undefined
    }
    const trimmedDinner = dinner?.trim() ?? ''
    const trimmedDesc   = dinnerDescription?.trim() ?? ''
    try {
      await persistMenu({ dinner: trimmedDinner, dinnerDescription: trimmedDesc })
      message.success('Dinner updated!')
      setDinnerModalOpen(false)
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Failed to save.')
    }
  }

  async function handleResetDinner() {
    try {
      await persistMenu({ dinner: '', dinnerDescription: '' })
      message.success('Dinner reset to fixed menu.')
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Failed to reset.')
    }
  }

  function openBreakfastEdit(targetUserId: string) {
    setBfTargetId(targetUserId)
    bfForm.setFieldsValue(breakfastPrefs[targetUserId] ?? DEFAULT_PREF)
    setBfModalOpen(true)
  }

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
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Failed to save.')
    }
  }

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
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Failed to add suggestion.')
    } finally {
      setSubmittingSuggestion(false)
    }
  }

  async function handleDeleteSuggestion(id: string) {
    const updated: NotesData = {
      ...notesData,
      suggestions: suggestions.filter(s => s.id !== id),
    }
    try {
      await persistMenu({ notes: JSON.stringify(updated) })
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Failed to delete.')
    }
  }

  async function handleApplySuggestion(text: string) {
    try {
      await persistMenu({ dinner: text })
      message.success('Dinner set from suggestion!')
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Failed to apply suggestion.')
    }
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

        {/* ── SECTION 1: DINNER ── */}
        <SectionCard>
          <SectionHead>
            <SectionTitle>
              <MoonOutlined style={{ color: '#722ed1', fontSize: 16 }} />
              Tonight&apos;s Dinner
              <Tag color={isOverridden ? 'purple' : 'default'} style={{ margin: 0, fontSize: 11 }}>
                {isOverridden ? 'Custom' : 'Fixed menu'}
              </Tag>
            </SectionTitle>

            {canEditDinner && (
              <SectionActions>
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
                    dinnerForm.setFieldsValue({
                      dinner: todayMenu?.dinner ?? '',
                      dinnerDescription: todayMenu?.dinner_description ?? '',
                    })
                    setDinnerModalOpen(true)
                  }}
                >
                  Change
                </Button>
              </SectionActions>
            )}
          </SectionHead>

          <SectionBody>
            <DinnerDisplay>
              <DinnerInfo>
                <DinnerMeal>{actualDinner}</DinnerMeal>
                {todayMenu?.dinner_description && (
                  <DinnerDescText>{todayMenu.dinner_description}</DinnerDescText>
                )}
                <DinnerMeta>
                  {today.format('dddd, DD MMMM YYYY')} · Serving ~9:00 PM
                  {isOverridden && (
                    <DinnerMetaOverride>
                      · Overridden by {canEditDinner ? 'you' : 'admin/cook'}
                    </DinnerMetaOverride>
                  )}
                </DinnerMeta>
              </DinnerInfo>
              {!isOverridden && (
                <Tag color="default" style={{ fontSize: 11 }}>
                  <LockOutlined style={{ marginRight: 4 }} />
                  Weekly fixed
                </Tag>
              )}
            </DinnerDisplay>

            <WeeklyRow>
              {Object.entries(WEEKLY_DINNER).map(([day, meal]) => (
                <Tag
                  key={day}
                  color={day === todayDay ? 'purple' : 'default'}
                  style={{ fontSize: 11, margin: 0 }}
                >
                  <DayLabel>{day.slice(0, 3)}</DayLabel>
                  {' · '}{meal}
                </Tag>
              ))}
            </WeeklyRow>
          </SectionBody>
        </SectionCard>

        {/* ── SECTION 2: BREAKFAST ── */}
        <SectionCard>
          <SectionHead>
            <SectionTitle>
              <SunOutlined style={{ color: '#f9a825', fontSize: 16 }} />
              Breakfast Preferences
            </SectionTitle>
            <HintText>Each person sets their own · Default: Paratha + Fried egg</HintText>
          </SectionHead>

          <SectionBody>
            <BreakfastGrid>
              {profiles.map(p => {
                  const pref = breakfastPrefs[p.id] ?? DEFAULT_PREF
                  const isMe = p.id === userId
                  const canEdit = isMe || canEditDinner

                  return (
                    <PersonCard key={p.id} $isMe={isMe}>
                      <PersonRow>
                        <AvatarRow>
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
                        </AvatarRow>
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
                          <Tag color="lime" style={{ fontSize: 10, margin: 0, padding: '0 5px' }}>
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
                          <Tag color="cyan" style={{ fontSize: 10, margin: 0, padding: '0 5px' }}>
                            ☕ Tea
                          </Tag>
                        )}
                      </PrefTags>
                    </PersonCard>
                  )
                })}
              </BreakfastGrid>
          </SectionBody>
        </SectionCard>

        {/* ── SECTION 3: SUGGESTIONS ── */}
        <SectionCard>
          <SectionHead>
            <SectionTitle>
              <BulbOutlined style={{ color: '#f9a825', fontSize: 16 }} />
              Dinner Suggestions
            </SectionTitle>
            <HintText>Anyone can suggest · Admin/cook can apply</HintText>
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
                      <SuggestionContent>
                        <SuggestionText>{s.text}</SuggestionText>
                        <SuggestionMeta>
                          {s.userName} · {dayjs(s.createdAt).format('h:mm A')}
                        </SuggestionMeta>
                      </SuggestionContent>
                      <SuggestionActions>
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
                      </SuggestionActions>
                    </SuggestionItem>
                  )
                })}
              </SuggestionList>
            ) : (
              <EmptySuggestion>
                No suggestions yet. Be the first to suggest something!
              </EmptySuggestion>
            )}

            <AddSuggestionRow>
              <Input
                placeholder="Suggest a meal for tonight…"
                value={suggestionText}
                onChange={e => setSuggestionText(e.target.value)}
                onPressEnter={() => void handleAddSuggestion()}
                maxLength={120}
                style={{ flex: 1 }}
                suffix={<CharCount>{suggestionText.length}/120</CharCount>}
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
        title={<ModalTitle>Change Tonight&apos;s Dinner</ModalTitle>}
        footer={
          <ModalFooter>
            <Button size="small" onClick={() => setDinnerModalOpen(false)}>Cancel</Button>
            <Button size="small" type="primary" loading={isSaving} onClick={() => void handleSaveDinner()}>
              Save
            </Button>
          </ModalFooter>
        }
        onCancel={() => setDinnerModalOpen(false)}
        width="min(400px, 95vw)"
        style={{ top: 80 }}
        styles={{ body: { paddingTop: 12 } }}
      >
        <FixedMenuHint>
          Fixed menu for {todayDay}: <strong>{fixedDinner}</strong>
        </FixedMenuHint>
        <Form form={dinnerForm} layout="vertical" requiredMark={false}>
          <Form.Item name="dinner" label="Override with" style={{ marginBottom: 12 }}>
            <Input placeholder={fixedDinner} allowClear autoFocus />
          </Form.Item>
          <Form.Item name="dinnerDescription" label="Description (optional)" style={{ marginBottom: 0 }}>
            <Input.TextArea
              placeholder="e.g. Boneless chicken, extra spicy, served with naan"
              rows={3}
              maxLength={200}
              showCount
              style={{ resize: 'none' }}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Breakfast preference modal ── */}
      <Modal
        open={bfModalOpen}
        title={
          <ModalTitle>
            Breakfast —{' '}
            {bfTargetId === userId
              ? 'My Preference'
              : (profiles.find(p => p.id === bfTargetId)?.full_name ?? '')}
          </ModalTitle>
        }
        footer={
          <ModalFooter>
            <Button size="small" onClick={() => setBfModalOpen(false)}>Cancel</Button>
            <Button size="small" type="primary" loading={isSaving} onClick={() => void handleSaveBreakfast()}>
              Save
            </Button>
          </ModalFooter>
        }
        onCancel={() => setBfModalOpen(false)}
        width="min(360px, 95vw)"
        style={{ top: 80 }}
        styles={{ body: { paddingTop: 12 } }}
      >
        <Form form={bfForm} layout="vertical" requiredMark={false}>
          <SwitchRow>
            <Form.Item name="paratha" valuePropName="checked" label="Paratha" style={{ marginBottom: 0 }}>
              <Switch size="small" checkedChildren="Yes" unCheckedChildren="No" />
            </Form.Item>
            <Form.Item name="sadaRoti" valuePropName="checked" label="Sada Roti" style={{ marginBottom: 0 }}>
              <Switch size="small" checkedChildren="Yes" unCheckedChildren="No" />
            </Form.Item>
            <Form.Item name="tea" valuePropName="checked" label="Tea" style={{ marginBottom: 0 }}>
              <Switch size="small" checkedChildren="Yes" unCheckedChildren="No" />
            </Form.Item>
          </SwitchRow>
          <Form.Item name="egg" label="Egg" style={{ marginBottom: 0 }}>
            <Select options={EGG_OPTIONS} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </PageStack>
  )
}
