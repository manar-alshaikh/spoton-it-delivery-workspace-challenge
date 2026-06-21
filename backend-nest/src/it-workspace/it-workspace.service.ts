import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../database/db';
import { VALID_TRANSITIONS } from './constants/workflow';
import type { CreateWorkItemDto } from './dto/create-work-item.dto';
import type { UpdateWorkItemDto } from './dto/update-work-item.dto';
import type { RequestUser } from '../common/request-user';

@Injectable()
export class ItWorkspaceService {

  // ─── Validation ───────────────────────────────────────────────────────────

  /** Throws if the transition from currentStatus → newStatus is not allowed. */
  validateTransition(currentStatus: string, newStatus: string): void {
    const allowed = VALID_TRANSITIONS[currentStatus] ?? [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot move from "${currentStatus}" to "${newStatus}". ` +
        `Allowed next statuses: ${allowed.length ? allowed.join(', ') : 'none'}.`,
      );
    }
  }

  // ─── Queries ──────────────────────────────────────────────────────────────

  async findAll(filters: {
    status?: string;
    priority?: string;
    assignee?: string;
    search?: string;
    createdBy?: string;
  }) {
    const conditions: string[] = [];
    const params: unknown[]    = [];

    if (filters.status) {
      params.push(filters.status);
      conditions.push(`status = $${params.length}`);
    }
    if (filters.priority) {
      params.push(filters.priority);
      conditions.push(`priority = $${params.length}`);
    }
    if (filters.assignee) {
      params.push(filters.assignee);
      conditions.push(`assignee = $${params.length}`);
    }
    if (filters.createdBy) {
      params.push(filters.createdBy);
      conditions.push(`created_by = $${params.length}`);
    }
    if (filters.search) {
      params.push(`%${filters.search}%`);
      conditions.push(`(title ILIKE $${params.length} OR description ILIKE $${params.length})`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await db.query(
      `SELECT * FROM work_items ${where} ORDER BY created_at DESC`,
      params,
    );
    return rows.map(this.toWorkItem);
  }

  async findOne(id: string) {
    const { rows } = await db.query(
      'SELECT * FROM work_items WHERE id = $1',
      [id],
    );
    if (!rows[0]) throw new NotFoundException(`Work item ${id} not found`);
    return this.toWorkItem(rows[0]);
  }

  async create(dto: CreateWorkItemDto, user: RequestUser) {
    const { rows } = await db.query(
      `INSERT INTO work_items
         (title, description, type, status, priority, assignee, due_date, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        dto.title,
        dto.description ?? '',
        dto.type,
        dto.status ?? 'backlog',
        dto.priority,
        dto.assignee ?? null,
        dto.dueDate   ?? null,
        user.id,
      ],
    );
    return this.toWorkItem(rows[0]);
  }

  async update(id: string, dto: UpdateWorkItemDto) {
    // Build SET clause dynamically from provided fields only
    const fields: string[] = [];
    const params: unknown[] = [];

    const map: Record<string, unknown> = {
      title:       dto.title,
      description: dto.description,
      type:        dto.type,
      priority:    dto.priority,
      assignee:    dto.assignee,
      due_date:    dto.dueDate,
    };

    for (const [col, val] of Object.entries(map)) {
      if (val !== undefined) {
        params.push(val);
        fields.push(`${col} = $${params.length}`);
      }
    }

    if (!fields.length) {
      // Nothing to update — just return current state
      return this.findOne(id);
    }

    params.push(new Date().toISOString());
    fields.push(`updated_at = $${params.length}`);
    params.push(id);

    const { rows } = await db.query(
      `UPDATE work_items SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params,
    );
    if (!rows[0]) throw new NotFoundException(`Work item ${id} not found`);
    return this.toWorkItem(rows[0]);
  }

  async transitionStatus(id: string, newStatus: string) {
    const item = await this.findOne(id);

    this.validateTransition(item.status as string, newStatus);

    // QA readiness gate — enforced here before writing to DB
    if (newStatus === 'ready_for_release') {
      await this.assertQaReady(id);
    }

    const { rows } = await db.query(
      `UPDATE work_items
       SET status = $1, updated_at = $2
       WHERE id = $3
       RETURNING *`,
      [newStatus, new Date().toISOString(), id],
    );
    return this.toWorkItem(rows[0]);
  }

  async remove(id: string) {
    const { rowCount } = await db.query(
      'DELETE FROM work_items WHERE id = $1',
      [id],
    );
    if (!rowCount) throw new NotFoundException(`Work item ${id} not found`);
    return { deleted: true, id };
  }

  async summary() {
    const { rows } = await db.query(
      `SELECT status, COUNT(*)::int AS count FROM work_items GROUP BY status`,
    );
    const counts = Object.fromEntries(rows.map((r: { status: string; count: number }) => [r.status, r.count]));
    const [qa, releases] = await Promise.all([
      db.query('SELECT COUNT(*)::int AS count FROM qa_checks'),
      db.query('SELECT COUNT(*)::int AS count FROM release_notes'),
    ]);
    return {
      workItems: counts,
      qaChecks:  qa.rows[0].count,
      releases:  releases.rows[0].count,
    };
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  /** Throws if any QA check is not passed, or if there are none. */
  private async assertQaReady(workItemId: string): Promise<void> {
    const { rows } = await db.query(
      'SELECT status FROM qa_checks WHERE work_item_id = $1',
      [workItemId],
    );
    if (rows.length === 0) {
      throw new BadRequestException(
        'Work item has no QA checks. All QA checks must pass before marking as ready for release.',
      );
    }
    const notPassed = rows.filter((r: { status: string }) => r.status !== 'passed');
    if (notPassed.length > 0) {
      throw new BadRequestException(
        `${notPassed.length} QA check(s) are not passed. All must pass before marking as ready for release.`,
      );
    }
  }

  /** Maps a DB row (snake_case) to camelCase response shape. */
  private toWorkItem(row: Record<string, unknown>) {
    return {
      id:          row.id,
      title:       row.title,
      description: row.description,
      type:        row.type,
      status:      row.status,
      priority:    row.priority,
      assignee:    row.assignee,
      dueDate:     row.due_date,
      createdBy:   row.created_by,
      createdAt:   row.created_at,
      updatedAt:   row.updated_at,
    };
  }
}
