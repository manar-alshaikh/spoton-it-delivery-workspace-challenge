'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Badge from '@/components/ui/Badge';
import CardMenu from './CardMenu';
import { getInitials, formatShortDate } from '@/lib/utils/formatting';
import type { WorkItem } from '@/lib/types';

interface WorkItemCardProps {
  item: WorkItem;
  onView: (item: WorkItem) => void;
  onEdit: (item: WorkItem) => void;
  onDelete: (id: string) => void;
}

export default function WorkItemCard({ item, onView, onEdit, onDelete }: WorkItemCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    data: { type: 'work-item', status: item.status },
  });

  const dragStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };
  const assignees = item.assignee?.split(',').map((name) => name.trim()).filter(Boolean) ?? [];

  return (
    <div
      ref={setNodeRef}
      style={dragStyle}
      className="work-item-card"
      {...attributes}
      {...listeners}
      onClick={() => onView(item)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onView(item);
        }
      }}
    >
      <div className="work-item-card__header">
        <span className="work-item-card__title">{item.title}</span>
        <CardMenu item={item} onEdit={onEdit} onDelete={onDelete} />
      </div>

      <Badge value={item.priority} variant="priority" />

      <div className="work-item-card__footer">
        {assignees.length ? (
          <div className="work-item-card__avatars" aria-label={`Assigned to ${assignees.join(', ')}`}>
            {assignees.slice(0, 3).map((name) => (
              <div className="work-item-card__avatar" title={name} key={name}>
                {getInitials(name)}
              </div>
            ))}
            {assignees.length > 3 && (
              <div className="work-item-card__avatar work-item-card__avatar--more" title={assignees.slice(3).join(', ')}>
                +{assignees.length - 3}
              </div>
            )}
          </div>
        ) : (
          <span className="work-item-card__unassigned">Not assigned</span>
        )}
        {item.dueDate && (
          <span className="work-item-card__due">{formatShortDate(item.dueDate)}</span>
        )}
      </div>
    </div>
  );
}
