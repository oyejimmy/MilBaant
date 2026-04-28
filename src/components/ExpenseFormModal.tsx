import { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { useDropzone } from 'react-dropzone'
import {
  Alert,
  Checkbox,
  DatePicker,
  Form,
  Image,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Typography,
} from 'antd'
import styled from 'styled-components'
import { EXPENSE_CATEGORY_OPTIONS } from '@/lib/constants'
import { isWeekendDate } from '@/lib/formatters'
import type { Expense, ExpenseFormValues, Profile } from '@/lib/types'

const UploadArea = styled.div<{ $active: boolean }>`
  border: 1px dashed var(--surface-border);
  border-radius: 18px;
  padding: 18px;
  background: ${(props) =>
    props.$active ? 'rgba(144, 159, 250, 0.16)' : 'rgba(202, 204, 213, 0.12)'};
  transition: 180ms ease;
  cursor: pointer;
`

export interface ExpenseSubmission {
  values: ExpenseFormValues
  file: File | null
}

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

  const isWeekendMeal = category === 'weekend_meal'

  const participantOptions = useMemo(
    () =>
      profiles.map((profile) => ({
        label: profile.full_name,
        value: profile.id,
      })),
    [profiles],
  )

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
          participantIds: profiles.map((profile) => profile.id),
        })
      }
    }
  }, [form, open, editingExpense, lockedCategory, profiles])

  useEffect(() => {
    if (!isWeekendMeal) {
      form.setFieldValue('participantIds', profiles.map((profile) => profile.id))
    }
  }, [form, isWeekendMeal, profiles])

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      const nextFile = acceptedFiles[0] ?? null
      setFile(nextFile)

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }

      setPreviewUrl(nextFile ? URL.createObjectURL(nextFile) : null)
    },
  })

  async function handleOk() {
    const values = await form.validateFields()

    if (values.category === 'weekend_meal' && !isWeekendDate(values.date)) {
      form.setFields([
        {
          name: 'date',
          errors: ['Weekend meals must be recorded on a Saturday or Sunday.'],
        },
      ])
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

  return (
    <Modal
      open={open}
      destroyOnClose
      width="min(680px, 95vw)"
      style={{ top: 20 }}
      styles={{ body: { maxHeight: 'calc(100vh - 160px)', overflowY: 'auto' } }}
      title={editingExpense ? 'Edit Expense' : 'Add Expense'}
      okText={editingExpense ? 'Save Changes' : 'Save Expense'}
      confirmLoading={submitting}
      onCancel={handleClose}
      onOk={() => void handleOk()}
    >
      <Space direction="vertical" size={18} style={{ width: '100%' }}>
        <Alert
          showIcon
          type={isWeekendMeal ? 'info' : 'success'}
          message={
            isWeekendMeal
              ? 'Weekend meals are split only among selected participants.'
              : 'Monthly expenses are split evenly using the member count setting.'
          }
        />

        <Form form={form} layout="vertical">
          <Form.Item
            label="Category"
            name="category"
            rules={[{ required: true, message: 'Please select a category.' }]}
          >
            <Select
              options={
                lockedCategory
                  ? EXPENSE_CATEGORY_OPTIONS.filter((o) => o.value === lockedCategory)
                  : EXPENSE_CATEGORY_OPTIONS
              }
              disabled={!!lockedCategory}
            />
          </Form.Item>

          <Form.Item
            label="Amount"
            name="amount"
            rules={[{ required: true, message: 'Please enter the amount.' }]}
          >
            <InputNumber
              min={0}
              precision={2}
              prefix="PKR"
              style={{ width: '100%' }}
              placeholder="2500"
            />
          </Form.Item>

          <Form.Item
            label={isWeekendMeal ? 'Weekend Date' : 'Expense Date'}
            name="date"
            rules={[{ required: true, message: 'Please choose a date.' }]}
          >
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item
            label="Last Date (Optional)"
            name="lastDate"
            tooltip="End date for recurring expenses or billing period"
          >
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item label="Description" name="description">
            <Input.TextArea
              rows={3}
              placeholder={
                isWeekendMeal
                  ? 'Optional note like breakfast groceries or Sunday dinner.'
                  : 'Optional note like April gas bill or cook advance.'
              }
            />
          </Form.Item>

          {isWeekendMeal ? (
            <Form.Item
              label="Participants"
              name="participantIds"
              rules={[
                {
                  validator: async (_, value: string[] | undefined) => {
                    if (!value?.length) {
                      throw new Error('Please select at least one participant.')
                    }
                  },
                },
              ]}
            >
              <Checkbox.Group options={participantOptions} />
            </Form.Item>
          ) : null}

          <Form.Item label="Bill Image">
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <UploadArea {...getRootProps()} $active={isDragActive}>
                <input {...getInputProps()} />
                <Typography.Text strong style={{ color: 'var(--text-strong)' }}>
                  {file ? file.name : 'Drop an image here or click to upload'}
                </Typography.Text>
                <Typography.Paragraph
                  style={{ margin: '8px 0 0', color: 'var(--text-muted)' }}
                >
                  PNG, JPG, JPEG, and WEBP are supported.
                </Typography.Paragraph>
              </UploadArea>

              {previewUrl ? (
                <Image
                  src={previewUrl}
                  alt="Bill preview"
                  width={160}
                  style={{ borderRadius: 14, overflow: 'hidden' }}
                />
              ) : null}
            </Space>
          </Form.Item>
        </Form>
      </Space>
    </Modal>
  )
}
