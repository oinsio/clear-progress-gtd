import React from "react";
import { Trash2, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { RightFilterPanel } from "@/components/tasks/RightFilterPanel";
import { useDeletedEntities } from "@/hooks/useDeletedEntities";
import { useSectionCollapse } from "@/hooks/useSectionCollapse";
import { usePanelSide } from "@/hooks/usePanelSide";
import { usePanelOpen } from "@/hooks/usePanelOpen";
import { useRightPanelNavigation } from "@/hooks/useRightPanelNavigation";
import { cn } from "@/shared/lib/cn";

const SECTION_KEY_TASKS = "deleted-tasks";
const SECTION_KEY_GOALS = "deleted-goals";
const SECTION_KEY_CONTEXTS = "deleted-contexts";
const SECTION_KEY_CATEGORIES = "deleted-categories";
const SECTION_KEY_CHECKLISTS = "deleted-checklists";

interface CollapsibleSectionProps {
  sectionKey: string;
  title: string;
  count: number;
  children: React.ReactNode;
}

function CollapsibleSection({ sectionKey, title, count, children }: CollapsibleSectionProps) {
  const { isCollapsed, toggleCollapse } = useSectionCollapse(sectionKey);

  return (
    <section>
      <button
        type="button"
        onClick={toggleCollapse}
        aria-expanded={!isCollapsed}
        className="w-full flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-white sticky top-0 z-10 hover:bg-gray-50 transition-colors"
      >
        <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide">
          {title}
          {count > 0 && (
            <span className="ml-2 text-gray-300">({count})</span>
          )}
        </h2>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-gray-300 transition-transform duration-200",
            isCollapsed && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>
      {!isCollapsed && children}
    </section>
  );
}

interface DeletedSectionProps<T extends { id: string }> {
  sectionKey: string;
  title: string;
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}

function DeletedSection<T extends { id: string }>({
  sectionKey,
  title,
  items,
  renderItem,
}: DeletedSectionProps<T>) {
  const { t } = useTranslation();

  return (
    <CollapsibleSection sectionKey={sectionKey} title={title} count={items.length}>
      {items.length === 0 ? (
        <p className="px-4 py-3 text-sm text-gray-300">{t("deleted.sectionEmpty")}</p>
      ) : (
        <ul>
          {items.map((item) => (
            <li key={item.id} className="px-4 py-3 border-b border-gray-50 last:border-0">
              {renderItem(item)}
            </li>
          ))}
        </ul>
      )}
    </CollapsibleSection>
  );
}

export default function DeletedPage() {
  const { t } = useTranslation();
  const { panelSide } = usePanelSide();
  const { isPanelOpen, togglePanelOpen } = usePanelOpen();
  const {
    tasks,
    goals,
    contexts,
    categories,
    checklistItems,
    taskTitleMap,
    isLoading,
  } = useDeletedEntities();
  const handleModeChange = useRightPanelNavigation();

  const isEmpty =
    tasks.length === 0 &&
    goals.length === 0 &&
    contexts.length === 0 &&
    categories.length === 0 &&
    checklistItems.length === 0;

  return (
    <div data-testid="deleted-page" className="relative flex flex-1 overflow-hidden bg-white">
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 bg-white">
          <Trash2 size={16} className="text-gray-400 flex-shrink-0" aria-hidden="true" />
          <h1 className="text-sm font-medium text-gray-600">{t("deleted.pageTitle")}</h1>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="xl:max-w-3xl xl:mx-auto">
            {isLoading && (
              <p className="text-sm text-gray-400 text-center py-16">{t("deleted.loading")}</p>
            )}

            {!isLoading && isEmpty && (
              <p className="text-sm text-gray-400 text-center py-16">{t("deleted.empty")}</p>
            )}

            {!isLoading && !isEmpty && (
              <>
                <DeletedSection
                  sectionKey={SECTION_KEY_TASKS}
                  title={t("deleted.tasks")}
                  items={tasks}
                  renderItem={(task) => (
                    <span className="text-sm text-gray-400 line-through">{task.title}</span>
                  )}
                />

                <DeletedSection
                  sectionKey={SECTION_KEY_GOALS}
                  title={t("deleted.goals")}
                  items={goals}
                  renderItem={(goal) => (
                    <span className="text-sm text-gray-400 line-through">{goal.title}</span>
                  )}
                />

                <DeletedSection
                  sectionKey={SECTION_KEY_CONTEXTS}
                  title={t("deleted.contexts")}
                  items={contexts}
                  renderItem={(context) => (
                    <span className="text-sm text-gray-400 line-through">{context.name}</span>
                  )}
                />

                <DeletedSection
                  sectionKey={SECTION_KEY_CATEGORIES}
                  title={t("deleted.categories")}
                  items={categories}
                  renderItem={(category) => (
                    <span className="text-sm text-gray-400 line-through">{category.name}</span>
                  )}
                />

                <DeletedSection
                  sectionKey={SECTION_KEY_CHECKLISTS}
                  title={t("deleted.checklists")}
                  items={checklistItems}
                  renderItem={(item) => {
                    const parentTaskTitle = taskTitleMap.get(item.task_id);
                    return (
                      <>
                        <span className="text-sm text-gray-400 line-through">{item.title}</span>
                        {parentTaskTitle !== undefined && (
                          <p className="text-xs text-gray-300 mt-0.5">
                            {t("deleted.checklistParent", { task: parentTaskTitle })}
                          </p>
                        )}
                      </>
                    );
                  }}
                />
              </>
            )}
          </div>
        </main>
      </div>

      <RightFilterPanel
        mode={null}
        isOpen={isPanelOpen}
        side={panelSide}
        onToggle={togglePanelOpen}
        onModeChange={handleModeChange}
      />
    </div>
  );
}
