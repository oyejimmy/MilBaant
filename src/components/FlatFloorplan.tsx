import { useMemo, useState } from 'react'
import {
  Button,
  Empty,
  Popover,
  Select,
  Space,
  Tag,
  Typography,
} from 'antd'
import styled from 'styled-components'
import type { Bed, BedAssignment, Profile, Room } from '@/lib/types'
import { GlassPanel, SectionBlock } from '@/components/Glass'

const FloorGrid = styled.div`
  display: grid;
  gap: 20px;
`

const BedroomRow = styled.div`
  display: grid;
  gap: 18px;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
`

const BedroomCard = styled(GlassPanel)`
  padding: 18px;
  display: grid;
  gap: 18px;
`

const BedroomHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
`

const BedsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
`

const BedCard = styled.button`
  border: 1px solid var(--card-border);
  border-radius: 7px;
  padding: 14px;
  min-height: 110px;
  background: var(--card-bg);
  display: grid;
  gap: 8px;
  text-align: left;
  color: inherit;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;

  &:hover {
    border-color: var(--periwinkle-blue);
  }
`

const CommonSpaces = styled.div`
  display: grid;
  gap: 18px;
  grid-template-columns: 1.2fr 1.6fr 1fr;

  @media (max-width: 920px) {
    grid-template-columns: 1fr;
  }
`

const CommonArea = styled(SectionBlock)`
  min-height: 150px;
  display: grid;
  align-content: start;
  gap: 10px;
`

function AssignmentPopover({
  bed,
  assignment,
  profiles,
  saving,
  onAssign,
}: {
  bed: Bed
  assignment?: BedAssignment
  profiles: Profile[]
  saving: boolean
  onAssign: (bedId: number, userId: string | null) => Promise<void>
}) {
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(
    assignment?.profile?.id,
  )

  return (
    <Space direction="vertical" size={12} style={{ width: 240 }}>
      <Select
        allowClear
        placeholder="Assign a flatmate"
        value={selectedUserId}
        options={profiles.map((profile) => ({
          label: profile.full_name,
          value: profile.id,
        }))}
        onChange={(value) => setSelectedUserId(value)}
      />
      <Button
        type="primary"
        loading={saving}
        onClick={() => void onAssign(bed.id, selectedUserId ?? null)}
      >
        Save Assignment
      </Button>
    </Space>
  )
}

export function FlatFloorplan({
  rooms,
  beds,
  assignments,
  profiles,
  isAdmin,
  saving,
  onAssign,
}: {
  rooms: Room[]
  beds: Bed[]
  assignments: BedAssignment[]
  profiles: Profile[]
  isAdmin: boolean
  saving: boolean
  onAssign: (bedId: number, userId: string | null) => Promise<void>
}) {
  const assignmentsByBedId = useMemo(
    () => new Map(assignments.map((assignment) => [assignment.bed_id, assignment])),
    [assignments],
  )

  const bedrooms = rooms.filter((room) => room.type === 'bedroom')
  const commonSpaces = rooms.filter((room) => room.type !== 'bedroom' && room.type !== 'washroom')

  if (!rooms.length) {
    return (
      <SectionBlock>
        <Empty description="No flat layout data found. Run the SQL seed to create rooms and beds." />
      </SectionBlock>
    )
  }

  return (
    <FloorGrid>
      <BedroomRow>
        {bedrooms.map((room) => {
          const roomBeds = beds.filter((bed) => bed.room_id === room.id)
          const washroom = rooms.find(
            (candidate) => candidate.name === `${room.name} Washroom`,
          )

          return (
            <BedroomCard key={room.id}>
              <BedroomHeader>
                <div>
                  <Typography.Title level={4} style={{ margin: 0, color: 'var(--text-strong)' }}>
                    {room.name}
                  </Typography.Title>
                  <Typography.Text style={{ color: 'var(--text-muted)' }}>
                    Two-bed room with attached washroom
                  </Typography.Text>
                </div>
                <Tag color="geekblue">{washroom?.name ?? 'Washroom'}</Tag>
              </BedroomHeader>

              <BedsGrid>
                {roomBeds.map((bed) => {
                  const assignment = assignmentsByBedId.get(bed.id)
                  const bedContent = (
                    <BedCard type="button">
                      <Typography.Text strong style={{ color: 'var(--text-strong)' }}>
                        {bed.label}
                      </Typography.Text>
                      <Typography.Title level={5} style={{ margin: 0, color: 'var(--text-strong)' }}>
                        {assignment?.profile?.full_name ?? 'Empty'}
                      </Typography.Title>
                      <Typography.Text style={{ color: 'var(--text-muted)' }}>
                        {isAdmin ? 'Tap to assign or clear this bed.' : 'Current occupant'}
                      </Typography.Text>
                    </BedCard>
                  )

                  if (!isAdmin) {
                    return <div key={bed.id}>{bedContent}</div>
                  }

                  return (
                    <Popover
                      key={bed.id}
                      trigger="click"
                      content={
                        <AssignmentPopover
                          bed={bed}
                          assignment={assignment}
                          profiles={profiles}
                          saving={saving}
                          onAssign={onAssign}
                        />
                      }
                    >
                      {bedContent}
                    </Popover>
                  )
                })}
              </BedsGrid>
            </BedroomCard>
          )
        })}
      </BedroomRow>

      <CommonSpaces>
        {commonSpaces.map((space) => (
          <CommonArea key={space.id}>
            <Typography.Title level={4} style={{ margin: 0, color: 'var(--text-strong)' }}>
              {space.name}
            </Typography.Title>
            <Typography.Paragraph
              style={{ margin: 0, color: 'var(--text-muted)' }}
            >
              {space.type === 'kitchen'
                ? 'Kitchen area for daily groceries, weekend prep, and shared supplies.'
                : space.type === 'lounge'
                  ? 'TV lounge for shared downtime and common seating.'
                  : 'Dining area for group meals and gatherings.'}
            </Typography.Paragraph>
          </CommonArea>
        ))}
      </CommonSpaces>
    </FloorGrid>
  )
}
