import { useState, useEffect, useCallback } from "react";
import type { Context } from "@/types/entities";
import { ContextService } from "@/services/ContextService";
import { ContextRepository } from "@/db/repositories/ContextRepository";

const defaultContextService = new ContextService(new ContextRepository());

export interface UseContextsReturn {
  contexts: Context[];
  isLoading: boolean;
  createContext: (name: string) => Promise<void>;
  updateContext: (id: string, name: string) => Promise<void>;
  deleteContext: (id: string) => Promise<void>;
}

export function useContexts(
  contextService: ContextService = defaultContextService,
): UseContextsReturn {
  const [contexts, setContexts] = useState<Context[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadContexts = useCallback(async () => {
    const allContexts = await contextService.getAll();
    setContexts(allContexts);
    setIsLoading(false);
  }, [contextService]);

  useEffect(() => {
    void loadContexts();
  }, [loadContexts]);

  const createContext = useCallback(
    async (name: string) => {
      await contextService.create(name);
      await loadContexts();
    },
    [contextService, loadContexts],
  );

  const updateContext = useCallback(
    async (id: string, name: string) => {
      await contextService.update(id, name);
      await loadContexts();
    },
    [contextService, loadContexts],
  );

  const deleteContext = useCallback(
    async (id: string) => {
      await contextService.softDelete(id);
      await loadContexts();
    },
    [contextService, loadContexts],
  );

  return { contexts, isLoading, createContext, updateContext, deleteContext };
}
