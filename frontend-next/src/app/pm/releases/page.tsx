'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/ui/Icon';
import ReleaseForm from '@/components/releases/ReleaseForm';
import ReleaseDetail from '@/components/releases/ReleaseDetail';
import { formatShortDate } from '@/lib/utils/formatting';
import type { Release } from '@/lib/types';

export default function ReleasesPage() {
  const [releases,   setReleases]   = useState<Release[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [formOpen,   setFormOpen]   = useState(false);
  const [detailId,   setDetailId]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setReleases(await api.releases());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load releases');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="workspace-page">
      <div className="workspace-page__header">
        <div>
          <div className="eyebrow">IT Delivery</div>
          <h1>Releases</h1>
          <p>Plan, track, and deploy software releases.</p>
        </div>
        <button className="button" onClick={() => setFormOpen(true)}>
          <Icon name="plus" size={14} /> New Release
        </button>
      </div>

      {loading && <div className="board-state">Loading releases…</div>}
      {!loading && error && <div className="board-state error">{error}</div>}

      {!loading && !error && releases.length === 0 && (
        <div className="empty">
          <Icon name="rocket" size={32} />
          <p>No releases yet. Create your first release above.</p>
        </div>
      )}

      {!loading && releases.length > 0 && (
        <div className="releases-list">
          {releases.map((release) => (
            <div
              key={release.id}
              className="release-card card"
              onClick={() => setDetailId(release.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setDetailId(release.id)}
            >
              <div className="release-card__header">
                <span className="release-card__version">{release.version}</span>
                <Badge value={release.deploymentStatus} variant="status" />
              </div>
              <p className="release-card__summary">{release.summary || 'No summary'}</p>
              <div className="release-card__meta">
                <span><Icon name="layers" size={13} /> {release.linkedWorkItems?.length ?? 0} items</span>
                {release.releaseDate && (
                  <span><Icon name="clock" size={13} /> {formatShortDate(release.releaseDate)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {formOpen && (
        <ReleaseForm
          onCreated={load}
          onClose={() => setFormOpen(false)}
        />
      )}

      {detailId && (
        <ReleaseDetail
          releaseId={detailId}
          onClose={() => setDetailId(null)}
          onDeployed={load}
        />
      )}
    </div>
  );
}
