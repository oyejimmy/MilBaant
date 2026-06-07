import { useRef } from "react";
import { Button, Form, Input, Tag, Tooltip, Typography } from "antd";
import {
  CameraOutlined,
  CheckCircleOutlined,
  EditOutlined,
  MailOutlined,
  PhoneOutlined,
  SaveOutlined,
  StopOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useDropzone } from "react-dropzone";
import {
  CameraBtn,
  EmployeeCard,
  FieldEmpty,
  FieldLabel,
  FieldValue,
  InfoField,
  InfoGrid,
  InfoHeader,
  InfoPanel,
  InfoSubtitle,
  InfoTitle,
  PermChip,
  PermissionsRow,
  PhotoDivider,
  PhotoFrame,
  PhotoImg,
  PhotoInitials,
  PhotoMetaRow,
  PhotoName,
  PhotoPanel,
  PhotoRole,
  PhotoStatusDot,
  SectionDivider,
  SectionLabel,
  UploadingPulse,
} from "../styles";
import { ROLE_META } from "../constants";
import { initials, avatarColor } from "../helpers";

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
  updateProfile,
  form,
  onEdit,
  onCancel,
  onSave,
  onAvatarUpload,
}: ProfileHeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const roleMeta = ROLE_META[profile.role as keyof typeof ROLE_META];
  const isActive = profile.is_active !== false;
  const displayAvatar = avatarPreview ?? profile.avatar_url ?? null;
  const hasAvatar = !!displayAvatar;
  const nameInitials = initials(profile.full_name || "U");
  const bgColor = avatarColor(profile.full_name || "User");

  // Panel gradient based on role
  const panelGradient =
    profile.role === "admin"
      ? "linear-gradient(160deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)"
      : profile.role === "cook"
        ? "linear-gradient(160deg, #7c2d12 0%, #9a3412 50%, #c2410c 100%)"
        : "linear-gradient(160deg, #1e3a5f 0%, #1d4ed8 60%, #2563eb 100%)";

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: async (files) => {
      if (files[0]) await onAvatarUpload(files[0]);
    },
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
    maxFiles: 1,
    noClick: true,
  });

  return (
    <EmployeeCard>
      {/* ── Left: Photo Panel ── */}
      <PhotoPanel $color={panelGradient} {...getRootProps()}>
        <input {...getInputProps()} />

        <PhotoFrame>
          <Tooltip title={isDragActive ? "Drop to upload" : "Click to change photo"}>
            {uploadingAvatar ? (
              <UploadingPulse>
                {hasAvatar ? (
                  <PhotoImg src={displayAvatar} alt={profile.full_name} />
                ) : (
                  <PhotoInitials style={{ background: bgColor }}>
                    {nameInitials}
                  </PhotoInitials>
                )}
              </UploadingPulse>
            ) : hasAvatar ? (
              <PhotoImg
                src={displayAvatar}
                alt={profile.full_name}
                onClick={() => fileInputRef.current?.click()}
                style={{ cursor: "pointer" }}
              />
            ) : (
              <PhotoInitials
                style={{ background: bgColor, cursor: "pointer" }}
                onClick={() => fileInputRef.current?.click()}
              >
                {nameInitials}
              </PhotoInitials>
            )}
          </Tooltip>

          <CameraBtn
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            title="Change profile picture"
          >
            <CameraOutlined />
          </CameraBtn>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onAvatarUpload(file);
              e.target.value = "";
            }}
          />
        </PhotoFrame>

        <PhotoName>{profile.full_name}</PhotoName>
        <PhotoRole>{roleMeta?.label}</PhotoRole>
        <PhotoStatusDot $active={isActive}>
          {isActive ? "Active" : "Deactivated"}
        </PhotoStatusDot>

        <PhotoDivider />

        <PhotoMetaRow>
          <MailOutlined />
          <span style={{ fontSize: 11, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {email ?? "—"}
          </span>
        </PhotoMetaRow>

        {profile.phone && (
          <PhotoMetaRow style={{ marginTop: 6 }}>
            <PhoneOutlined />
            <span>{profile.phone}</span>
          </PhotoMetaRow>
        )}
      </PhotoPanel>

      {/* ── Right: Info Panel ── */}
      <InfoPanel>
        <InfoHeader>
          <div>
            <InfoTitle>{profile.full_name}</InfoTitle>
            <InfoSubtitle>
              <Tag
                style={{
                  background: roleMeta?.bg,
                  color: roleMeta?.color,
                  border: `1px solid ${roleMeta?.color ?? "#d9d9d9"}40`,
                  borderRadius: 20,
                  fontWeight: 700,
                  fontSize: 11,
                  margin: 0,
                }}
              >
                {roleMeta?.icon}&nbsp;{roleMeta?.label}
              </Tag>
              &nbsp;&nbsp;
              <Typography.Text style={{ color: "var(--text-muted)", fontSize: 13 }}>
                {email}
              </Typography.Text>
            </InfoSubtitle>
          </div>

          {/* Edit / Save / Cancel */}
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            {editing ? (
              <>
                <Button size="small" onClick={onCancel}>Cancel</Button>
                <Button
                  size="small"
                  type="primary"
                  icon={<SaveOutlined />}
                  loading={updateProfile.isPending}
                  onClick={onSave}
                >
                  Save
                </Button>
              </>
            ) : (
              <Button size="small" icon={<EditOutlined />} onClick={onEdit}>
                Edit Profile
              </Button>
            )}
          </div>
        </InfoHeader>

        {/* ── Edit form ── */}
        {editing ? (
          <Form form={form} layout="vertical" requiredMark={false}>
            <InfoGrid>
              <Form.Item
                label="Full Name"
                name="full_name"
                rules={[{ required: true, message: "Required" }]}
                style={{ marginBottom: 0 }}
              >
                <Input
                  prefix={<UserOutlined style={{ color: "var(--text-muted)" }} />}
                  placeholder="Your full name"
                />
              </Form.Item>
              <Form.Item label="Phone Number" name="phone" style={{ marginBottom: 0 }}>
                <Input
                  prefix={<PhoneOutlined style={{ color: "var(--text-muted)" }} />}
                  placeholder="+92 300 0000000"
                />
              </Form.Item>
            </InfoGrid>
            <Form.Item label="Bio" name="bio" style={{ marginBottom: 0 }}>
              <Input.TextArea
                placeholder="A short bio about yourself…"
                rows={3}
                maxLength={200}
                showCount
                style={{ resize: "none" }}
              />
            </Form.Item>
          </Form>
        ) : (
          <>
            {/* ── Contact info ── */}
            <SectionLabel>Contact Information</SectionLabel>
            <InfoGrid>
              <InfoField>
                <FieldLabel>Email Address</FieldLabel>
                <FieldValue>{email ?? <FieldEmpty>Not set</FieldEmpty>}</FieldValue>
              </InfoField>
              <InfoField>
                <FieldLabel>Phone Number</FieldLabel>
                {profile.phone
                  ? <FieldValue>{profile.phone}</FieldValue>
                  : <FieldEmpty>Not set</FieldEmpty>
                }
              </InfoField>
              {profile.bio && (
                <InfoField style={{ gridColumn: "1 / -1" }}>
                  <FieldLabel>Bio</FieldLabel>
                  <FieldValue style={{ fontWeight: 400, fontSize: "0.85rem", lineHeight: 1.65 }}>
                    {profile.bio}
                  </FieldValue>
                </InfoField>
              )}
            </InfoGrid>

            <SectionDivider />

            {/* ── Account status ── */}
            <SectionLabel>Account & Permissions</SectionLabel>
            <PermissionsRow>
              <PermChip $on={isActive}>
                {isActive ? <CheckCircleOutlined /> : <StopOutlined />}
                {isActive ? "Account Active" : "Account Deactivated"}
              </PermChip>
              <PermChip $on={true}>
                {roleMeta?.icon}&nbsp;{roleMeta?.label}
              </PermChip>
              <PermChip $on={profile.can_add_expenses ?? false}>
                <UserOutlined />
                {profile.can_add_expenses ? "Can Add Expenses" : "View Only"}
              </PermChip>
            </PermissionsRow>
          </>
        )}
      </InfoPanel>
    </EmployeeCard>
  );
}
