import type { VersionMap } from "@/types/api";
import { ApiClient } from "./ApiClient";
import { TaskRepository } from "@/db/repositories/TaskRepository";
import { GoalRepository } from "@/db/repositories/GoalRepository";
import { ContextRepository } from "@/db/repositories/ContextRepository";
import { CategoryRepository } from "@/db/repositories/CategoryRepository";
import { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import { SettingsRepository } from "@/db/repositories/SettingsRepository";
import { PUSH_RESULT_STATUS } from "@/constants";

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

  async pull(): Promise<void> {
    const versions = await this.getLocalVersions();
    const pullResponse = await this.apiClient.pull({ versions });

    if (!pullResponse.ok) {
      throw new Error("Pull failed");
    }

    const { data } = pullResponse;
    await Promise.all([
      this.taskRepository.bulkUpsert(data.tasks),
      this.goalRepository.bulkUpsert(data.goals),
      this.contextRepository.bulkUpsert(data.contexts),
      this.categoryRepository.bulkUpsert(data.categories),
      this.checklistRepository.bulkUpsert(data.checklist_items),
      this.settingsRepository.bulkUpsert(data.settings),
    ]);
  }

  async push(): Promise<void> {
    const [tasks, goals, contexts, categories, checklist_items] =
      await Promise.all([
        this.taskRepository.getAll(),
        this.goalRepository.getAll(),
        this.contextRepository.getAll(),
        this.categoryRepository.getAll(),
        this.checklistRepository.getAll(),
      ]);

    const pushResponse = await this.apiClient.push({
      changes: { tasks, goals, contexts, categories, checklist_items },
    });

    if (!pushResponse.ok) {
      throw new Error("Push failed");
    }

    await this.resolveConflicts(pushResponse.data);
  }

  private async resolveConflicts(
    responseData: Awaited<ReturnType<ApiClient["push"]>>["data"],
  ): Promise<void> {
    const conflictedTasks =
      responseData.tasks?.filter(
        (result) => result.status === PUSH_RESULT_STATUS.CONFLICT,
      ) ?? [];

    for (const conflictResult of conflictedTasks) {
      if (conflictResult.server_record) {
        await this.taskRepository.update(
          conflictResult.server_record as Parameters<
            TaskRepository["update"]
          >[0],
        );
      }
    }
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
