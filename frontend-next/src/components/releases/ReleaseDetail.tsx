'use client';

// Release detail panel — shows linked work items, link/unlink, and deploy button.

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/ui/Icon';
import { formatShortDate } from '@/lib/utils/formatting';
import type { Release, WorkItem } from '@/lib/types';

interface ReleaseDetailProps {
  releaseId: string;
  onClose:   () => void;
  onDeployed: () => void;
}

export default function ReleaseDetail({ releaseId, onClose, onDeployed }: ReleaseDetailProps) {
  const [release,       setRelease]       = useState<Release | null>(null);
  const [readyItems,    setReadyItems]    = useState<WorkItem[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [deploying,     setDeploying]     = useState(false);
  const [deployError,   setDeployError]   = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [rel, items] = await Promise.all([
        api.release(releaseId),
        api.workItems({ status: 'ready_for_release' }),
      ]);
      setRelease(rel);
      // Exclude already linked items
      const linkedIds = new Set((rel.linkedWorkItems ?? []).map((i) => i.id));
      setReadyItems(items.filter((i) => !linkedIds.has(i.id)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load release');
    } finally {
      setLoading(false);
    }
  }, [releaseId]);

  useEffect(() => { load(); }, [load]);

  async function link(workItemId: string) {
    try {
      const updated = await api.linkWorkItem(releaseId, workItemId);
      setRelease(updated);
      setReadyItems((prev) => prev.filter((i) => i.id !== workItemId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to link work item');
    }
  }

  async function unlink(workItemId: string) {
    try {
      const updated = await api.unlinkWorkItem(releaseId, workItemId);
      setRelease(updated);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to unlink work item');
    }
  }

  async function deploy() {
    if (!confirm(`Deploy release ${release?.version}? This will mark all linked work items as released.`)) return;
    setDeploying(true);
    setDeployError('');
    try {
      const updated = await api.deployRelease(releaseId);
      setRelease(updated);
      onDeployed();
    } catch (e) {
      setDeployError(e instanceof Error ? e.message : 'Deployment failed');
    } finally {
      setDeploying(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal--wide" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal__header">
          <div>
            <h2>{release?.version ?? 'Release'}</h2>
            {release && <p>{release.summary || 'No summary'}</p>}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {release && <Badge value={release.deploymentStatus} variant="status" />}
            <button className="modal__close" onClick={onClose} aria-label="Close"><Icon name="x" size={16} /></button>
          </div>
        </div>

        <div className="modal__body">
          {loading && <p className="detail-muted">Loading…</p>}
          {error   && <p className="error">{error}</p>}

          {release && (
            <>
              <div className="release-meta">
                {release.releaseDate && (
                  <span><Icon name="clock" size={13} /> Planned: {formatShortDate(release.releaseDate)}</span>
                )}
                <span><Icon name="layers" size={13} /> {release.linkedWorkItems?.length ?? 0} work items</span>
              </div>

              {/* Linked work items */}
              <div className="detail-section">
                <h3>Linked Work Items</h3>
                {(release.linkedWorkItems?.length ?? 0) === 0
                  ? <p className="detail-muted">No work items linked yet. Link ready items below.</p>
                  : (
                    <ul className="release-items-list">
                      {release.linkedWorkItems.map((item) => (
                        <li key={item.id} className="release-items-list__item">
                          <Badge value={item.priority} variant="priority" />
                          <span className="release-items-list__title">{item.title}</span>
                          {release.deploymentStatus !== 'deployed' && (
                            <button className="release-items-list__unlink" onClick={() => unlink(item.id)} title="Unlink">
                              <Icon name="x" size={12} />
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  )
                }
              </div>

              {/* Link ready items */}
              {release.deploymentStatus !== 'deployed' && readyItems.length > 0 && (
                <div className="detail-section">
                  <h3>Link Ready Items</h3>
                  <ul className="release-items-list">
                    {readyItems.map((item) => (
                      <li key={item.id} className="release-items-list__item">
                        <Badge value={item.priority} variant="priority" />
                        <span className="release-items-list__title">{item.title}</span>
                        <button className="button" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => link(item.id)}>
                          Link
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {deployError && <p className="error">{deployError}</p>}

              {release.deploymentStatus !== 'deployed' && (
                <div className="modal__footer">
                  <button className="button" onClick={deploy} disabled={deploying || (release.linkedWorkItems?.length ?? 0) === 0}>
                    {deploying ? 'Deploying…' : `Deploy ${release.version}`}
                  </button>
                </div>
              )}

              {release.deploymentStatus === 'deployed' && (
                <div className="release-deployed-banner">
                  <Icon name="check-circle" size={16} /> Deployed — all linked items are now released.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
