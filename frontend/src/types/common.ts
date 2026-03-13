export type Box = "inbox" | "today" | "week" | "later";

export type GoalStatus =
  | "not_started"
  | "in_progress"
  | "paused"
  | "completed"
  | "cancelled";

export type AccentColor = "green" | "orange" | "purple" | "yellow" | "crimson";

export type SyncStatus = "idle" | "syncing" | "error" | "offline";

export type PushResultStatus = "created" | "accepted" | "conflict" | "rejected";

export type RepeatRuleType =
  | "daily"
  | "weekdays"
  | "weekly"
  | "monthly"
  | "interval";

export interface RepeatRule {
  type: RepeatRuleType;
  days?: number[];
  interval?: number;
}
