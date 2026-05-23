import { useEffect, useState, useCallback } from "react";
import { App, Form, Grid, Flex } from "antd";
import { PageStack } from "@/components/Glass/index";
import { useAuth } from "@/hooks/useAuth";
import { useUpdateOwnProfile } from "@/hooks/useProfiles";
import { uploadAvatar } from "@/lib/storage";
import { PageWrap } from "./components/styles";
import { ProfileHeader } from "./components/ProfileHeader";
import { ProfileForm } from "./components/ProfileForm";
import { ContactDetails } from "./components/ContactDetails";
import { AccountStatus } from "./components/AccountStatus";
import type { ProfileFormValues } from "./types";
import { ROLE_META } from "./components/constants";

const { useBreakpoint } = Grid;

export function ProfilePage() {
  const { profile, userId, email } = useAuth();
  const { message } = App.useApp();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const updateProfile = useUpdateOwnProfile();

  const [editing, setEditing] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [form] = Form.useForm<ProfileFormValues>();

  useEffect(() => {
    if (profile) {
      form.setFieldsValue({
        full_name: profile.full_name,
        phone: profile.phone ?? "",
        bio: profile.bio ?? "",
      });
    }
  }, [profile, form]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file || !userId) return;

      if (file.size > 3 * 1024 * 1024) {
        message.error("Image must be smaller than 3 MB.");
        return;
      }

      setAvatarPreview(URL.createObjectURL(file));
      setUploadingAvatar(true);

      try {
        const url = await uploadAvatar(userId, file);
        await updateProfile.mutateAsync({ userId, avatarUrl: url });
        message.success("Profile picture updated.");
      } catch (err) {
        setAvatarPreview(null);
        message.error(err instanceof Error ? err.message : "Upload failed.");
      } finally {
        setUploadingAvatar(false);
      }
    },
    [userId, updateProfile, message],
  );

  const handleSave = async () => {
    if (!userId) return;
    try {
      const values = await form.validateFields();
      await updateProfile.mutateAsync({
        userId,
        fullName: values.full_name.trim(),
        phone: values.phone.trim() || undefined,
        bio: values.bio.trim() || undefined,
      });
      message.success("Profile updated.");
      setEditing(false);
    } catch (err) {
      if (err instanceof Error) message.error(err.message);
    }
  };

  if (!profile) return null;

  const avatarSize = isMobile ? 64 : 72;
  const roleMeta = ROLE_META[profile.role];

  return (
    <PageWrap>
      <PageStack>
        <Flex vertical gap={16}>
          <ProfileHeader
            profile={profile}
            email={email}
            editing={editing}
            uploadingAvatar={uploadingAvatar}
            avatarPreview={avatarPreview}
            avatarSize={avatarSize}
            isMobile={isMobile}
            updateProfile={updateProfile}
            form={form}
            onEdit={() => setEditing(true)}
            onCancel={() => {
              setEditing(false);
              form.resetFields();
            }}
            onSave={handleSave}
            onAvatarUpload={onDrop}
          />

          <ProfileForm form={form} editing={editing} />

          {!editing && (
            <Flex gap={16} vertical={isMobile}>
              <ContactDetails
                email={email}
                phone={profile.phone}
                bio={profile.bio}
              />
              <AccountStatus
                isActive={profile.is_active !== false}
                roleMeta={roleMeta}
                canAddExpenses={profile.can_add_expenses ?? false}
                roleIcon={roleMeta?.icon}
              />
            </Flex>
          )}
        </Flex>
      </PageStack>
    </PageWrap>
  );
}
