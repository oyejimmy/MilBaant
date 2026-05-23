import { Button, Card, Flex, Tag, Typography } from "antd";
import { EditOutlined, SaveOutlined } from "@ant-design/icons";
import { AvatarUpload } from "../AvatarUpload";
import { ROLE_META } from "../constants";

interface ProfileHeaderProps {
  profile: any;
  email?: string;
  editing: boolean;
  uploadingAvatar: boolean;
  avatarPreview: string | null;
  avatarSize: number;
  isMobile: boolean;
  updateProfile: any;
  form: any;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onAvatarUpload: (file: File) => Promise<void>;
}

export function ProfileHeader({
  profile,
  email,
  editing,
  uploadingAvatar,
  avatarPreview,
  avatarSize,
  isMobile,
  updateProfile,
  onEdit,
  onCancel,
  onSave,
  onAvatarUpload,
}: ProfileHeaderProps) {
  const roleMeta = ROLE_META[profile.role as keyof typeof ROLE_META];
  const isActive = profile.is_active !== false;
  const displayAvatar = avatarPreview ?? profile.avatar_url ?? null;

  return (
    <Card style={{ marginBottom: 16 }}>
      <Flex
        align={isMobile ? "stretch" : "center"}
        gap={16}
        vertical={isMobile}
      >
        <Flex
          align="center"
          gap={16}
          flex={1}
          vertical={isMobile}
          style={{ textAlign: isMobile ? "center" : "left" }}
        >
          <AvatarUpload
            avatarUrl={displayAvatar}
            fullName={profile.full_name}
            uploading={uploadingAvatar}
            size={avatarSize}
            onUpload={onAvatarUpload}
          />

          <Flex vertical gap={4} flex={1}>
            <Typography.Title
              level={isMobile ? 4 : 3}
              style={{
                margin: 0,
                color: "var(--text-strong)",
                lineHeight: 1.2,
              }}
            >
              {profile.full_name}
            </Typography.Title>
            <Flex
              align="center"
              gap={8}
              wrap="wrap"
              justify={isMobile ? "center" : "flex-start"}
            >
              <Tag
                style={{
                  background: roleMeta?.bg,
                  color: roleMeta?.color,
                  border: `1px solid ${roleMeta?.color ?? "#d9d9d9"}30`,
                  borderRadius: 20,
                  fontWeight: 700,
                  fontSize: 12,
                  margin: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                {roleMeta?.icon} {roleMeta?.label}
              </Tag>
              {isActive ? (
                <Tag color="success" style={{ margin: 0, borderRadius: 20 }}>
                  Active
                </Tag>
              ) : (
                <Tag color="error" style={{ margin: 0, borderRadius: 20 }}>
                  Deactivated
                </Tag>
              )}
            </Flex>
            <Typography.Text
              style={{ color: "var(--text-muted)", fontSize: 13 }}
            >
              {email}
            </Typography.Text>
          </Flex>
        </Flex>

        <Flex gap={8} style={{ width: isMobile ? "100%" : "auto" }}>
          {editing ? (
            <>
              <Button
                onClick={onCancel}
                style={{ flex: isMobile ? 1 : undefined }}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                loading={updateProfile.isPending}
                onClick={onSave}
                style={{ flex: isMobile ? 1 : undefined }}
              >
                Save
              </Button>
            </>
          ) : (
            <Button
              icon={<EditOutlined />}
              onClick={onEdit}
              style={{ width: isMobile ? "100%" : undefined }}
            >
              Edit Profile
            </Button>
          )}
        </Flex>
      </Flex>
    </Card>
  );
}
