import type { PendingCoverRecord } from "@/types/entities";
import { db } from "../database";

export class PendingCoverRepository {
  async getAll(): Promise<PendingCoverRecord[]> {
    return db.pending_covers.toArray();
  }

  async getById(localId: string): Promise<PendingCoverRecord | undefined> {
    return db.pending_covers.get(localId);
  }

  async getByHash(dataHash: string): Promise<PendingCoverRecord | undefined> {
    return db.pending_covers.where("data_hash").equals(dataHash).first();
  }

  async save(record: PendingCoverRecord): Promise<void> {
    await db.pending_covers.put(record);
  }

  async delete(localId: string): Promise<void> {
    await db.pending_covers.delete(localId);
  }
}
