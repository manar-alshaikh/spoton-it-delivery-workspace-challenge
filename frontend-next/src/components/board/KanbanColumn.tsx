'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { COLUMN_COLORS, COLUMN_LABELS } from '@/lib/constants/board';
import WorkItemCard from './WorkItemCard';
import type { WorkItem } from '@/lib/types';

interface KanbanColumnProps {
  status: string;
  items: WorkItem[];
  onAddItem: (status: string) => void;
  onViewItem: (item: WorkItem) => void;
  onEditItem: (item: WorkItem) => void;
  onDeleteItem: (id: string) => void;
}

export default function KanbanColumn({
  status,
  items,
  onAddItem,
  onViewItem,
  onEditItem,
  onDeleteItem,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: { type: 'column', status },
  });
  const accentColor = COLUMN_COLORS[status as keyof typeof COLUMN_COLORS] ?? '#94a3b8';
  const label = COLUMN_LABELS[status as keyof typeof COLUMN_LABELS] ?? status;

  return (
    <div className={`kanban-column${isOver ? ' kanban-column--over' : ''}`}>
      <div className="kanban-column__accent" style={{ background: accentColor }} />

      <div className="kanban-column__header">
        <span className="kanban-column__name">{label}</span>
        <span className="kanban-column__count">{items.length}</span>
      </div>

      <div ref={setNodeRef} className="kanban-column__body">
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {!items.length && (
            <div className="kanban-column__empty">No work items yet</div>
          )}
          {items.map((item) => (
            <WorkItemCard
              key={item.id}
              item={item}
              onView={onViewItem}
              onEdit={onEditItem}
              onDelete={onDeleteItem}
            />
          ))}
        </SortableContext>
      </div>

      <button className="kanban-column__add" onClick={() => onAddItem(status)}>
        + Add work item
      </button>
    </div>
  );
}
