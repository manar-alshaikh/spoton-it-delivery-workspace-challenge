'use client';

// Encapsulates all drag-and-drop state and event logic for the Kanban board.
// KanbanBoard stays a pure layout component; this hook owns the DnD behavior.

import { useState, useCallback } from 'react';
import { PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { WORK_ITEM_STATUSES } from '@/lib/constants/board';
import type { WorkItem } from '@/lib/types';

interface UseDragBoardOptions {
  items: WorkItem[];
  onStatusChange: (id: string, newStatus: string) => Promise<void>;
}

export function useDragBoard({ items, onStatusChange }: UseDragBoardOptions) {
  const [activeItem, setActiveItem] = useState<WorkItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      setActiveItem(items.find((i) => i.id === event.active.id) ?? null);
    },
    [items],
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveItem(null);
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      // Explicit metadata resolves both empty columns and cards in occupied columns.
      const statusFromDropData = over.data.current?.status;
      const isColumnId = (WORK_ITEM_STATUSES as readonly string[]).includes(over.id as string);
      const targetStatus = typeof statusFromDropData === 'string'
        ? statusFromDropData
        : isColumnId
          ? (over.id as string)
          : items.find((i) => i.id === over.id)?.status;

      if (!targetStatus) return;

      const dragged = items.find((i) => i.id === active.id);
      if (!dragged || dragged.status === targetStatus) return;

      await onStatusChange(dragged.id, targetStatus);
    },
    [items, onStatusChange],
  );

  return { sensors, activeItem, handleDragStart, handleDragEnd };
}
