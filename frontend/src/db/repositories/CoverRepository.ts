import type { CoverRecord } from "@/types/entities";
import { db } from "../database";

export class CoverRepository {
  async getByHash(dataHash: string): Promise<CoverRecord | undefined> {
    return db.covers.where("data_hash").equals(dataHash).first();
  }

  async getByFileId(fileId: string): Promise<CoverRecord | undefined> {
    return db.covers.get(fileId);
  }

  async save(record: CoverRecord): Promise<void> {
    await db.covers.put(record);
  }

  async delete(fileId: string): Promise<void> {
    await db.covers.delete(fileId);
  }
}
