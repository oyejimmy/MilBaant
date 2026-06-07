import { useEffect, useState, useCallback } from "react";
import { App, Form } from "antd";
import { PageStack } from "@/components/Glass/index";
import { useAuth } from "@/hooks/useAuth";
import { useUpdateOwnProfile } from "@/hooks/useProfiles";
import { uploadAvatar } from "@/lib/storage";
import { PageWrap } from "./components/styles";
import { ProfileHeader } from "./components/ProfileHeader";
import type { ProfileFormValues } from "./types";

export function ProfilePage() {
  const { profile, userId, email } = useAuth();
  const { message } = App.useApp();
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

  const onAvatarUpload = useCallback(
    async (file: File) => {
      if (!userId) return;
      if (file.size > 3 * 1024 * 1024) {
        void message.error("Image must be smaller than 3 MB.");
        return;
      }
      setAvatarPreview(URL.createObjectURL(file));
      setUploadingAvatar(true);
      try {
        const url = await uploadAvatar(userId, file);
        await updateProfile.mutateAsync({ userId, avatarUrl: url });
        void message.success("Profile picture updated.");
      } catch (err) {
        setAvatarPreview(null);
        void message.error(err instanceof Error ? err.message : "Upload failed.");
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
      void message.success("Profile updated.");
      setEditing(false);
    } catch (err) {
      if (err instanceof Error) void message.error(err.message);
    }
  };

  if (!profile) return null;

  return (
    <PageWrap>
      <PageStack>
        <ProfileHeader
          profile={profile}
          email={email ?? undefined}
          editing={editing}
          uploadingAvatar={uploadingAvatar}
          avatarPreview={avatarPreview}
          avatarSize={120}
          isMobile={false}
          updateProfile={updateProfile}
          form={form}
          onEdit={() => setEditing(true)}
          onCancel={() => {
            setEditing(false);
            form.resetFields();
          }}
          onSave={handleSave}
          onAvatarUpload={onAvatarUpload}
        />
      </PageStack>
    </PageWrap>
  );
}
