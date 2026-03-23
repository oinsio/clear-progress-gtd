import { useState, useEffect } from "react";
import { getCoverDisplayUrl } from "@/services/CoverService";
import { localCoverCache } from "@/services/LocalCoverCache";
import { defaultCoverSyncService } from "@/services/defaultServices";
import { LOCAL_COVER_ID_PREFIX } from "@/constants";

export interface UseCoverUrlResult {
  url: string | null;
}

export function useCoverUrl(fileId: string): UseCoverUrlResult {
  const [url, setUrl] = useState<string | null>(() => getCoverDisplayUrl(fileId));

  useEffect(() => {
    if (!fileId || fileId.startsWith(LOCAL_COVER_ID_PREFIX)) return;

    const cached = localCoverCache.get(fileId);
    if (cached) {
      setUrl(cached);
      return;
    }

    void defaultCoverSyncService.ensureCoverCached(fileId).then(() => {
      setUrl(localCoverCache.get(fileId) ?? null);
    });
  }, [fileId]);

  return { url };
}
