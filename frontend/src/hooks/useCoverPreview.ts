import { useState, useEffect, useRef } from "react";

interface UseCoverPreviewParams {
  pendingCoverFile: File | null;
  isCoverRemoved: boolean;
  existingCoverUrl: string | null | undefined;
}

export function useCoverPreview({
  pendingCoverFile,
  isCoverRemoved,
  existingCoverUrl,
}: UseCoverPreviewParams): string | null {
  const [coverPreviewSrc, setCoverPreviewSrc] = useState<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    if (pendingCoverFile) {
      const url = URL.createObjectURL(pendingCoverFile);
      objectUrlRef.current = url;
      setCoverPreviewSrc(url);
    } else if (isCoverRemoved) {
      setCoverPreviewSrc(null);
    } else {
      setCoverPreviewSrc(existingCoverUrl ?? null);
    }
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [pendingCoverFile, isCoverRemoved, existingCoverUrl]);

  return coverPreviewSrc;
}
