import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { SyncStatus } from "@/types/common";
import { SYNC_INTERVAL_MS } from "@/constants";
import { SyncService } from "@/services/SyncService";
import { ApiClient } from "@/services/ApiClient";
import { TaskRepository } from "@/db/repositories/TaskRepository";
import { GoalRepository } from "@/db/repositories/GoalRepository";
import { ContextRepository } from "@/db/repositories/ContextRepository";
import { CategoryRepository } from "@/db/repositories/CategoryRepository";
import { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import { SettingsRepository } from "@/db/repositories/SettingsRepository";

interface SyncContextValue {
  syncStatus: SyncStatus;
  pull: () => Promise<void>;
  push: () => Promise<void>;
}

const SyncContext = createContext<SyncContextValue | null>(null);

const syncService = new SyncService(
  new ApiClient(),
  new TaskRepository(),
  new GoalRepository(),
  new ContextRepository(),
  new CategoryRepository(),
  new ChecklistRepository(),
  new SettingsRepository(),
);

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pull = useCallback(async (): Promise<void> => {
    if (!navigator.onLine) {
      setSyncStatus("offline");
      return;
    }
    setSyncStatus("syncing");
    try {
      await syncService.pull();
      setSyncStatus("idle");
    } catch {
      setSyncStatus("error");
    }
  }, []);

  const push = useCallback(async (): Promise<void> => {
    if (!navigator.onLine) {
      setSyncStatus("offline");
      return;
    }
    setSyncStatus("syncing");
    try {
      await syncService.push();
      setSyncStatus("idle");
    } catch {
      setSyncStatus("error");
    }
  }, []);

  useEffect(() => {
    void pull();
    intervalRef.current = setInterval(() => void pull(), SYNC_INTERVAL_MS);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [pull]);

  return (
    <SyncContext.Provider value={{ syncStatus, pull, push }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync(): SyncContextValue {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error("useSync must be used within SyncProvider");
  }
  return context;
}
