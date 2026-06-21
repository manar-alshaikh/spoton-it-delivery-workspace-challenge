import Icon from '@/components/ui/Icon';
import type { WorkItem } from '@/lib/types';

interface WorkflowHealthProps {
  items: WorkItem[];
}

const RENDER_DAY = Date.now();

function calcScore(items: WorkItem[]): number {
  if (!items.length) return 100;

  const active = items.filter((item) => item.status !== 'backlog').length;
  const validated = items.filter((item) =>
    ['qa', 'ready_for_release', 'released'].includes(item.status),
  ).length;
  const overdue = items.filter((item) =>
    item.dueDate && new Date(item.dueDate).getTime() < RENDER_DAY && item.status !== 'released',
  ).length;
  const flowScore = Math.round((active / items.length) * 55);
  const validationScore = Math.round((validated / items.length) * 25);
  const overdueScore = overdue === 0 ? 20 : Math.max(0, 20 - overdue * 4);
  return Math.min(100, flowScore + validationScore + overdueScore);
}

function scoreLabel(score: number) {
  if (score >= 80) return { label: 'Good', color: '#22c55e' };
  if (score >= 55) return { label: 'Fair', color: '#f59e0b' };
  return { label: 'At Risk', color: '#ef4444' };
}

export default function WorkflowHealth({ items }: WorkflowHealthProps) {
  const score = calcScore(items);
  const { label, color } = scoreLabel(score);
  const ready = items.filter((item) => item.status === 'ready_for_release').length;
  const validated = items.filter((item) =>
    ['qa', 'ready_for_release', 'released'].includes(item.status),
  ).length;
  const overdue = items.filter((item) =>
    item.dueDate && new Date(item.dueDate).getTime() < RENDER_DAY && item.status !== 'released',
  ).length;
  const inProgress = items.filter((item) => item.status === 'in_progress').length;

  return (
    <aside className="workflow-health card">
      <div className="workflow-health__header">
        <span className="workflow-health__title">Workflow Health</span>
        <Icon name="shield" size={14} />
      </div>

      <div className="workflow-health__gauge" style={{ color }}>
        <svg viewBox="0 0 120 68" role="img" aria-label={`Workflow health ${score} out of 100`}>
          <path className="workflow-health__gauge-track" pathLength="100" d="M 14 58 A 46 46 0 0 1 106 58" />
          <path className="workflow-health__gauge-value" pathLength="100" strokeDasharray={`${score} 100`} d="M 14 58 A 46 46 0 0 1 106 58" />
        </svg>
        <div className="workflow-health__score">
          <span><strong>{score}</strong>/100</span>
          <small>{label}</small>
        </div>
      </div>

      <div className="workflow-health__readiness">
        <span>Release readiness</span>
        <div className="workflow-health__metrics">
          <span><Icon name="rocket" size={12} /> {ready} item{ready === 1 ? '' : 's'} ready</span>
          <span><Icon name="check-circle" size={12} /> {validated} item{validated === 1 ? '' : 's'} validated</span>
          <span className={overdue ? 'metric-warn' : 'metric-ok'}>
            <Icon name={overdue ? 'alert-circle' : 'check-circle'} size={12} /> {overdue} overdue
          </span>
          <span><Icon name="zap" size={12} /> {inProgress} in progress</span>
        </div>
      </div>
    </aside>
  );
}
