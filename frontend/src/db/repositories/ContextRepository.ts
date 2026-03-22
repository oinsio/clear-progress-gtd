import type { Context } from "@/types/entities";
import { db } from "../database";

export class ContextRepository {
  async getAll(): Promise<Context[]> {
    return db.contexts.toArray();
  }

  async getActive(): Promise<Context[]> {
    return db.contexts.filter((context) => !context.is_deleted).toArray();
  }

  async getById(id: string): Promise<Context | undefined> {
    return db.contexts.get(id);
  }

  async create(context: Context): Promise<void> {
    await db.contexts.add(context);
  }

  async update(context: Context): Promise<void> {
    await db.contexts.put(context);
  }

  async bulkUpsert(contexts: Context[]): Promise<void> {
    await db.contexts.bulkPut(contexts);
  }

  async getChangedSince(since: string): Promise<Context[]> {
    return db.contexts.where("updated_at").above(since).toArray();
  }

  async getMaxVersion(): Promise<number> {
    const contexts = await db.contexts
      .orderBy("version")
      .reverse()
      .limit(1)
      .toArray();
    return contexts[0]?.version ?? 0;
  }
}
