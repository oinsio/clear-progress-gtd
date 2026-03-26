import { GripVertical } from "lucide-react";
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTranslation } from "react-i18next";
import { cn } from "@/shared/lib/cn";
import { useDndSensors } from "@/hooks/useDndSensors";
import { useMenuOrder } from "@/hooks/useMenuOrder";
import { FILTER_ITEMS } from "@/components/tasks/RightFilterPanel";
import type { MenuItemConfig, MenuMode } from "@/types/common";

interface SortableMenuOrderItemProps {
  config: MenuItemConfig;
  onToggle: () => void;
}

function SortableMenuOrderItem({ config, onToggle }: SortableMenuOrderItemProps) {
  const { t } = useTranslation();
  const filterItem = FILTER_ITEMS.find((item) => item.mode === config.mode)!;

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: config.mode });

  const dragStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={dragStyle}
      className={cn("flex items-center gap-2 px-3 py-2", isDragging && "opacity-50")}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label={t("settings.menuOrderDragHandle", { label: t(filterItem.labelKey) })}
        className="text-gray-300 hover:text-gray-500 transition-colors cursor-grab active:cursor-grabbing flex-shrink-0"
      >
        <GripVertical size={18} />
      </button>

      <filterItem.Icon
        className={cn("w-5 h-5 flex-shrink-0", config.visible ? "text-gray-400" : "text-gray-300")}
        aria-hidden="true"
      />

      <span className={cn("flex-1 text-sm", config.visible ? "text-gray-800" : "text-gray-400")}>
        {t(filterItem.labelKey)}
      </span>

      <button
        type="button"
        role="switch"
        aria-checked={config.visible}
        aria-label={t("settings.menuOrderToggle", { label: t(filterItem.labelKey) })}
        onClick={onToggle}
        className={cn(
          "relative inline-flex w-9 h-5 rounded-full transition-colors duration-200 flex-shrink-0",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
          config.visible ? "bg-accent" : "bg-gray-200",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200",
            config.visible && "translate-x-[16px]",
          )}
        />
      </button>
    </div>
  );
}

export function MenuOrderSection() {
  const { t } = useTranslation();
  const { menuOrder, setMenuOrder } = useMenuOrder();
  const sensors = useDndSensors();

  const handleDragEnd = (event: DragEndEvent): void => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setMenuOrder((prev) => {
      const oldIndex = prev.findIndex((item) => item.mode === active.id);
      const newIndex = prev.findIndex((item) => item.mode === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const handleToggle = (modeToToggle: MenuMode): void => {
    setMenuOrder((prev) =>
      prev.map((item) =>
        item.mode === modeToToggle ? { ...item, visible: !item.visible } : item,
      ),
    );
  };

  return (
    <section data-testid="settings-menu-order" className="space-y-3">
      <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
        {t("settings.menuOrder")}
      </h2>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={menuOrder.map((item) => item.mode)}
          strategy={verticalListSortingStrategy}
        >
          <div className="rounded-lg border border-gray-200 divide-y divide-gray-100">
            {menuOrder.map((config) => (
              <SortableMenuOrderItem
                key={config.mode}
                config={config}
                onToggle={() => handleToggle(config.mode)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <p className="text-xs text-gray-400">{t("settings.menuOrderHint")}</p>
    </section>
  );
}
