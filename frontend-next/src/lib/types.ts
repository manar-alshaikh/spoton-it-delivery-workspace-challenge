// ─── Work Items ──────────────────────────────────────────────────────────────

export type WorkItemStatus =
  | 'backlog'
  | 'planned'
  | 'in_progress'
  | 'qa'
  | 'ready_for_release'
  | 'released';

export type WorkItemPriority = 'low' | 'medium' | 'high' | 'urgent';
export type WorkItemType = 'feature' | 'bug' | 'improvement' | 'maintenance';

export interface WorkItem {
  id: string;
  title: string;
  description: string;
  type: WorkItemType;
  status: WorkItemStatus;
  priority: WorkItemPriority;
  assignee: string | null;
  dueDate: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkItemComment {
  id: string;
  workItemId: string;
  authorId: string;
  authorName: string;
  message: string;
  createdAt: string;
}

// ─── QA Checks ───────────────────────────────────────────────────────────────

export type QaStatus = 'pending' | 'passed' | 'failed';

export interface QaCheck {
  id: string;
  workItemId: string;
  testTitle: string;
  expectedResult: string;
  actualResult: string;
  status: QaStatus;
  tester: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Releases ─────────────────────────────────────────────────────────────────

export type DeploymentStatus = 'draft' | 'scheduled' | 'deployed' | 'rolled_back';

export interface Release {
  id: string;
  version: string;
  releaseDate: string | null;
  summary: string;
  deploymentStatus: DeploymentStatus;
  linkedWorkItems: WorkItem[];
  createdAt: string;
  updatedAt: string;
}

// ─── Score ───────────────────────────────────────────────────────────────────

export interface ScoreEvent {
  id: string;
  action: string;
  points: number;
  createdAt: string;
}

export interface ScoreSummary {
  total: number;
  events: ScoreEvent[];
}
