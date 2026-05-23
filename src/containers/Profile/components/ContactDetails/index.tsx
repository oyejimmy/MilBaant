import { Typography, Card, Flex } from "antd";
import { IdcardOutlined } from "@ant-design/icons";

interface ContactDetailsProps {
  email?: string;
  phone?: string | null;
  bio?: string | null;
}

export function ContactDetails({ email, phone, bio }: ContactDetailsProps) {
  return (
    <Card
      title={
        <Flex align="center" gap={8}>
          <IdcardOutlined />
          <span>Contact Details</span>
        </Flex>
      }
    >
      <Flex vertical gap={16}>
        <Flex vertical gap={6}>
          <Typography.Text
            type="secondary"
            style={{
              fontSize: 12,
              fontWeight: 600,
              textTransform: "uppercase",
            }}
          >
            Email Address
          </Typography.Text>
          <Typography.Text style={{ fontSize: 14 }}>
            {email ?? "—"}
          </Typography.Text>
        </Flex>

        <Flex vertical gap={6}>
          <Typography.Text
            type="secondary"
            style={{
              fontSize: 12,
              fontWeight: 600,
              textTransform: "uppercase",
            }}
          >
            Phone Number
          </Typography.Text>
          <Typography.Text
            style={{
              color: phone ? "var(--text-strong)" : "var(--text-disabled)",
            }}
          >
            {phone ?? "Not set"}
          </Typography.Text>
        </Flex>

        {bio && (
          <Flex vertical gap={6}>
            <Typography.Text
              type="secondary"
              style={{
                fontSize: 12,
                fontWeight: 600,
                textTransform: "uppercase",
              }}
            >
              Bio
            </Typography.Text>
            <Typography.Text style={{ fontSize: 14, lineHeight: 1.65 }}>
              {bio}
            </Typography.Text>
          </Flex>
        )}
      </Flex>
    </Card>
  );
}
