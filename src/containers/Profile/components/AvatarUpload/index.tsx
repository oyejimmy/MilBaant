import { useRef } from "react";
import { Avatar, Flex, Typography } from "antd";
import { CameraOutlined } from "@ant-design/icons";
import { useDropzone } from "react-dropzone";
import { AvatarWrap, AvatarOverlay, UploadingPulse, DragHint } from "../styles";
import { initials, avatarColor } from "../helpers";

interface AvatarUploadProps {
  avatarUrl: string | null;
  fullName: string;
  uploading: boolean;
  size: number;
  onUpload: (file: File) => Promise<void>;
}

export function AvatarUpload({
  avatarUrl,
  fullName,
  uploading,
  size,
  onUpload,
}: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) await onUpload(file);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
    maxFiles: 1,
    noClick: true,
  });

  const displayAvatar = avatarUrl ?? null;
  const hasAvatar = !!displayAvatar;

  return (
    <div {...getRootProps()}>
      <input {...getInputProps()} />
      <Flex vertical align="center">
        <AvatarWrap
          onClick={() => fileInputRef.current?.click()}
          title="Click or drag to change photo"
        >
          {uploading ? (
            <UploadingPulse>
              <Avatar
                size={size}
                src={displayAvatar}
                style={{
                  background: !hasAvatar ? avatarColor(fullName) : undefined,
                  border: "3px solid var(--card-bg)",
                  fontSize: size * 0.35,
                  fontWeight: 700,
                }}
              >
                {!hasAvatar && initials(fullName)}
              </Avatar>
            </UploadingPulse>
          ) : (
            <Avatar
              size={size}
              src={displayAvatar}
              style={{
                background: !hasAvatar ? avatarColor(fullName) : undefined,
                border: "3px solid var(--card-bg)",
                fontSize: size * 0.35,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {!hasAvatar && initials(fullName)}
            </Avatar>
          )}
          <AvatarOverlay>
            <CameraOutlined style={{ color: "#fff", fontSize: 18 }} />
          </AvatarOverlay>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onDrop([file]);
              e.target.value = "";
            }}
          />
        </AvatarWrap>
        {isDragActive && (
          <DragHint>
            <Typography.Text
              style={{ color: "var(--primary)", fontWeight: 600 }}
            >
              Drop image to update your profile picture
            </Typography.Text>
          </DragHint>
        )}
      </Flex>
    </div>
  );
}
