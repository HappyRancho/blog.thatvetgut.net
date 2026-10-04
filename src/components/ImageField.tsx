import { useState } from "react";
import { useAuth } from "../lib/auth-context";
import { uploadImage } from "../lib/media";
import { MediaImage } from "./MediaImage";
import { safeUrl } from "../lib/domain";
export function ImageField({
  value,
  alt,
  ownerType,
  ownerId,
  onChange,
  onUploadStart,
}: {
  value: string;
  alt: string;
  ownerType: "article" | "author";
  ownerId: string;
  onChange: (url: string) => void;
  onUploadStart?: () => void;
}) {
  const { user } = useAuth(),
    [progress, setProgress] = useState(0),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <div className="image-field">
      <label>
        Image URL
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://… or /images/photo.webp"
        />
      </label>
      <label className="upload-control">
        Upload a photo
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={busy || !ownerId}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file || !user) return;
            setBusy(true);
            setError("");
            onUploadStart?.();
            try {
              onChange(
                await uploadImage(
                  file,
                  ownerType,
                  ownerId,
                  user.uid,
                  setProgress,
                ),
              );
            } catch (err) {
              setError(err instanceof Error ? err.message : "Upload failed.");
            } finally {
              setBusy(false);
              e.target.value = "";
            }
          }}
        />
      </label>
      <small>
        JPEG, PNG or WebP, up to 8 MB. Optimised for the free database; article
        images stay private until publication. Use photos you have permission to
        share.
      </small>
      {busy && (
        <div role="status">
          <progress value={progress} max={100} />{" "}
          {progress < 65 ? "Optimising image…" : "Saving image…"}
        </div>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {value && safeUrl(value, true) && (
        <MediaImage className="image-preview" src={value} alt={alt} />
      )}
    </div>
  );
}
