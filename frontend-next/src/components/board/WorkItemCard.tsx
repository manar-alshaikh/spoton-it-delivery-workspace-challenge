'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Badge from '@/components/ui/Badge';
import CardMenu from './CardMenu';
import { getInitials, formatShortDate } from '@/lib/utils/formatting';
import type { WorkItem } from '@/lib/types';

interface WorkItemCardProps {
  item: WorkItem;
  onEdit: (item: WorkItem) => void;
  onDelete: (id: string) => void;
}

export default function WorkItemCard({ item, onEdit, onDelete }: WorkItemCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const dragStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={dragStyle}
      className="work-item-card"
      {...attributes}
      {...listeners}
    >
      <div className="work-item-card__header">
        <span className="work-item-card__title">{item.title}</span>
        <CardMenu item={item} onEdit={onEdit} onDelete={onDelete} />
      </div>

      <Badge value={item.priority} variant="priority" />

      <div className="work-item-card__footer">
        <div className="work-item-card__avatar" title={item.assignee ?? 'Unassigned'}>
          {getInitials(item.assignee)}
        </div>
        {item.dueDate && (
          <span className="work-item-card__due">{formatShortDate(item.dueDate)}</span>
        )}
      </div>
    </div>
  );
}
