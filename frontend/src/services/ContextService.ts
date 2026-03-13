import type { Context } from "@/types/entities";
import { ContextRepository } from "@/db/repositories/ContextRepository";

export class ContextService {
  constructor(private readonly contextRepository: ContextRepository) {}

  async getAll(): Promise<Context[]> {
    const contexts = await this.contextRepository.getActive();
    return contexts.sort(
      (contextA, contextB) => contextA.sort_order - contextB.sort_order,
    );
  }

  async getById(id: string): Promise<Context | undefined> {
    return this.contextRepository.getById(id);
  }

  async create(name: string): Promise<Context> {
    const now = new Date().toISOString();
    const context: Context = {
      id: crypto.randomUUID(),
      name,
      sort_order: 0,
      is_deleted: false,
      created_at: now,
      updated_at: now,
      version: 1,
    };
    await this.contextRepository.create(context);
    return context;
  }

  async update(id: string, name: string): Promise<Context> {
    return this.applyChanges(id, { name });
  }

  async softDelete(id: string): Promise<Context> {
    return this.applyChanges(id, { is_deleted: true });
  }

  private async applyChanges(
    id: string,
    changes: Partial<Context>,
  ): Promise<Context> {
    const existingContext = await this.contextRepository.getById(id);
    if (!existingContext) {
      throw new Error(`Context not found: ${id}`);
    }
    const updatedContext: Context = {
      ...existingContext,
      ...changes,
      id,
      updated_at: new Date().toISOString(),
      version: existingContext.version + 1,
    };
    await this.contextRepository.update(updatedContext);
    return updatedContext;
  }
}
