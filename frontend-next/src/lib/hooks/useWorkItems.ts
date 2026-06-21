'use client';

// Manages work item list state: fetching, optimistic status updates,
// create, update, delete. The page just calls this hook.

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { WorkItem } from '@/lib/types';

interface Filters {
  assignee?: string;
  priority?: string;
  search?: string;
}

export function useWorkItems(filters: Filters = {}) {
  const [items,   setItems]   = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.workItems(filters);
      setItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load work items');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.assignee, filters.priority, filters.search]);

  useEffect(() => { load(); }, [load]);

  // Optimistic status change — update UI immediately, revert on error
  const changeStatus = useCallback(async (id: string, newStatus: string) => {
    const previous = items.find((i) => i.id === id);
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: newStatus as WorkItem['status'] } : i)),
    );
    try {
      await api.transitionWorkItem(id, newStatus);
    } catch (e) {
      // Revert on failure
      if (previous) {
        setItems((prev) =>
          prev.map((i) => (i.id === id ? previous : i)),
        );
      }
      throw e;
    }
  }, [items]);

  const createItem = useCallback(async (body: Partial<WorkItem>) => {
    const created = await api.createWorkItem(body);
    setItems((prev) => [created, ...prev]);
    return created;
  }, []);

  const updateItem = useCallback(async (id: string, body: Partial<WorkItem>) => {
    const updated = await api.updateWorkItem(id, body);
    setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
    return updated;
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    await api.deleteWorkItem(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  return { items, loading, error, changeStatus, createItem, updateItem, deleteItem, reload: load };
}
