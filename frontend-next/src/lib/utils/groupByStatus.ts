import { WORK_ITEM_STATUSES } from '@/lib/constants/board';
import type { WorkItem } from '@/lib/types';

// Groups a flat list of work items into a map keyed by status.
// Returns all statuses even if empty, preserving column order.
export function groupByStatus(items: WorkItem[]): Record<string, WorkItem[]> {
  const groups: Record<string, WorkItem[]> = {};

  for (const status of WORK_ITEM_STATUSES) {
    groups[status] = [];
  }

  for (const item of items) {
    groups[item.status]?.push(item);
  }

  return groups;
}
