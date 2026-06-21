'use client';

import { useRef } from 'react';
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
  onViewItem: (item: WorkItem) => void;
  onEditItem: (item: WorkItem) => void;
  onDeleteItem: (id: string) => void;
}

export default function KanbanBoard({
  items,
  onStatusChange,
  onAddItem,
  onViewItem,
  onEditItem,
  onDeleteItem,
}: KanbanBoardProps) {
  const { sensors, activeItem, handleDragStart, handleDragEnd } = useDragBoard({
    items,
    onStatusChange,
  });

  const grouped = groupByStatus(items);
  const lastDragEnd = useRef(0);

  function finishDrag(event: Parameters<typeof handleDragEnd>[0]) {
    lastDragEnd.current = Date.now();
    void handleDragEnd(event);
  }

  function viewItem(item: WorkItem) {
    if (Date.now() - lastDragEnd.current < 200) return;
    onViewItem(item);
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={finishDrag}
    >
      <div className="kanban-board">
        {WORK_ITEM_STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            items={grouped[status]}
            onAddItem={onAddItem}
            onViewItem={viewItem}
            onEditItem={onEditItem}
            onDeleteItem={onDeleteItem}
          />
        ))}
      </div>

      {/* Ghost card rendered on top while dragging */}
      <DragOverlay>
        {activeItem && (
          <WorkItemCard item={activeItem} onView={() => {}} onEdit={() => {}} onDelete={() => {}} />
        )}
      </DragOverlay>
    </DndContext>
  );
}
