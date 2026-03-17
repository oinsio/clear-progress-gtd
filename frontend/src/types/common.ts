export type Box = "inbox" | "today" | "week" | "later";

export type GoalStatus =
  | "planning"
  | "in_progress"
  | "paused"
  | "completed"
  | "cancelled";

export type AccentColor =
  | "coral"
  | "orange"
  | "yellow"
  | "green"
  | "teal"
  | "blue"
  | "indigo"
  | "purple";

export type SyncStatus = "idle" | "syncing" | "error" | "offline";

export type PushResultStatus = "created" | "accepted" | "conflict" | "rejected";

export type BoxFilter = Box | "all";

export type RepeatRuleType =
  | "daily"
  | "weekdays"
  | "weekly"
  | "monthly"
  | "interval";

export type PanelSide = "left" | "right";

export interface RepeatRule {
  type: RepeatRuleType;
  days?: number[];
  interval?: number;
}
