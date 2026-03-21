import { useState, useEffect, useCallback } from "react";
import type { Context } from "@/types/entities";
import { ContextService } from "@/services/ContextService";
import { ContextRepository } from "@/db/repositories/ContextRepository";
import { useSync } from "@/app/providers/SyncProvider";

const defaultContextService = new ContextService(new ContextRepository());

export interface UseContextsReturn {
  contexts: Context[];
  isLoading: boolean;
  createContext: (name: string) => Promise<void>;
  updateContext: (id: string, name: string) => Promise<void>;
  deleteContext: (id: string) => Promise<void>;
  reorderContexts: (orderedContexts: Context[]) => Promise<void>;
}

export function useContexts(
  contextService: ContextService = defaultContextService,
): UseContextsReturn {
  const [contexts, setContexts] = useState<Context[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { syncVersion, schedulePush } = useSync();

  const loadContexts = useCallback(async () => {
    const allContexts = await contextService.getAll();
    setContexts(allContexts);
    setIsLoading(false);
  }, [contextService]);

  useEffect(() => {
    void loadContexts();
  }, [loadContexts, syncVersion]);

  const createContext = useCallback(
    async (name: string) => {
      await contextService.create(name);
      await loadContexts();
      schedulePush();
    },
    [contextService, loadContexts, schedulePush],
  );

  const updateContext = useCallback(
    async (id: string, name: string) => {
      await contextService.update(id, name);
      await loadContexts();
      schedulePush();
    },
    [contextService, loadContexts, schedulePush],
  );

  const deleteContext = useCallback(
    async (id: string) => {
      await contextService.softDelete(id);
      await loadContexts();
      schedulePush();
    },
    [contextService, loadContexts, schedulePush],
  );

  const reorderContexts = useCallback(
    async (orderedContexts: Context[]) => {
      await contextService.reorderContexts(orderedContexts);
      await loadContexts();
      schedulePush();
    },
    [contextService, loadContexts, schedulePush],
  );

  return { contexts, isLoading, createContext, updateContext, deleteContext, reorderContexts };
}
