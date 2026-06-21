'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Icon from '@/components/ui/Icon';
import { formatShortDate } from '@/lib/utils/formatting';
import type { ScoreSummary } from '@/lib/types';

// Human-readable labels for score action keys
const ACTION_LABELS: Record<string, string> = {
  work_item_created:     'Created a work item',
  work_item_moved_to_qa: 'Moved work item to QA',
  work_item_ready:       'Marked ready for release',
  qa_check_passed:       'Passed a QA check',
  release_deployed:      'Deployed a release',
};

function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action.replace(/_/g, ' ');
}

export default function ScorePage() {
  const [score,   setScore]   = useState<ScoreSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    api.score()
      .then(setScore)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load score'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="workspace-page">
      <div className="workspace-page__header">
        <div>
          <div className="eyebrow">Score System</div>
          <h1>Engineering Score</h1>
          <p>Points earned through meaningful workflow actions.</p>
        </div>
      </div>

      {error && <div className="board-state error">{error}</div>}

      {!loading && (
        <div className="score-layout">
          {/* Total points card */}
          <div className="card score-total">
            <div className="score-total__icon"><Icon name="zap" size={28} /></div>
            <div>
              <div className="score-total__label">Total Points</div>
              <div className="score-total__value">{score?.total ?? 0}</div>
            </div>
          </div>

          {/* Points legend */}
          <div className="card score-legend">
            <h2>How points are earned</h2>
            <ul className="score-legend__list">
              <li><span>Create a work item</span><strong>+1</strong></li>
              <li><span>Move item to QA</span><strong>+1</strong></li>
              <li><span>Pass a QA check</span><strong>+1</strong></li>
              <li><span>Mark ready for release</span><strong>+2</strong></li>
              <li><span>Deploy a release</span><strong>+3</strong></li>
            </ul>
            <p className="score-legend__note">Each action can only score once per entity — no duplicate points.</p>
          </div>

          {/* Recent events */}
          <div className="card score-events">
            <h2>Recent Activity</h2>
            {!score?.events.length
              ? <p>No score events yet. Start creating and moving work items.</p>
              : (
                <ul className="score-events__list">
                  {score.events.map((event) => (
                    <li key={event.id} className="score-event">
                      <div className="score-event__icon"><Icon name="check-circle" size={14} /></div>
                      <div className="score-event__body">
                        <span>{actionLabel(event.action)}</span>
                        <time>{formatShortDate(event.createdAt)}</time>
                      </div>
                      <div className="score-event__points">+{event.points}</div>
                    </li>
                  ))}
                </ul>
              )
            }
          </div>
        </div>
      )}
    </div>
  );
}
