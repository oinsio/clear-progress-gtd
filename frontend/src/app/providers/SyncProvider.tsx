import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { SyncStatus } from "@/types/common";
import { SYNC_INTERVAL_MS, PING_INTERVAL_MS, SYNC_DEBOUNCE_MS, STORAGE_KEYS } from "@/constants";
import { SyncService } from "@/services/SyncService";
import { ApiClient } from "@/services/ApiClient";
import { TaskRepository } from "@/db/repositories/TaskRepository";
import { GoalRepository } from "@/db/repositories/GoalRepository";
import { ContextRepository } from "@/db/repositories/ContextRepository";
import { CategoryRepository } from "@/db/repositories/CategoryRepository";
import { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import { SettingsRepository } from "@/db/repositories/SettingsRepository";
import { defaultCoverSyncService } from "@/services/defaultServices";

interface SyncContextValue {
  syncStatus: SyncStatus;
  syncVersion: number;
  lastSyncedAt: string | null;
  pull: () => Promise<void>;
  push: () => Promise<void>;
  schedulePush: () => void;
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
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [syncVersion, setSyncVersion] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEYS.LAST_SYNC),
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopPingInterval = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  }, []);

  const applySyncResult = useCallback(async (): Promise<void> => {
    const syncTimestamp = new Date().toISOString();
    await syncService.push();
    await syncService.pull();
    void defaultCoverSyncService.sync();
    setSyncStatus("idle");
    setSyncVersion((version) => version + 1);
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, syncTimestamp);
    setLastSyncedAt(syncTimestamp);
  }, []);

  const sync = useCallback(async (): Promise<void> => {
    if (!navigator.onLine) {
      setSyncStatus("offline");
      return;
    }
    setSyncStatus("syncing");
    try {
      await applySyncResult();
      stopPingInterval();
    } catch {
      setSyncStatus("error");
    }
  }, [applySyncResult, stopPingInterval]);

  const schedulePush = useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => void sync(), SYNC_DEBOUNCE_MS);
  }, [sync]);

  const performPing = useCallback(async (): Promise<void> => {
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
  }, [applySyncResult, stopPingInterval]);

  const startPingInterval = useCallback(() => {
    if (pingIntervalRef.current) return;
    pingIntervalRef.current = setInterval(() => void performPing(), PING_INTERVAL_MS);
  }, [performPing]);

  useEffect(() => {
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
  }, [sync, performPing, stopPingInterval]);

  useEffect(() => {
    if (syncStatus === "offline" || syncStatus === "error") {
      startPingInterval();
    }
  }, [syncStatus, startPingInterval]);

  return (
    <SyncContext.Provider value={{ syncStatus, syncVersion, lastSyncedAt, pull: sync, push: sync, schedulePush }}>
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
};

export function useSync(): SyncContextValue {
  return useContext(SyncContext) ?? SYNC_FALLBACK;
}
