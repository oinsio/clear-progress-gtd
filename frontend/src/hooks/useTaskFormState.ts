import { useState } from "react";
import type { Task } from "@/types/entities";
import type { Box, RepeatRule } from "@/types/common";
import { parseRepeatRule } from "@/utils/repeatRule";

export function useTaskFormState(task: Task) {
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes);
  const [selectedGoalId, setSelectedGoalId] = useState(task.goal_id);
  const [selectedContextId, setSelectedContextId] = useState(task.context_id);
  const [selectedCategoryId, setSelectedCategoryId] = useState(task.category_id);
  const [selectedBox, setSelectedBox] = useState<Box>(task.box);
  const [selectedRepeatRule, setSelectedRepeatRule] = useState<RepeatRule | null>(() =>
    parseRepeatRule(task.repeat_rule),
  );

  return {
    title,
    setTitle,
    notes,
    setNotes,
    selectedGoalId,
    setSelectedGoalId,
    selectedContextId,
    setSelectedContextId,
    selectedCategoryId,
    setSelectedCategoryId,
    selectedBox,
    setSelectedBox,
    selectedRepeatRule,
    setSelectedRepeatRule,
  };
}
