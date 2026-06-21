'use client';

import { DndContext, DragOverlay } from '@dnd-kit/core';
import { WORK_ITEM_STATUSES } from '@/lib/constants/board';
import { groupByStatus } from '@/lib/utils/groupByStatus';
import { useDragBoard } from '@/lib/hooks/useDragBoard';
import KanbanColumn from './KanbanColumn';
import WorkItemCard from './WorkItemCard';
import type { WorkItem } from '@/lib/types';

interface KanbanBoardProps {
  items: WorkItem[];
  onStatusChange: (id: string, newStatus: string) => Promise<void>;
  onAddItem: (status: string) => void;
  onEditItem: (item: WorkItem) => void;
  onDeleteItem: (id: string) => void;
}

export default function KanbanBoard({
  items,
  onStatusChange,
  onAddItem,
  onEditItem,
  onDeleteItem,
}: KanbanBoardProps) {
  const { sensors, activeItem, handleDragStart, handleDragEnd } = useDragBoard({
    items,
    onStatusChange,
  });

  const grouped = groupByStatus(items);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="kanban-board">
        {WORK_ITEM_STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            items={grouped[status]}
            onAddItem={onAddItem}
            onEditItem={onEditItem}
            onDeleteItem={onDeleteItem}
          />
        ))}
      </div>

      {/* Ghost card rendered on top while dragging */}
      <DragOverlay>
        {activeItem && (
          <WorkItemCard item={activeItem} onEdit={() => {}} onDelete={() => {}} />
        )}
      </DragOverlay>
    </DndContext>
  );
}
