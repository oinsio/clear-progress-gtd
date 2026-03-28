import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { SyncStatus, FullSyncStep } from "@/types/common";
import type { VersionMap } from "@/types/api";
import { SYNC_INTERVAL_MS, PING_INTERVAL_MS, SYNC_DEBOUNCE_MS, STORAGE_KEYS, MAX_SILENT_REFRESH_ATTEMPTS } from "@/constants";
import { SyncService } from "@/services/SyncService";
import { ApiClient } from "@/services/ApiClient";
import { useAuth } from "@/app/providers/AuthProvider";
import { API_AUTH_ERROR_NAME } from "@/constants";
import { TaskRepository } from "@/db/repositories/TaskRepository";
import { GoalRepository } from "@/db/repositories/GoalRepository";
import { ContextRepository } from "@/db/repositories/ContextRepository";
import { CategoryRepository } from "@/db/repositories/CategoryRepository";
import { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import { SettingsRepository } from "@/db/repositories/SettingsRepository";
import { defaultCoverSyncService } from "@/services/defaultServices";

const FULL_SYNC_ZERO_VERSIONS: VersionMap = {
  tasks: 0,
  goals: 0,
  contexts: 0,
  categories: 0,
  checklist_items: 0,
};

interface SyncContextValue {
  syncStatus: SyncStatus;
  syncVersion: number;
  lastSyncedAt: string | null;
  pull: () => Promise<void>;
  push: () => Promise<void>;
  schedulePush: () => void;
  triggerFullSync: (onProgress: (step: FullSyncStep) => void) => Promise<void>;
}

const SyncContext = createContext<SyncContextValue | null>(null);

const apiClient = new ApiClient();

const syncService = new SyncService(
  apiClient,
  new TaskRepository(),
  new GoalRepository(),
  new ContextRepository(),
  new CategoryRepository(),
  new ChecklistRepository(),
  new SettingsRepository(),
);

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { accessToken, signOut, silentRefresh } = useAuth();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [syncVersion, setSyncVersion] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEYS.LAST_SYNC),
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSyncedAtRef = useRef<string | null>(lastSyncedAt);
  const silentRefreshAttemptsRef = useRef(0);

  useEffect(() => {
    lastSyncedAtRef.current = lastSyncedAt;
  }, [lastSyncedAt]);

  const stopPingInterval = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  }, []);

  const applySyncResult = useCallback(async (): Promise<void> => {
    const syncTimestamp = new Date().toISOString();
    await syncService.push(lastSyncedAtRef.current);
    await syncService.pull();
    void defaultCoverSyncService.sync();
    setSyncStatus("idle");
    setSyncVersion((version) => version + 1);
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, syncTimestamp);
    setLastSyncedAt(syncTimestamp);
  }, []);

  const sync = useCallback(async (): Promise<void> => {
    if (!accessToken) return;
    if (!navigator.onLine) {
      setSyncStatus("offline");
      return;
    }
    setSyncStatus("syncing");
    try {
      await applySyncResult();
      silentRefreshAttemptsRef.current = 0;
      stopPingInterval();
    } catch (error) {
      if (error instanceof Error && error.name === API_AUTH_ERROR_NAME) {
        silentRefreshAttemptsRef.current += 1;
        if (silentRefreshAttemptsRef.current >= MAX_SILENT_REFRESH_ATTEMPTS) {
          silentRefreshAttemptsRef.current = 0;
          setSyncStatus("unauthorized");
          signOut();
          return;
        }
        setSyncStatus("unauthorized");
        silentRefresh();
        return;
      }
      setSyncStatus("error");
    }
  }, [accessToken, applySyncResult, stopPingInterval, signOut, silentRefresh]);

  const schedulePush = useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => void sync(), SYNC_DEBOUNCE_MS);
  }, [sync]);

  const triggerFullSync = useCallback(async (onProgress: (step: FullSyncStep) => void): Promise<void> => {
    if (!navigator.onLine) {
      setSyncStatus("offline");
      onProgress("error");
      return;
    }
    setSyncStatus("syncing");
    try {
      onProgress("upload_covers");
      await defaultCoverSyncService.sync();
      await defaultCoverSyncService.reuploadLocalCovers();
      onProgress("push");
      await syncService.push(null);
      onProgress("pull");
      await syncService.pull(FULL_SYNC_ZERO_VERSIONS);
      onProgress("download_covers");
      await defaultCoverSyncService.ensureServerCoversAreCached();
      const syncTimestamp = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, syncTimestamp);
      setLastSyncedAt(syncTimestamp);
      setSyncVersion((version) => version + 1);
      setSyncStatus("idle");
      stopPingInterval();
      onProgress("done");
    } catch {
      setSyncStatus("error");
      onProgress("error");
    }
  }, [stopPingInterval]);

  const performPing = useCallback(async (): Promise<void> => {
    if (!accessToken) return;
    try {
      const pingResult = await apiClient.ping();
      stopPingInterval();
      if (!pingResult.initialized) {
        await apiClient.init();
      }
      await applySyncResult();
    } catch {
      // Still unreachable — keep pinging
    }
  }, [accessToken, applySyncResult, stopPingInterval]);

  const startPingInterval = useCallback(() => {
    if (pingIntervalRef.current) return;
    pingIntervalRef.current = setInterval(() => void performPing(), PING_INTERVAL_MS);
  }, [performPing]);

  useEffect(() => {
    if (!accessToken) return;

    void defaultCoverSyncService.initializeLocalCovers();
    void defaultCoverSyncService.sync();
    void sync();
    intervalRef.current = setInterval(() => void sync(), SYNC_INTERVAL_MS);

    const handleOnline = () => {
      void performPing();
    };
    window.addEventListener("online", handleOnline);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      stopPingInterval();
      window.removeEventListener("online", handleOnline);
    };
  }, [accessToken, sync, performPing, stopPingInterval]);

  useEffect(() => {
    if (syncStatus === "offline" || syncStatus === "error") {
      startPingInterval();
    }
  }, [syncStatus, startPingInterval]);

  return (
    <SyncContext.Provider value={{ syncStatus, syncVersion, lastSyncedAt, pull: sync, push: sync, schedulePush, triggerFullSync }}>
      {children}
    </SyncContext.Provider>
  );
}

const SYNC_NOOP = async (): Promise<void> => {};

const SYNC_FALLBACK: SyncContextValue = {
  syncStatus: "idle",
  syncVersion: 0,
  lastSyncedAt: null,
  pull: SYNC_NOOP,
  push: SYNC_NOOP,
  schedulePush: () => {},
  triggerFullSync: SYNC_NOOP as (onProgress: (step: FullSyncStep) => void) => Promise<void>,
};

export function useSync(): SyncContextValue {
  return useContext(SyncContext) ?? SYNC_FALLBACK;
}
