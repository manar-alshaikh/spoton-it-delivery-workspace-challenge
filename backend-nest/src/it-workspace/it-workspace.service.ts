import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../database/db';
import { ScoreService } from '../score/score.service';
import { VALID_TRANSITIONS, SCORE_EVENTS } from './constants/workflow';
import type { CreateWorkItemDto } from './dto/create-work-item.dto';
import type { UpdateWorkItemDto } from './dto/update-work-item.dto';
import type { CreateQaCheckDto } from './dto/create-qa-check.dto';
import type { UpdateQaCheckDto } from './dto/update-qa-check.dto';
import type { CreateReleaseDto } from './dto/create-release.dto';
import type { RequestUser } from '../common/request-user';

@Injectable()
export class ItWorkspaceService {
  constructor(private readonly score: ScoreService) {}

  // ─── Transition guard ────────────────────────────────────────────────────

  validateTransition(currentStatus: string, newStatus: string): void {
    const allowed = VALID_TRANSITIONS[currentStatus] ?? [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot move from "${currentStatus}" to "${newStatus}". ` +
        `Allowed: ${allowed.length ? allowed.join(', ') : 'none'}.`,
      );
    }
  }

  // ─── Work Items ──────────────────────────────────────────────────────────

  async findAll(filters: {
    status?: string; priority?: string; assignee?: string;
    search?: string; createdBy?: string;
  }) {
    const conditions: string[] = [];
    const params: unknown[]    = [];

    if (filters.status)    { params.push(filters.status);              conditions.push(`status = $${params.length}`); }
    if (filters.priority)  { params.push(filters.priority);            conditions.push(`priority = $${params.length}`); }
    if (filters.assignee)  { params.push(`%${filters.assignee}%`);     conditions.push(`assignee ILIKE $${params.length}`); }
    if (filters.createdBy) { params.push(filters.createdBy);           conditions.push(`created_by = $${params.length}`); }
    if (filters.search)    {
      params.push(`%${filters.search}%`);
      conditions.push(`(title ILIKE $${params.length} OR description ILIKE $${params.length})`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await db.query(
      `SELECT * FROM work_items ${where} ORDER BY created_at DESC`, params,
    );
    return rows.map(this.toWorkItem);
  }

  async findOne(id: string) {
    const { rows } = await db.query('SELECT * FROM work_items WHERE id = $1', [id]);
    if (!rows[0]) throw new NotFoundException(`Work item ${id} not found`);
    return this.toWorkItem(rows[0]);
  }

  async create(dto: CreateWorkItemDto, user: RequestUser) {
    const { rows } = await db.query(
      `INSERT INTO work_items (title, description, type, status, priority, assignee, due_date, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [dto.title, dto.description ?? '', dto.type, dto.status ?? 'backlog',
       dto.priority, dto.assignee ?? null, dto.dueDate ?? null, user.id],
    );
    const item = this.toWorkItem(rows[0]);
    // Score: +1 for creating a useful work item
    await this.score.award(user, SCORE_EVENTS.WORK_ITEM_CREATED.action, SCORE_EVENTS.WORK_ITEM_CREATED.points, item.id as string);
    return item;
  }

  async update(id: string, dto: UpdateWorkItemDto) {
    const fields: string[] = [];
    const params: unknown[] = [];
    const map: Record<string, unknown> = {
      title: dto.title, description: dto.description, type: dto.type,
      priority: dto.priority, assignee: dto.assignee, due_date: dto.dueDate,
    };
    for (const [col, val] of Object.entries(map)) {
      if (val !== undefined) { params.push(val); fields.push(`${col} = $${params.length}`); }
    }
    if (!fields.length) return this.findOne(id);
    params.push(new Date().toISOString()); fields.push(`updated_at = $${params.length}`);
    params.push(id);
    const { rows } = await db.query(
      `UPDATE work_items SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING *`, params,
    );
    if (!rows[0]) throw new NotFoundException(`Work item ${id} not found`);
    return this.toWorkItem(rows[0]);
  }

  async transitionStatus(id: string, newStatus: string, user: RequestUser) {
    const item = await this.findOne(id);
    this.validateTransition(item.status as string, newStatus);

    // Gate: moving to ready_for_release requires all QA checks to pass
    if (newStatus === 'ready_for_release') {
      await this.assertQaReady(id);
    }

    const { rows } = await db.query(
      `UPDATE work_items SET status = $1, updated_at = $2 WHERE id = $3 RETURNING *`,
      [newStatus, new Date().toISOString(), id],
    );
    const updated = this.toWorkItem(rows[0]);

    // Score events for meaningful transitions
    if (newStatus === 'qa') {
      await this.score.award(user, SCORE_EVENTS.MOVED_TO_QA.action, SCORE_EVENTS.MOVED_TO_QA.points, `${id}:qa`);
    }
    if (newStatus === 'ready_for_release') {
      await this.score.award(user, SCORE_EVENTS.MOVED_TO_READY.action, SCORE_EVENTS.MOVED_TO_READY.points, `${id}:ready`);
    }

    return updated;
  }

  async remove(id: string) {
    const { rowCount } = await db.query('DELETE FROM work_items WHERE id = $1', [id]);
    if (!rowCount) throw new NotFoundException(`Work item ${id} not found`);
    return { deleted: true, id };
  }

  // ─── QA Checks ───────────────────────────────────────────────────────────

  async findQaChecks(workItemId: string) {
    await this.findOne(workItemId); // 404 if work item doesn't exist
    const { rows } = await db.query(
      `SELECT * FROM qa_checks WHERE work_item_id = $1 ORDER BY created_at ASC`, [workItemId],
    );
    return rows.map(this.toQaCheck);
  }

  async createQaCheck(workItemId: string, dto: CreateQaCheckDto, user: RequestUser) {
    await this.findOne(workItemId);
    const { rows } = await db.query(
      `INSERT INTO qa_checks (work_item_id, test_title, expected_result, actual_result, tester, notes)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [workItemId, dto.testTitle, dto.expectedResult ?? '', dto.actualResult ?? '',
       dto.tester ?? user.name, dto.notes ?? null],
    );
    return this.toQaCheck(rows[0]);
  }

  async updateQaCheck(checkId: string, dto: UpdateQaCheckDto, user: RequestUser) {
    const fields: string[] = [];
    const params: unknown[] = [];
    const map: Record<string, unknown> = {
      test_title: dto.testTitle, expected_result: dto.expectedResult,
      actual_result: dto.actualResult, status: dto.status,
      tester: dto.tester, notes: dto.notes,
    };
    for (const [col, val] of Object.entries(map)) {
      if (val !== undefined) { params.push(val); fields.push(`${col} = $${params.length}`); }
    }
    if (!fields.length) {
      const { rows } = await db.query('SELECT * FROM qa_checks WHERE id = $1', [checkId]);
      if (!rows[0]) throw new NotFoundException(`QA check ${checkId} not found`);
      return this.toQaCheck(rows[0]);
    }
    params.push(new Date().toISOString()); fields.push(`updated_at = $${params.length}`);
    params.push(checkId);
    const { rows } = await db.query(
      `UPDATE qa_checks SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING *`, params,
    );
    if (!rows[0]) throw new NotFoundException(`QA check ${checkId} not found`);

    // Score: +1 for completing a QA check (passing it)
    if (dto.status === 'passed') {
      await this.score.award(user, 'qa_check_passed', 1, checkId);
    }

    return this.toQaCheck(rows[0]);
  }

  async deleteQaCheck(checkId: string) {
    const { rowCount } = await db.query('DELETE FROM qa_checks WHERE id = $1', [checkId]);
    if (!rowCount) throw new NotFoundException(`QA check ${checkId} not found`);
    return { deleted: true, id: checkId };
  }

  // ─── Releases ────────────────────────────────────────────────────────────

  async findReleases() {
    const { rows } = await db.query(
      `SELECT r.*,
         COALESCE(json_agg(wi.*) FILTER (WHERE wi.id IS NOT NULL), '[]') AS linked_work_items
       FROM release_notes r
       LEFT JOIN release_work_items rwi ON rwi.release_id = r.id
       LEFT JOIN work_items wi ON wi.id = rwi.work_item_id
       GROUP BY r.id
       ORDER BY r.created_at DESC`,
    );
    return rows.map(this.toRelease);
  }

  async findRelease(id: string) {
    const { rows } = await db.query(
      `SELECT r.*,
         COALESCE(json_agg(wi.*) FILTER (WHERE wi.id IS NOT NULL), '[]') AS linked_work_items
       FROM release_notes r
       LEFT JOIN release_work_items rwi ON rwi.release_id = r.id
       LEFT JOIN work_items wi ON wi.id = rwi.work_item_id
       WHERE r.id = $1
       GROUP BY r.id`,
      [id],
    );
    if (!rows[0]) throw new NotFoundException(`Release ${id} not found`);
    return this.toRelease(rows[0]);
  }

  async createRelease(dto: CreateReleaseDto) {
    // Version must be unique
    const existing = await db.query('SELECT id FROM release_notes WHERE version = $1', [dto.version]);
    if (existing.rows[0]) throw new ConflictException(`Release version "${dto.version}" already exists`);

    const { rows } = await db.query(
      `INSERT INTO release_notes (version, summary, release_date, deployment_status)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [dto.version, dto.summary ?? '', dto.releaseDate ?? null, dto.deploymentStatus ?? 'draft'],
    );
    return this.toRelease({ ...rows[0], linked_work_items: [] });
  }

  async linkWorkItem(releaseId: string, workItemId: string) {
    const [, item] = await Promise.all([
      this.findRelease(releaseId),
      this.findOne(workItemId),
    ]);
    if (item.status !== 'ready_for_release') {
      throw new BadRequestException(
        `Work item "${item.title}" must be in "ready_for_release" status to be linked to a release.`,
      );
    }
    await db.query(
      `INSERT INTO release_work_items (release_id, work_item_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
      [releaseId, workItemId],
    );
    return this.findRelease(releaseId);
  }

  async unlinkWorkItem(releaseId: string, workItemId: string) {
    await this.findRelease(releaseId);
    await db.query(
      `DELETE FROM release_work_items WHERE release_id = $1 AND work_item_id = $2`,
      [releaseId, workItemId],
    );
    return this.findRelease(releaseId);
  }

  async deployRelease(releaseId: string, user: RequestUser) {
    const release = await this.findRelease(releaseId);

    if (release.deploymentStatus === 'deployed') {
      throw new ConflictException('This release has already been deployed. Deploying again would award duplicate points.');
    }
    if ((release.linkedWorkItems as unknown[]).length === 0) {
      throw new BadRequestException('Cannot deploy a release with no linked work items.');
    }

    // Mark release as deployed
    await db.query(
      `UPDATE release_notes SET deployment_status = 'deployed', updated_at = $1 WHERE id = $2`,
      [new Date().toISOString(), releaseId],
    );

    // Mark all linked work items as released
    const linkedIds = (release.linkedWorkItems as Array<{ id: string }>).map((i) => i.id);
    if (linkedIds.length) {
      await db.query(
        `UPDATE work_items SET status = 'released', updated_at = $1 WHERE id = ANY($2::text[])`,
        [new Date().toISOString(), linkedIds],
      );
    }

    // Score: +3 for deploying a release (idempotency guaranteed by unique index)
    await this.score.award(
      user,
      SCORE_EVENTS.RELEASE_DEPLOYED.action,
      SCORE_EVENTS.RELEASE_DEPLOYED.points,
      releaseId,
    );

    return this.findRelease(releaseId);
  }

  // ─── Summary ─────────────────────────────────────────────────────────────

  async summary() {
    const { rows } = await db.query(
      `SELECT status, COUNT(*)::int AS count FROM work_items GROUP BY status`,
    );
    const counts = Object.fromEntries(rows.map((r: { status: string; count: number }) => [r.status, r.count]));
    const [qa, releases] = await Promise.all([
      db.query('SELECT COUNT(*)::int AS count FROM qa_checks'),
      db.query('SELECT COUNT(*)::int AS count FROM release_notes'),
    ]);
    return { workItems: counts, qaChecks: qa.rows[0].count, releases: releases.rows[0].count };
  }

  // ─── Comments (existing) ──────────────────────────────────────────────────

  private commentsTableReady: Promise<void> | null = null;

  async findComments(workItemId: string) {
    await this.findOne(workItemId);
    await this.ensureCommentsTable();
    const { rows } = await db.query(
      `SELECT id, work_item_id, author_id, author_name, message, created_at
       FROM work_item_comments WHERE work_item_id = $1 ORDER BY created_at ASC`,
      [workItemId],
    );
    return rows.map(this.toComment);
  }

  async addComment(workItemId: string, message: string, user: RequestUser) {
    await this.findOne(workItemId);
    await this.ensureCommentsTable();
    const { rows } = await db.query(
      `INSERT INTO work_item_comments (work_item_id, author_id, author_name, message)
       VALUES ($1,$2,$3,$4)
       RETURNING id, work_item_id, author_id, author_name, message, created_at`,
      [workItemId, user.id, user.name, message.trim()],
    );
    return this.toComment(rows[0]);
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private async assertQaReady(workItemId: string): Promise<void> {
    const { rows } = await db.query(
      'SELECT status FROM qa_checks WHERE work_item_id = $1', [workItemId],
    );
    if (rows.length === 0) {
      throw new BadRequestException(
        'Work item has no QA checks. Add at least one QA check and mark it passed before releasing.',
      );
    }
    const notPassed = rows.filter((r: { status: string }) => r.status !== 'passed');
    if (notPassed.length > 0) {
      throw new BadRequestException(
        `${notPassed.length} QA check(s) are not yet passed. All must pass before marking as ready for release.`,
      );
    }
  }

  private ensureCommentsTable(): Promise<void> {
    if (!this.commentsTableReady) {
      this.commentsTableReady = db.query(
        `CREATE TABLE IF NOT EXISTS work_item_comments (
          id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          work_item_id TEXT NOT NULL REFERENCES work_items(id) ON DELETE CASCADE,
          author_id    TEXT NOT NULL,
          author_name  TEXT NOT NULL,
          message      TEXT NOT NULL,
          created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )`,
      ).then(() => undefined).catch((err) => { this.commentsTableReady = null; throw err; });
    }
    return this.commentsTableReady!;
  }

  private toWorkItem = (row: Record<string, unknown>) => {
    return {
      id: row.id, title: row.title, description: row.description,
      type: row.type, status: row.status, priority: row.priority,
      assignee: row.assignee, dueDate: row.due_date,
      createdBy: row.created_by, createdAt: row.created_at, updatedAt: row.updated_at,
    };
  };

  private toQaCheck = (row: Record<string, unknown>) => {
    return {
      id: row.id, workItemId: row.work_item_id, testTitle: row.test_title,
      expectedResult: row.expected_result, actualResult: row.actual_result,
      status: row.status, tester: row.tester, notes: row.notes,
      createdAt: row.created_at, updatedAt: row.updated_at,
    };
  };

  private toRelease = (row: Record<string, unknown>) => {
    const linkedRaw = row.linked_work_items as Record<string, unknown>[];
    return {
      id: row.id, version: row.version, summary: row.summary,
      releaseDate: row.release_date, deploymentStatus: row.deployment_status,
      linkedWorkItems: Array.isArray(linkedRaw) ? linkedRaw.map(this.toWorkItem) : [],
      createdAt: row.created_at, updatedAt: row.updated_at,
    };
  };

  private toComment = (row: Record<string, unknown>) => {
    return {
      id: row.id, workItemId: row.work_item_id,
      authorId: row.author_id, authorName: row.author_name,
      message: row.message, createdAt: row.created_at,
    };
  };
}
