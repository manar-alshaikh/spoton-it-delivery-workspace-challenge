'use client';

import { useState, useCallback } from 'react';
import { useWorkItems } from '@/lib/hooks/useWorkItems';
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue';
import { api } from '@/lib/api';
import KanbanBoard from '@/components/board/KanbanBoard';
import StatsRow from '@/components/board/StatsRow';
import FilterBar from '@/components/board/FilterBar';
import WorkItemForm from '@/components/board/WorkItemForm';
import WorkflowHealth from '@/components/board/WorkflowHealth';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import WorkItemDetails from '@/components/board/WorkItemDetails';
import type { WorkItem } from '@/lib/types';

interface Filters {
  search:   string;
  assignee: string;
  priority: string;
}

const DEFAULT_FILTERS: Filters = { search: '', assignee: '', priority: '' };

export default function ItWorkspacePage() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const debouncedSearch = useDebouncedValue(filters.search, 350);

  const { items, loading, error, changeStatus, createItem, updateItem, deleteItem } =
    useWorkItems({
      search:   debouncedSearch  || undefined,
      assignee: filters.assignee || undefined,
      priority: filters.priority || undefined,
    });

  // Form modal state
  const [formOpen,        setFormOpen]        = useState(false);
  const [editItem,        setEditItem]        = useState<WorkItem | null>(null);
  const [defaultStatus,   setDefaultStatus]   = useState('backlog');
  const [formError,       setFormError]       = useState('');
  const [deleteId,        setDeleteId]        = useState<string | null>(null);
  const [deleting,        setDeleting]        = useState(false);
  const [deleteError,     setDeleteError]     = useState('');
  const [detailItem,      setDetailItem]      = useState<WorkItem | null>(null);
  const [statusError,     setStatusError]     = useState('');

  // Stat counts — derived from items in view
  const counts = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.status] = (acc[item.status] ?? 0) + 1;
    return acc;
  }, {});

  const handleAddItem = useCallback((status: string) => {
    setEditItem(null);
    setDefaultStatus(status);
    setFormOpen(true);
  }, []);

  const handleEditItem = useCallback((item: WorkItem) => {
    setEditItem(item);
    setFormOpen(true);
  }, []);

  const handleDeleteItem = useCallback((id: string) => {
    setDeleteError('');
    setDeleteId(id);
  }, []);

  const confirmDeleteItem = useCallback(async () => {
    if (!deleteId) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteItem(deleteId);
      setDeleteId(null);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Failed to delete work item');
    } finally {
      setDeleting(false);
    }
  }, [deleteId, deleteItem]);

  const handleSave = useCallback(async (data: Partial<WorkItem>) => {
    setFormError('');
    try {
      if (editItem) {
        await updateItem(editItem.id, data);
      } else {
        await createItem(data);
        // Award score for creating a work item
        await api.awardScore('work_item_created', 1).catch(() => {});
      }
    } catch (e) {
      throw e;
    }
  }, [editItem, updateItem, createItem]);

  const handleStatusChange = useCallback(async (id: string, newStatus: string) => {
    setStatusError('');
    try {
      await changeStatus(id, newStatus);
    } catch (error) {
      setStatusError(error instanceof Error ? error.message : 'Could not change work item status');
    }
  }, [changeStatus]);

  return (
    <div className="workspace-page">
      {/* Page header */}
      <div className="workspace-page__header">
        <div>
          <div className="eyebrow">IT Delivery</div>
          <h1>IT Workspace</h1>
          <p>Track, manage, and deliver IT work items across the delivery lifecycle.</p>
        </div>
        <button className="button" onClick={() => handleAddItem('backlog')}>
          + New Work Item
        </button>
      </div>

      {/* At-a-glance delivery overview */}
      <div className="workspace-overview">
        <StatsRow counts={counts} />
        <WorkflowHealth items={items} />
        <FilterBar filters={filters} onChange={setFilters} />
      </div>

      {/* Board states */}
      {loading && <div className="board-state">Loading work items…</div>}

      {!loading && error && (
        <div className="board-state error">
          {error}
          <button className="button secondary" onClick={() => setFilters({ ...filters })}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <KanbanBoard
          items={items}
          onStatusChange={handleStatusChange}
          onAddItem={handleAddItem}
          onViewItem={setDetailItem}
          onEditItem={handleEditItem}
          onDeleteItem={handleDeleteItem}
        />
      )}

      {/* Create / Edit modal */}
      {formOpen && (
        <WorkItemForm
          item={editItem}
          defaultStatus={defaultStatus}
          assigneeOptions={Array.from(new Set(
            items.flatMap((item) => item.assignee?.split(',').map((name) => name.trim()) ?? []),
          ))}
          onSave={handleSave}
          onClose={() => { setFormOpen(false); setEditItem(null); setFormError(''); }}
        />
      )}

      {formError && <p className="error">{formError}</p>}

      {statusError && (
        <div className="status-toast" role="alert">
          <span>{statusError}</span>
          <button onClick={() => setStatusError('')} aria-label="Dismiss status error">×</button>
        </div>
      )}

      {detailItem && (
        <WorkItemDetails
          item={detailItem}
          onClose={() => setDetailItem(null)}
          onEdit={(item) => { setDetailItem(null); handleEditItem(item); }}
        />
      )}

      {deleteId && (
        <ConfirmDialog
          title="Delete work item?"
          message={`“${items.find((item) => item.id === deleteId)?.title ?? 'This work item'}” will be permanently removed. This action cannot be undone.`}
          confirmLabel="Delete item"
          busy={deleting}
          error={deleteError}
          onConfirm={confirmDeleteItem}
          onCancel={() => { if (!deleting) setDeleteId(null); }}
        />
      )}
    </div>
  );
}
