/**
 * AssignModal — Ant Design modal for assigning / clearing a bed.
 * Shown when an admin clicks a bed in the 3D scene.
 */
import { useState } from 'react'
import { Button, Modal, Popconfirm, Select, Space, Typography } from 'antd'
import type { BedConfig } from './sceneConfig'
import type { BedAssignment, Profile } from '@/lib/types'

interface AssignModalProps {
  open: boolean
  bed: BedConfig | null
  assignment: BedAssignment | undefined
  unassignedProfiles: Profile[]
  saving: boolean
  onAssign: (bedId: number, userId: string) => void
  onClear: (bedId: number) => void
  onClose: () => void
  /** Map from bed key (e.g. 'r1a') to DB bed id */
  bedKeyToId: Map<string, number>
}

export function AssignModal({
  open,
  bed,
  assignment,
  unassignedProfiles,
  saving,
  onAssign,
  onClear,
  onClose,
  bedKeyToId,
}: AssignModalProps) {
  const [selectedUser, setSelectedUser] = useState<string | undefined>()

  if (!bed) return null

  const dbBedId = bedKeyToId.get(bed.key)
  const roomColors: Record<string, string> = {
    room1: '#7ab8e8',
    room2: '#81c784',
    room3: '#f48fb1',
    lounge: '#ba68c8',
    kitchen: '#ffd54f',
  }
  const accentColor = roomColors[bed.room] ?? '#909ffa'

  function handleAssign() {
    if (selectedUser && dbBedId !== undefined) {
      onAssign(dbBedId, selectedUser)
      setSelectedUser(undefined)
      // Don't close immediately - let parent handle it after mutation succeeds
    }
  }

  function handleClear() {
    if (dbBedId !== undefined) {
      onClear(dbBedId)
      onClose()
    }
  }

  return (
    <Modal
      open={open}
      onCancel={() => { setSelectedUser(undefined); onClose() }}
      footer={null}
      title={
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              display: 'inline-block',
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: accentColor,
            }}
          />
          {bed.label} · {bed.room.replace('room', 'Room ').replace('lounge', 'Lounge').replace('kitchen', 'Kitchen')}
        </span>
      }
      width={340}
      centered
    >
      {assignment ? (
        <Space orientation="vertical" size={12} style={{ width: '100%' }}>
          <Typography.Text style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Currently occupied by{' '}
            <strong style={{ color: 'var(--text-strong)' }}>
              {assignment.profile?.full_name ?? 'Unknown'}
            </strong>
          </Typography.Text>
          <Popconfirm
            title="Clear this bed assignment?"
            description="The flatmate will be unassigned from this bed."
            onConfirm={handleClear}
            okText="Clear"
            okButtonProps={{ danger: true }}
          >
            <Button danger loading={saving} block>
              Clear Assignment
            </Button>
          </Popconfirm>
        </Space>
      ) : (
        <Space orientation="vertical" size={12} style={{ width: '100%' }}>
          <Typography.Text style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            This bed is empty. Assign a flatmate:
          </Typography.Text>
          <Select
            style={{ width: '100%' }}
            placeholder="Select flatmate…"
            value={selectedUser}
            onChange={setSelectedUser}
            options={unassignedProfiles.map((p) => ({
              label: p.full_name,
              value: p.id,
            }))}
            showSearch
            filterOption={(input, option) =>
              String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
          />
          <Button
            type="primary"
            loading={saving}
            disabled={!selectedUser}
            block
            onClick={handleAssign}
          >
            Assign
          </Button>
        </Space>
      )}
    </Modal>
  )
}
