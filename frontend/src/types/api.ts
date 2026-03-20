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
    settings: Setting[];
  };
}

export interface PushChanges {
  tasks?: Task[];
  goals?: Goal[];
  contexts?: Context[];
  categories?: Category[];
  checklist_items?: ChecklistItem[];
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
}

export interface PushResponse {
  ok: boolean;
  data: PushResponseData;
}

export interface PingResponse {
  ok: boolean;
  app: string;
  version: string;
  initialized: boolean;
}

export interface InitRequest {
  action: "init";
}

export interface InitResponse {
  ok: boolean;
}

export interface UploadCoverRequest {
  action: "upload_cover";
  goal_id: string;
  filename: string;
  mime_type: string;
  data: string;
}

export interface UploadCoverResponse {
  ok: boolean;
  data: {
    file_id: string;
    thumbnail_url: string;
    reused: boolean;
  };
}

export interface DeleteCoverRequest {
  action: "delete_cover";
  file_id: string;
}

export interface DeleteCoverResponse {
  ok: boolean;
  data: {
    deleted: boolean;
    ref_count: number;
  };
}
