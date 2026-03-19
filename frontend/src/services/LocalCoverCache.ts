const urlCache = new Map<string, string>();

export const localCoverCache = {
  set(localId: string, url: string): void {
    urlCache.set(localId, url);
  },
  get(localId: string): string | undefined {
    return urlCache.get(localId);
  },
  transfer(fromId: string, toId: string): void {
    const url = urlCache.get(fromId);
    if (url) {
      urlCache.set(toId, url);
      urlCache.delete(fromId);
    }
  },
  clear(): void {
    for (const url of urlCache.values()) {
      URL.revokeObjectURL(url);
    }
    urlCache.clear();
  },
};
