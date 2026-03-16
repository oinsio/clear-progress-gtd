import { useSensor, useSensors, PointerSensor, TouchSensor } from "@dnd-kit/core";

const DRAG_ACTIVATION_DISTANCE_PX = 8;
const TOUCH_ACTIVATION_DELAY_MS = 250;
const TOUCH_ACTIVATION_TOLERANCE_PX = 5;

export function useDndSensors() {
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: DRAG_ACTIVATION_DISTANCE_PX },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: TOUCH_ACTIVATION_DELAY_MS,
      tolerance: TOUCH_ACTIVATION_TOLERANCE_PX,
    },
  });
  return useSensors(pointerSensor, touchSensor);
}
