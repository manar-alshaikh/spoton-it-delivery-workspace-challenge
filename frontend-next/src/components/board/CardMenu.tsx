'use client';

// Dropdown ··· menu on a work item card.
// Separated from WorkItemCard so the card stays focused on display.

import { useState, useRef, useEffect } from 'react';
import type { WorkItem } from '@/lib/types';

interface CardMenuProps {
  item: WorkItem;
  onEdit: (item: WorkItem) => void;
  onDelete: (id: string) => void;
}

export default function CardMenu({ item, onEdit, onDelete }: CardMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      ref={ref}
      className="card-menu"
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <button
        className="card-menu__trigger"
        aria-label="Card options"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
      >
        ···
      </button>

      {open && (
        <div className="card-menu__dropdown" role="menu">
          <button role="menuitem" onClick={() => { setOpen(false); onEdit(item); }}>
            Edit
          </button>
          <button
            role="menuitem"
            className="danger"
            onClick={() => { setOpen(false); onDelete(item.id); }}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
