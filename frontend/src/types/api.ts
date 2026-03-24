import type {
  Task,
  Goal,
  Context,
  Category,
  ChecklistItem,
  Setting,
} from "./entities";
import type { PushResultStatus } from "./common";

export interface VersionMap {
  tasks: number;
  goals: number;
  contexts: number;
  categories: number;
  checklist_items: number;
}

export interface PullRequest {
  action: "pull";
  versions: VersionMap;
}

export interface PullResponse {
  ok: boolean;
  data: {
    tasks: Task[];
    goals: Goal[];
    contexts: Context[];
    categories: Category[];
    checklist_items: ChecklistItem[];
  };
  settings: Setting[];
  server_time: string;
}

export interface PushChanges {
  tasks?: Task[];
  goals?: Goal[];
  contexts?: Context[];
  categories?: Category[];
  checklist_items?: ChecklistItem[];
  settings?: Setting[];
}

export interface PushRequest {
  action: "push";
  changes: PushChanges;
}

export interface PushItemResult {
  id: string;
  status: PushResultStatus;
  version?: number;
  server_record?: Task | Goal | Context | Category | ChecklistItem;
  reason?: string;
}

export interface PushResponseData {
  tasks?: PushItemResult[];
  goals?: PushItemResult[];
  contexts?: PushItemResult[];
  categories?: PushItemResult[];
  checklist_items?: PushItemResult[];
  settings?: PushItemResult[];
}

export interface PushResponse {
  ok: boolean;
  results: PushResponseData;
  server_time: string;
}

export interface PingResponse {
  ok: boolean;
  app: string;
  version: string;
  initialized: boolean;
}

export interface InitResponse {
  ok: boolean;
}

export interface UploadCoverResponse {
  ok: boolean;
  file_id: string;
  reused: boolean;
}

export interface GetCoverResult {
  file_id: string;
  mime_type?: string;
  data?: string;
  error?: string;
}

export interface GetCoversResponse {
  ok: boolean;
  covers: GetCoverResult[];
}

export interface DeleteCoverResponse {
  ok: boolean;
  deleted: boolean;
  ref_count: number;
}
