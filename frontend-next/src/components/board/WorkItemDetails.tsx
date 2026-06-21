'use client';

import { FormEvent, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatShortDate, getInitials, labelFromKey } from '@/lib/utils/formatting';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/ui/Icon';
import type { WorkItem, WorkItemComment } from '@/lib/types';

interface WorkItemDetailsProps {
  item: WorkItem;
  onClose: () => void;
  onEdit: (item: WorkItem) => void;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function WorkItemDetails({ item, onClose, onEdit }: WorkItemDetailsProps) {
  const [details, setDetails] = useState(item);
  const [comments, setComments] = useState<WorkItemComment[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [message, setMessage] = useState('');
  const [posting, setPosting] = useState(false);
  const [commentError, setCommentError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([api.workItem(item.id), api.workItemComments(item.id), api.me()])
      .then(([latest, thread, user]) => {
        if (!active) return;
        setDetails(latest);
        setComments(thread);
        setCurrentUser(user);
      })
      .catch((error) => {
        if (active) setLoadError(error instanceof Error ? error.message : 'Failed to load details');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [item.id]);

  async function submitComment(event: FormEvent) {
    event.preventDefault();
    const cleanMessage = message.trim();
    if (!cleanMessage || posting) return;
    setPosting(true);
    setCommentError('');
    try {
      const comment = await api.addWorkItemComment(details.id, cleanMessage);
      setComments((current) => [...current, comment]);
      setMessage('');
    } catch (error) {
      setCommentError(error instanceof Error ? error.message : 'Failed to add comment');
    } finally {
      setPosting(false);
    }
  }

  const assignees = details.assignee?.split(',').map((name) => name.trim()).filter(Boolean) ?? [];
  const creator = currentUser?.id === details.createdBy ? currentUser.name : details.createdBy;

  return (
    <div className="modal-backdrop detail-backdrop" onMouseDown={onClose}>
      <section
        className="work-item-detail"
        role="dialog"
        aria-modal="true"
        aria-labelledby="work-item-detail-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="work-item-detail__header">
          <div>
            <span className="work-item-detail__eyebrow">{labelFromKey(details.type)} · {details.id.slice(0, 8)}</span>
            <h2 id="work-item-detail-title">{details.title}</h2>
          </div>
          <div className="work-item-detail__header-actions">
            <button className="button secondary" onClick={() => onEdit(details)}>Edit</button>
            <button className="modal__close" onClick={onClose} aria-label="Close details">
              <Icon name="x" size={18} />
            </button>
          </div>
        </header>

        <div className="work-item-detail__body">
          <div className="work-item-detail__information">
            {loading && <div className="detail-loading">Loading latest details…</div>}
            {loadError && <div className="detail-inline-error">{loadError}</div>}

            <div className="work-item-detail__badges">
              <Badge value={details.status} variant="status" />
              <Badge value={details.priority} variant="priority" />
              <Badge value={details.type} variant="type" />
            </div>

            <div className="detail-section">
              <h3>Description</h3>
              <p className={details.description ? '' : 'detail-muted'}>
                {details.description || 'No description provided.'}
              </p>
            </div>

            <div className="detail-section">
              <h3>Assignees</h3>
              <div className="detail-assignees">
                {assignees.length ? assignees.map((name) => (
                  <span key={name}><b>{getInitials(name)}</b>{name}</span>
                )) : <p className="detail-muted">Unassigned</p>}
              </div>
            </div>

            <dl className="detail-metadata">
              <div><dt>Due date</dt><dd>{details.dueDate ? formatShortDate(details.dueDate) : 'Not set'}</dd></div>
              <div><dt>Created by</dt><dd>{creator}</dd></div>
              <div><dt>Created</dt><dd>{formatDateTime(details.createdAt)}</dd></div>
              <div><dt>Last updated</dt><dd>{formatDateTime(details.updatedAt)}</dd></div>
            </dl>
          </div>

          <aside className="work-item-comments">
            <div className="work-item-comments__heading">
              <div><Icon name="clipboard" size={15} /><h3>Comments</h3></div>
              <span>{comments.length}</span>
            </div>

            <div className="work-item-comments__thread" aria-live="polite">
              {!loading && !comments.length && (
                <div className="work-item-comments__empty">
                  <Icon name="clipboard" size={22} />
                  <p>No comments yet.</p>
                  <span>Start the conversation below.</span>
                </div>
              )}
              {comments.map((comment) => (
                <article className="work-item-comment" key={comment.id}>
                  <div className="work-item-comment__avatar">{getInitials(comment.authorName)}</div>
                  <div>
                    <header>
                      <strong>{comment.authorName}</strong>
                      {comment.authorId === currentUser?.id && <span>You</span>}
                      <time dateTime={comment.createdAt}>{formatDateTime(comment.createdAt)}</time>
                    </header>
                    <p>{comment.message}</p>
                  </div>
                </article>
              ))}
            </div>

            <form className="work-item-comments__form" onSubmit={submitComment}>
              <label htmlFor="work-item-comment">Add a comment</label>
              <textarea
                id="work-item-comment"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Write a message…"
                rows={3}
                maxLength={2000}
              />
              <div>
                <span>{message.length}/2000</span>
                <button className="button" type="submit" disabled={!message.trim() || posting}>
                  {posting ? 'Posting…' : 'Post comment'}
                </button>
              </div>
              {commentError && <p className="detail-inline-error">{commentError}</p>}
            </form>
          </aside>
        </div>
      </section>
    </div>
  );
}
