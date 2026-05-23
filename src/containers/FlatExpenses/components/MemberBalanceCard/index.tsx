import { Avatar, Progress, Typography, Col } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { formatCurrency } from "@/lib/formatters";
import { MemberBalanceCard as StyledCard } from "../styles";
import type { FlatFundMemberSummary } from "../../types";

interface MemberBalanceCardProps {
  member: FlatFundMemberSummary;
}

export function MemberBalanceCardComponent({ member }: MemberBalanceCardProps) {
  const status =
    member.balance > 0.01
      ? "surplus"
      : member.balance < -0.01
        ? "deficit"
        : "zero";
  const usedPct =
    member.totalAllocated > 0
      ? Math.min(100, (member.totalSpent / member.totalAllocated) * 100)
      : 0;

  return (
    <Col xs={24} sm={12} lg={8}>
      <StyledCard $status={status}>
        <Avatar
          size={36}
          style={{
            background: "#909ffa",
            color: "#fff",
            fontWeight: 700,
            fontSize: 13,
            flexShrink: 0,
          }}
          icon={<UserOutlined />}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <Typography.Text
            strong
            style={{
              color: "var(--text-strong)",
              display: "block",
              fontSize: 13,
            }}
          >
            {member.fullName}
          </Typography.Text>
          <div
            style={{
              display: "flex",
              gap: 10,
              marginTop: 2,
              flexWrap: "wrap",
            }}
          >
            <Typography.Text style={{ fontSize: 11, color: "#52c41a" }}>
              +{formatCurrency(member.totalAllocated)}
            </Typography.Text>
            <Typography.Text style={{ fontSize: 11, color: "#ff4d4f" }}>
              -{formatCurrency(member.totalSpent)}
            </Typography.Text>
          </div>
          <Progress
            percent={usedPct}
            showInfo={false}
            size="small"
            strokeColor={status === "deficit" ? "#ff4d4f" : "#52c41a"}
            railColor="var(--card-border)"
            style={{ marginTop: 4 }}
          />
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <Typography.Text
            strong
            style={{
              color:
                status === "surplus"
                  ? "#52c41a"
                  : status === "deficit"
                    ? "#ff4d4f"
                    : "#909ffa",
              fontSize: 14,
            }}
          >
            {member.balance >= 0 ? "+" : ""}
            {formatCurrency(member.balance)}
          </Typography.Text>
          <Typography.Text
            style={{
              display: "block",
              fontSize: 10,
              color: "var(--text-muted)",
            }}
          >
            {status === "surplus"
              ? "remaining"
              : status === "deficit"
                ? "overspent"
                : "balanced"}
          </Typography.Text>
        </div>
      </StyledCard>
    </Col>
  );
}
