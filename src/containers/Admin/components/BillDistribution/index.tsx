import { Flex, Typography, InputNumber, Button, Avatar, Card } from "antd";
import { TeamOutlined, SaveOutlined } from "@ant-design/icons";
import type { Profile } from "@/lib/types";
import { avatarColor, initials } from "../helpers";

interface BillDistributionProps {
  profiles: Profile[];
  memberCount: number;
  memberCountDraft: number | null;
  isPending: boolean;
  onDraftChange: (value: number | null) => void;
  onSave: () => void;
}

export function BillDistribution({
  profiles,
  memberCount,
  memberCountDraft,
  isPending,
  onDraftChange,
  onSave,
}: BillDistributionProps) {
  const activeMembers = profiles.filter((p) => p.is_active !== false);

  return (
    <Card>
      <Flex align="center" gap={8} style={{ marginBottom: 16 }}>
        <TeamOutlined style={{ color: "var(--primary)", fontSize: 15 }} />
        <Typography.Title level={5} style={{ margin: 0 }}>
          Bill Distribution
        </Typography.Title>
      </Flex>

      <Card style={{ marginBottom: 16 }}>
        <Typography.Text
          style={{
            fontSize: 12,
            color: "var(--text-muted)",
            fontWeight: 600,
            textTransform: "uppercase",
            display: "block",
            marginBottom: 10,
          }}
        >
          Active Flatmates ({activeMembers.length})
        </Typography.Text>
        <Flex wrap gap={6}>
          {activeMembers.map((p) => (
            <Flex
              key={p.id}
              align="center"
              gap={5}
              style={{
                padding: "4px 10px 4px 4px",
                borderRadius: 20,
                background: "var(--card-bg)",
                border: "1px solid var(--card-border)",
              }}
            >
              <Avatar
                size={20}
                style={{
                  background: avatarColor(p.full_name),
                  color: "#fff",
                  fontSize: 9,
                  fontWeight: 700,
                }}
              >
                {initials(p.full_name)}
              </Avatar>
              <Typography.Text style={{ fontSize: 12, fontWeight: 500 }}>
                {p.full_name.split(" ")[0]}
              </Typography.Text>
            </Flex>
          ))}
        </Flex>
      </Card>

      <Flex align="flex-start" gap={12} wrap>
        <div style={{ flex: 1, minWidth: 200 }}>
          <Typography.Text
            style={{
              fontSize: 13,
              fontWeight: 600,
              display: "block",
              marginBottom: 4,
            }}
          >
            Members sharing the bill
          </Typography.Text>
          <Typography.Text
            type="secondary"
            style={{ fontSize: 12, display: "block", marginBottom: 10 }}
          >
            Fixed monthly expenses are split equally among this many flatmates.
          </Typography.Text>
          <Flex align="center" gap={8} wrap>
            <InputNumber
              min={1}
              max={50}
              value={memberCountDraft ?? memberCount}
              onChange={onDraftChange}
              style={{ width: 100 }}
              size="large"
            />
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={isPending}
              onClick={onSave}
              size="large"
            >
              Save
            </Button>
            {activeMembers.length !== memberCount && (
              <Button
                size="large"
                onClick={() => onDraftChange(activeMembers.length)}
              >
                Use active count ({activeMembers.length})
              </Button>
            )}
          </Flex>
        </div>

        <Card style={{ minWidth: 160, flexShrink: 0 }}>
          <Typography.Text
            style={{
              fontSize: 11,
              color: "var(--primary)",
              fontWeight: 700,
              textTransform: "uppercase",
              display: "block",
              marginBottom: 4,
            }}
          >
            Current setting
          </Typography.Text>
          <Typography.Text
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: "var(--primary)",
              display: "block",
              lineHeight: 1.1,
            }}
          >
            {memberCountDraft ?? memberCount}
          </Typography.Text>
          <Typography.Text
            style={{ fontSize: 12, color: "var(--primary)", opacity: 0.8 }}
          >
            flatmates splitting bills
          </Typography.Text>
        </Card>
      </Flex>
    </Card>
  );
}
