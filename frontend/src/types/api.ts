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
  initialized: boolean;
}

export interface InitRequest {
  action: "init";
}

export interface InitResponse {
  ok: boolean;
}

export type ApiRequest =
  | PullRequest
  | PushRequest
  | InitRequest
  | { action: "ping" };
