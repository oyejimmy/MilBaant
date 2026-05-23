import { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { useDropzone } from 'react-dropzone'
import {
  Avatar,
  DatePicker,
  Form,
  Image,
  Input,
  InputNumber,
  Modal,
  Select,
  Typography,
} from 'antd'
import {
  CalendarOutlined,
  CameraOutlined,
  CheckOutlined,
  CloseCircleFilled,
  DollarOutlined,
  FileTextOutlined,
  TagOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons'
import styled from 'styled-components'
import { EXPENSE_CATEGORY_OPTIONS } from '@/lib/constants'
import { isWeekendDate } from '@/lib/formatters'
import type { Expense, ExpenseFormValues, Profile } from '@/lib/types'

// ── Styled components ──────────────────────────────────────────────────────

const ModalBanner = styled.div<{ $edit: boolean }>`
  background: ${({ $edit }) =>
    $edit
      ? 'linear-gradient(135deg, rgba(249,168,37,0.12) 0%, rgba(255,202,40,0.05) 100%)'
      : 'linear-gradient(135deg, rgba(20,101,163,0.12) 0%, rgba(73,165,234,0.05) 100%)'};
  border-bottom: 1px solid var(--border-light);
  padding: 18px 24px 16px;
  display: flex;
  align-items: center;
  gap: 14px;
`

const BannerIcon = styled.div<{ $edit: boolean }>`
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: ${({ $edit }) =>
    $edit
      ? 'linear-gradient(135deg, #f9a825 0%, #ffca28 100%)'
      : 'linear-gradient(135deg, #1465a3 0%, #49a5ea 100%)'};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: ${({ $edit }) =>
    $edit
      ? '0 4px 14px rgba(249,168,37,0.4)'
      : '0 4px 14px rgba(20,101,163,0.35)'};

  .anticon {
    color: white;
    font-size: 20px;
  }
`

const FormBody = styled.div`
  padding: 14px 20px 0;
  display: flex;
  flex-direction: column;
  gap: 0;
`

const SectionLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
  margin-top: 2px;

  .anticon {
    color: var(--primary);
    font-size: 12px;
  }
`

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`

const Divider = styled.div`
  height: 1px;
  background: var(--border-light);
  margin: 12px 0;
`

const TypeBadge = styled.div<{ $weekend: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 11px;
  border-radius: 20px;
  font-size: 11.5px;
  font-weight: 600;
  background: ${({ $weekend }) =>
    $weekend ? 'rgba(249,168,37,0.1)' : 'rgba(64,150,255,0.08)'};
  color: ${({ $weekend }) => ($weekend ? '#f9a825' : 'var(--primary)')};
  border: 1px solid ${({ $weekend }) =>
    $weekend ? 'rgba(249,168,37,0.22)' : 'rgba(64,150,255,0.18)'};
  margin-bottom: 12px;
`

const UploadZone = styled.div<{ $active: boolean; $hasFile: boolean }>`
  border: 1.5px dashed
    ${({ $active, $hasFile }) =>
      $active ? 'var(--primary)' : $hasFile ? 'var(--success)' : 'var(--border-default)'};
  border-radius: 12px;
  padding: 14px 16px;
  background: ${({ $active, $hasFile }) =>
    $active
      ? 'var(--primary-soft)'
      : $hasFile
      ? 'rgba(76,175,80,0.05)'
      : 'var(--bg-elevated)'};
  cursor: pointer;
  transition: all 0.18s ease;
  display: flex;
  align-items: center;
  gap: 12px;

  &:hover {
    border-color: var(--primary);
    background: var(--primary-soft);
  }
`

const UploadIconWrap = styled.div<{ $hasFile: boolean }>`
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: ${({ $hasFile }) =>
    $hasFile ? 'rgba(76,175,80,0.12)' : 'rgba(64,150,255,0.10)'};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  .anticon {
    font-size: 15px;
    color: ${({ $hasFile }) => ($hasFile ? 'var(--success)' : 'var(--primary)')};
  }
`

const PreviewWrap = styled.div`
  position: relative;
  display: inline-block;
  margin-top: 10px;
`

const RemoveBtn = styled.button`
  position: absolute;
  top: -8px;
  right: -8px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  color: var(--error);
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2));

  &:hover { opacity: 0.8; }
`

const ParticipantGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 8px;
`

/* BUG FIX: was styled.label — label wrapping a checkbox caused double-toggle */
const ParticipantChip = styled.div<{ $checked: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1.5px solid ${({ $checked }) => ($checked ? 'var(--primary)' : 'var(--border-light)')};
  background: ${({ $checked }) => ($checked ? 'var(--primary-soft)' : 'var(--bg-elevated)')};
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;

  &:hover {
    border-color: var(--primary);
    background: var(--primary-soft);
  }
`

const CheckDot = styled.div<{ $checked: boolean }>`
  width: 17px;
  height: 17px;
  border-radius: 5px;
  border: 1.5px solid ${({ $checked }) => ($checked ? 'var(--primary)' : 'var(--border-default)')};
  background: ${({ $checked }) => ($checked ? 'var(--primary)' : 'transparent')};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-left: auto;
  transition: all 0.12s ease;

  .anticon {
    font-size: 9px;
    color: white;
    opacity: ${({ $checked }) => ($checked ? 1 : 0)};
    transform: ${({ $checked }) => ($checked ? 'scale(1)' : 'scale(0)')};
    transition: all 0.12s ease;
  }
`

// ── Participant chip component ─────────────────────────────────────────────

function ParticipantCheckbox({
  profile,
  checked,
  onChange,
}: {
  profile: Profile
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  const initials = profile.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <ParticipantChip $checked={checked} onClick={() => onChange(!checked)}>
      <Avatar
        size={24}
        style={{
          background: checked ? 'var(--primary)' : 'var(--border-default)',
          color: 'white',
          fontSize: 10,
          fontWeight: 700,
          flexShrink: 0,
        }}
        icon={!checked ? <UserOutlined /> : undefined}
      >
        {checked ? initials : null}
      </Avatar>
      <Typography.Text
        style={{
          fontSize: 12,
          fontWeight: checked ? 600 : 400,
          color: checked ? 'var(--primary)' : 'var(--text-secondary)',
          lineHeight: 1.2,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flex: 1,
        }}
      >
        {profile.full_name}
      </Typography.Text>
      <CheckDot $checked={checked}>
        <CheckOutlined />
      </CheckDot>
    </ParticipantChip>
  )
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface ExpenseSubmission {
  values: ExpenseFormValues
  file: File | null
}

// ── Component ──────────────────────────────────────────────────────────────

export function ExpenseFormModal({
  open,
  submitting,
  profiles,
  editingExpense,
  lockedCategory,
  onClose,
  onSubmit,
}: {
  open: boolean
  submitting: boolean
  profiles: Profile[]
  editingExpense?: Expense | null
  lockedCategory?: Expense['category']
  onClose: () => void
  onSubmit: (payload: ExpenseSubmission) => Promise<void>
}) {
  const [form] = Form.useForm<ExpenseFormValues>()
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const category = Form.useWatch('category', form)
  const participantIds = Form.useWatch('participantIds', form) ?? []

  const isWeekendMeal = category === 'weekend_meal'
  const isEditing = !!editingExpense

  const categoryLabel = useMemo(
    () => EXPENSE_CATEGORY_OPTIONS.find((o) => o.value === category)?.label ?? '',
    [category],
  )

  // ── Effects ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (open) {
      if (editingExpense) {
        form.setFieldsValue({
          category: editingExpense.category,
          amount: editingExpense.amount,
          date: dayjs(editingExpense.date),
          lastDate: editingExpense.last_date ? dayjs(editingExpense.last_date) : undefined,
          description: editingExpense.description ?? '',
          participantIds: editingExpense.expense_participants.map((p) => p.user_id),
        })
      } else {
        form.setFieldsValue({
          category: lockedCategory ?? 'gas_bill',
          amount: undefined,
          date: dayjs(),
          lastDate: undefined,
          description: '',
          participantIds: profiles.map((p) => p.id),
        })
      }
    }
  }, [form, open, editingExpense, lockedCategory, profiles])

  useEffect(() => {
    if (!isWeekendMeal) {
      form.setFieldValue('participantIds', profiles.map((p) => p.id))
    }
  }, [form, isWeekendMeal, profiles])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  // ── Dropzone ──────────────────────────────────────────────────────────────

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      const nextFile = acceptedFiles[0] ?? null
      setFile(nextFile)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(nextFile ? URL.createObjectURL(nextFile) : null)
    },
  })

  // ── Handlers ──────────────────────────────────────────────────────────────

  function removeFile() {
    setFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }

  async function handleOk() {
    const values = await form.validateFields()

    if (values.category === 'weekend_meal' && !isWeekendDate(values.date)) {
      form.setFields([{
        name: 'date',
        errors: ['Weekend meals must be recorded on a Saturday or Sunday.'],
      }])
      return
    }

    await onSubmit({ values, file })

    form.resetFields()
    setFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }

  function handleClose() {
    form.resetFields()
    setFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    onClose()
  }

  function toggleParticipant(id: string, checked: boolean) {
    const current: string[] = form.getFieldValue('participantIds') ?? []
    const next = checked ? [...current, id] : current.filter((x) => x !== id)
    form.setFieldValue('participantIds', next)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Modal
      open={open}
      destroyOnHidden
      width="min(580px, 96vw)"
      style={{ top: 20 }}
      styles={{
        body: { maxHeight: 'calc(100vh - 130px)', overflowY: 'auto', padding: 0 },
        footer: { padding: '10px 20px 18px', borderTop: '1px solid var(--border-light)', margin: 0 },
      }}
      title={null}
      okText={isEditing ? 'Save Changes' : 'Add Expense'}
      cancelText="Cancel"
      okButtonProps={{ size: 'large', style: { minWidth: 120 } }}
      cancelButtonProps={{ size: 'large' }}
      confirmLoading={submitting}
      onCancel={handleClose}
      onOk={() => void handleOk()}
    >
      {/* ── Banner Header ── */}
      <ModalBanner $edit={isEditing}>
        <BannerIcon $edit={isEditing}>
          <DollarOutlined />
        </BannerIcon>
        <div>
          <Typography.Title level={5} style={{ margin: 0, color: 'var(--text-strong)', lineHeight: 1.3 }}>
            {isEditing ? 'Edit Expense' : 'Add Expense'}
          </Typography.Title>
          <Typography.Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {isEditing ? 'Update the expense details below' : 'Fill in the details to record a new expense'}
          </Typography.Text>
        </div>
      </ModalBanner>

      <FormBody>
        {/* Type badge */}
        {category && (
          <TypeBadge $weekend={isWeekendMeal}>
            <TagOutlined style={{ fontSize: 11 }} />
            {isWeekendMeal ? 'Weekend Meal — split among selected participants' : `Monthly Expense — ${categoryLabel}`}
          </TypeBadge>
        )}

        <Form form={form} layout="vertical" requiredMark={false}>

          {/* ── Category & Amount ── */}
          <SectionLabel>
            <TagOutlined />
            <Typography.Text strong style={{ fontSize: 11.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Expense Details
            </Typography.Text>
          </SectionLabel>

          <Row>
            <Form.Item
              label="Category"
              name="category"
              rules={[{ required: true, message: 'Select a category' }]}
              style={{ marginBottom: 12 }}
            >
              <Select
                options={
                  lockedCategory
                    ? EXPENSE_CATEGORY_OPTIONS.filter((o) => o.value === lockedCategory)
                    : EXPENSE_CATEGORY_OPTIONS
                }
                disabled={!!lockedCategory}
                placeholder="Select category"
              />
            </Form.Item>

            <Form.Item
              label="Amount (PKR)"
              name="amount"
              rules={[{ required: true, message: 'Enter the amount' }]}
              style={{ marginBottom: 12 }}
            >
              <InputNumber
                min={0}
                precision={2}
                prefix={<DollarOutlined style={{ color: 'var(--text-muted)' }} />}
                style={{ width: '100%' }}
                placeholder="0.00"
              />
            </Form.Item>
          </Row>

          {/* ── Dates ── */}
          <Row>
            <Form.Item
              label={isWeekendMeal ? 'Weekend Date' : 'Expense Date'}
              name="date"
              rules={[{ required: true, message: 'Choose a date' }]}
              style={{ marginBottom: 12 }}
            >
              <DatePicker
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
                suffixIcon={<CalendarOutlined style={{ color: 'var(--text-muted)' }} />}
              />
            </Form.Item>

            <Form.Item
              label="End Date (optional)"
              name="lastDate"
              tooltip="End date for recurring expenses or billing period"
              style={{ marginBottom: 12 }}
            >
              <DatePicker
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
                suffixIcon={<CalendarOutlined style={{ color: 'var(--text-muted)' }} />}
              />
            </Form.Item>
          </Row>

          {/* ── Description ── */}
          <Form.Item
            label={
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <FileTextOutlined style={{ color: 'var(--primary)', fontSize: 12 }} />
                Description
                <Typography.Text style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</Typography.Text>
              </span>
            }
            name="description"
            style={{ marginBottom: 12 }}
          >
            <Input.TextArea
              rows={2}
              placeholder={isWeekendMeal ? 'e.g. Sunday breakfast groceries' : 'e.g. April gas bill'}
              style={{ resize: 'none' }}
            />
          </Form.Item>

          {/* ── Participants (weekend meal only) ── */}
          {isWeekendMeal && (
            <>
              <Divider />
              <SectionLabel>
                <TeamOutlined />
                <Typography.Text strong style={{ fontSize: 11.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Participants
                </Typography.Text>
                <Typography.Text style={{ fontSize: 11.5, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                  {participantIds.length} / {profiles.length} selected
                </Typography.Text>
              </SectionLabel>

              <Form.Item
                name="participantIds"
                rules={[{
                  validator: async (_, value: string[] | undefined) => {
                    if (!value?.length) throw new Error('Select at least one participant')
                  },
                }]}
                style={{ marginBottom: 12 }}
              >
                <ParticipantGrid>
                  {profiles.map((profile) => (
                    <ParticipantCheckbox
                      key={profile.id}
                      profile={profile}
                      checked={participantIds.includes(profile.id)}
                      onChange={(checked) => toggleParticipant(profile.id, checked)}
                    />
                  ))}
                </ParticipantGrid>
              </Form.Item>
            </>
          )}

          {/* ── Bill Image ── */}
          <Divider />
          <SectionLabel>
            <CameraOutlined />
            <Typography.Text strong style={{ fontSize: 11.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Bill Image
            </Typography.Text>
            <Typography.Text style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400, marginLeft: 2 }}>(optional)</Typography.Text>
          </SectionLabel>

          <Form.Item name="billImage" style={{ marginBottom: 16 }}>
            <UploadZone {...getRootProps()} $active={isDragActive} $hasFile={!!file}>
              <input {...getInputProps()} />
              <UploadIconWrap $hasFile={!!file}>
                <CameraOutlined />
              </UploadIconWrap>
              <div>
                <Typography.Text strong style={{ fontSize: 13, color: 'var(--text-strong)', display: 'block' }}>
                  {file ? file.name : isDragActive ? 'Drop it here…' : 'Upload bill image'}
                </Typography.Text>
                <Typography.Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {file ? `${(file.size / 1024).toFixed(0)} KB` : 'PNG, JPG, WEBP — drag & drop or click'}
                </Typography.Text>
              </div>
            </UploadZone>

            {previewUrl && (
              <PreviewWrap>
                <Image
                  src={previewUrl}
                  alt="Bill preview"
                  width={120}
                  style={{ borderRadius: 10, overflow: 'hidden', display: 'block' }}
                />
                <RemoveBtn type="button" onClick={removeFile} aria-label="Remove image">
                  <CloseCircleFilled />
                </RemoveBtn>
              </PreviewWrap>
            )}
          </Form.Item>

        </Form>
      </FormBody>
    </Modal>
  )
}
