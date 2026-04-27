import React from 'react'
import { Button, Popconfirm, Select, Space, Typography } from 'antd'
import styled from 'styled-components'
import type { BedAssignment, Profile } from '@/lib/types'

const PopoverBox = styled.div`
  position: absolute;
  z-index: 1000;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 7px;
  padding: 12px 14px;
  min-width: 200px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.18);
`

const PopoverTitle = styled.div`
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-strong);
  margin-bottom: 10px;
`

interface Props {
  screenX: number
  screenY: number
  bedId: number
  bedLabel: string
  roomName: string
  assignment: BedAssignment | undefined
  unassignedProfiles: Profile[]
  saving: boolean
  onAssign: (bedId: number, userId: string) => void
  onClear: (bedId: number) => void
  onClose: () => void
}

export function BedPopover({
  screenX,
  screenY,
  bedId,
  bedLabel,
  roomName,
  assignment,
  unassignedProfiles,
  saving,
  onAssign,
  onClear,
  onClose,
}: Props) {
  const [selectedUser, setSelectedUser] = React.useState<string | undefined>()

  return (
    <>
      {/* Backdrop to close on outside click */}
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 999 }}
        onClick={onClose}
      />
      <PopoverBox style={{ left: screenX, top: screenY }}>
        <PopoverTitle>
          {roomName} — {bedLabel}
        </PopoverTitle>

        {assignment ? (
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <Typography.Text style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              Occupied by{' '}
              <strong style={{ color: 'var(--text-strong)' }}>
                {assignment.profile?.full_name ?? 'Unknown'}
              </strong>
            </Typography.Text>
            <Popconfirm
              title="Clear this bed assignment?"
              onConfirm={() => { onClear(bedId); onClose() }}
            >
              <Button danger size="small" loading={saving} block>
                Clear Assignment
              </Button>
            </Popconfirm>
          </Space>
        ) : (
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <Typography.Text style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              Empty — assign a flatmate
            </Typography.Text>
            <Select
              size="small"
              style={{ width: '100%' }}
              placeholder="Select flatmate"
              value={selectedUser}
              onChange={setSelectedUser}
              options={unassignedProfiles.map((p) => ({
                label: p.full_name,
                value: p.id,
              }))}
            />
            <Button
              type="primary"
              size="small"
              loading={saving}
              disabled={!selectedUser}
              block
              onClick={() => {
                if (selectedUser) { onAssign(bedId, selectedUser); onClose() }
              }}
            >
              Assign
            </Button>
          </Space>
        )}
      </PopoverBox>
    </>
  )
}
