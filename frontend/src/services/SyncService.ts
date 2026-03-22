import type { VersionMap } from "@/types/api";
import type { Goal, Context, Category, ChecklistItem } from "@/types/entities";
import { ApiClient } from "./ApiClient";
import { TaskRepository } from "@/db/repositories/TaskRepository";
import { GoalRepository } from "@/db/repositories/GoalRepository";
import { ContextRepository } from "@/db/repositories/ContextRepository";
import { CategoryRepository } from "@/db/repositories/CategoryRepository";
import { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import { SettingsRepository } from "@/db/repositories/SettingsRepository";
import { PUSH_RESULT_STATUS, LOCAL_COVER_ID_PREFIX } from "@/constants";

export class SyncService {
  constructor(
    private readonly apiClient: ApiClient,
    private readonly taskRepository: TaskRepository,
    private readonly goalRepository: GoalRepository,
    private readonly contextRepository: ContextRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly checklistRepository: ChecklistRepository,
    private readonly settingsRepository: SettingsRepository,
  ) {}

  async pull(versionsOverride?: VersionMap): Promise<void> {
    const versions = versionsOverride ?? await this.getLocalVersions();
    const pullResponse = await this.apiClient.pull({ versions });

    if (!pullResponse.ok) {
      throw new Error("Pull failed");
    }

    const { data, settings } = pullResponse;
    await Promise.all([
      this.taskRepository.bulkUpsert(data.tasks),
      this.goalRepository.bulkUpsert(data.goals),
      this.contextRepository.bulkUpsert(data.contexts),
      this.categoryRepository.bulkUpsert(data.categories),
      this.checklistRepository.bulkUpsert(data.checklist_items),
      this.settingsRepository.bulkUpsert(settings),
    ]);
  }

  async push(since: string | null): Promise<void> {
    const [tasks, goals, contexts, categories, checklist_items, settings] =
      since === null
        ? await Promise.all([
            this.taskRepository.getAll(),
            this.goalRepository.getAll(),
            this.contextRepository.getAll(),
            this.categoryRepository.getAll(),
            this.checklistRepository.getAll(),
            this.settingsRepository.getAll(),
          ])
        : await Promise.all([
            this.taskRepository.getChangedSince(since),
            this.goalRepository.getChangedSince(since),
            this.contextRepository.getChangedSince(since),
            this.categoryRepository.getChangedSince(since),
            this.checklistRepository.getChangedSince(since),
            this.settingsRepository.getChangedSince(since),
          ]);

    const goalsForPush = goals.map((goal) =>
      goal.cover_file_id.startsWith(LOCAL_COVER_ID_PREFIX)
        ? { ...goal, cover_file_id: "" }
        : goal,
    );

    const pushResponse = await this.apiClient.push({
      changes: { tasks, goals: goalsForPush, contexts, categories, checklist_items, settings },
    });

    if (!pushResponse.ok) {
      throw new Error("Push failed");
    }

    await this.resolveConflicts(pushResponse.results);
  }

  private async resolveConflicts(
    responseData: Awaited<ReturnType<ApiClient["push"]>>["results"],
  ): Promise<void> {
    const conflictedWithRecord = (results: typeof responseData.tasks) =>
      results?.filter((r) => r.status === PUSH_RESULT_STATUS.CONFLICT && r.server_record) ?? [];

    await Promise.all([
      ...conflictedWithRecord(responseData.tasks).map((r) =>
        this.taskRepository.update(
          r.server_record as Parameters<TaskRepository["update"]>[0],
        ),
      ),
      ...conflictedWithRecord(responseData.goals).map((r) =>
        this.goalRepository.update(r.server_record as Goal),
      ),
      ...conflictedWithRecord(responseData.contexts).map((r) =>
        this.contextRepository.update(r.server_record as Context),
      ),
      ...conflictedWithRecord(responseData.categories).map((r) =>
        this.categoryRepository.update(r.server_record as Category),
      ),
      ...conflictedWithRecord(responseData.checklist_items).map((r) =>
        this.checklistRepository.update(r.server_record as ChecklistItem),
      ),
    ]);
  }

  private async getLocalVersions(): Promise<VersionMap> {
    const [tasks, goals, contexts, categories, checklist_items] =
      await Promise.all([
        this.taskRepository.getMaxVersion(),
        this.goalRepository.getMaxVersion(),
        this.contextRepository.getMaxVersion(),
        this.categoryRepository.getMaxVersion(),
        this.checklistRepository.getMaxVersion(),
      ]);

    return { tasks, goals, contexts, categories, checklist_items };
  }
}
