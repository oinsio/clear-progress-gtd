import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { SyncStatus } from "@/types/common";
import { SYNC_INTERVAL_MS, PING_INTERVAL_MS } from "@/constants";
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
  pull: () => Promise<void>;
  push: () => Promise<void>;
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
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPingInterval = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  }, []);

  const pull = useCallback(async (): Promise<void> => {
    if (!navigator.onLine) {
      setSyncStatus("offline");
      return;
    }
    setSyncStatus("syncing");
    try {
      await syncService.pull();
      void defaultCoverSyncService.sync();
      setSyncStatus("idle");
      setSyncVersion((version) => version + 1);
      stopPingInterval();
    } catch {
      setSyncStatus("error");
    }
  }, [stopPingInterval]);

  const push = useCallback(async (): Promise<void> => {
    if (!navigator.onLine) {
      setSyncStatus("offline");
      return;
    }
    setSyncStatus("syncing");
    try {
      await syncService.push();
      setSyncStatus("idle");
      stopPingInterval();
    } catch {
      setSyncStatus("error");
    }
  }, [stopPingInterval]);

  const performPing = useCallback(async (): Promise<void> => {
    try {
      const pingResult = await apiClient.ping();
      stopPingInterval();
      if (!pingResult.initialized) {
        await apiClient.init();
      }
      await syncService.push();
      await syncService.pull();
      void defaultCoverSyncService.sync();
      setSyncStatus("idle");
    } catch {
      // Still unreachable — keep pinging
    }
  }, [stopPingInterval]);

  const startPingInterval = useCallback(() => {
    if (pingIntervalRef.current) return;
    pingIntervalRef.current = setInterval(() => void performPing(), PING_INTERVAL_MS);
  }, [performPing]);

  useEffect(() => {
    void defaultCoverSyncService.initializeLocalCovers();
    void defaultCoverSyncService.sync();
    void pull();
    intervalRef.current = setInterval(() => void pull(), SYNC_INTERVAL_MS);

    const handleOnline = () => {
      void performPing();
    };
    window.addEventListener("online", handleOnline);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      stopPingInterval();
      window.removeEventListener("online", handleOnline);
    };
  }, [pull, performPing, stopPingInterval]);

  useEffect(() => {
    if (syncStatus === "offline" || syncStatus === "error") {
      startPingInterval();
    }
  }, [syncStatus, startPingInterval]);

  return (
    <SyncContext.Provider value={{ syncStatus, syncVersion, pull, push }}>
      {children}
    </SyncContext.Provider>
  );
}

const SYNC_NOOP = async (): Promise<void> => {};

const SYNC_FALLBACK: SyncContextValue = {
  syncStatus: "idle",
  syncVersion: 0,
  pull: SYNC_NOOP,
  push: SYNC_NOOP,
};

export function useSync(): SyncContextValue {
  return useContext(SyncContext) ?? SYNC_FALLBACK;
}
