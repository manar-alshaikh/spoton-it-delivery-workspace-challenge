'use client';

import { useState } from 'react';
import Icon from '@/components/ui/Icon';
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue';

// Search and filter controls for the kanban board.
// Stateless — just calls onChange with new filter values.

interface Filters {
  search:   string;
  assignee: string;
  priority: string;
}

interface FilterBarProps {
  filters:  Filters;
  onChange: (f: Filters) => void;
}

const USERS      = ['Aisha Clarke', 'Ethan Taylor', 'Intern Candidate', 'Jordan Cole', 'Maya Wong', 'Sam Patel'];
const PRIORITIES = ['', 'low', 'medium', 'high', 'urgent'];

export default function FilterBar({ filters, onChange }: FilterBarProps) {
  const [userSearch, setUserSearch] = useState(filters.assignee);
  const [usersOpen, setUsersOpen] = useState(false);
  const debouncedUserSearch = useDebouncedValue(userSearch, 250);

  function set(patch: Partial<Filters>) {
    onChange({ ...filters, ...patch });
  }

  const matchingUsers = debouncedUserSearch.trim()
    ? USERS.filter((user) => user.toLowerCase().includes(debouncedUserSearch.toLowerCase()))
    : [];

  return (
    <div className="filter-bar">
      <div className="filter-bar__search">
        <span className="filter-bar__search-icon">
          <Icon name="search" size={14} />
        </span>
        <input
          type="search"
          placeholder="Search work items…"
          value={filters.search}
          onChange={(e) => set({ search: e.target.value })}
          className="filter-bar__input"
        />
      </div>

      <div className="filter-bar__selects">
        <label className="filter-bar__select-wrap filter-user-filter">
          <span>Users</span>
          <div
            className="filter-user-picker"
            onFocus={() => setUsersOpen(true)}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setUsersOpen(false);
            }}
          >
            <Icon name="user" size={13} />
            <input
              type="text"
              value={userSearch}
              placeholder="Search users"
              aria-label="Filter by user"
              onChange={(event) => {
                setUserSearch(event.target.value);
                setUsersOpen(true);
              }}
            />
            {filters.assignee && (
              <button
                type="button"
                className="filter-user-picker__clear"
                aria-label="Clear user filter"
                onClick={() => {
                  setUserSearch('');
                  set({ assignee: '' });
                  setUsersOpen(false);
                }}
              >
                <Icon name="x" size={12} />
              </button>
            )}
            {usersOpen && userSearch === debouncedUserSearch && debouncedUserSearch.trim() && (
              <div className="filter-user-picker__results">
                {matchingUsers.map((user) => (
                  <button
                    type="button"
                    key={user}
                    onClick={() => {
                      setUserSearch(user);
                      set({ assignee: user });
                      setUsersOpen(false);
                    }}
                  >
                    {user}
                  </button>
                ))}
                {!matchingUsers.length && <div>No users found</div>}
              </div>
            )}
          </div>
        </label>

        <label className="filter-bar__select-wrap">
          <span>Priority</span>
          <select value={filters.priority} onChange={(e) => set({ priority: e.target.value })}>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{p || 'All'}</option>
            ))}
          </select>
        </label>

      </div>
    </div>
  );
}
