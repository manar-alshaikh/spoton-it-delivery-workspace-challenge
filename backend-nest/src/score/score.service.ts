import { Injectable } from '@nestjs/common';
import { db } from '../database/db';
import type { RequestUser } from '../common/request-user';

@Injectable()
export class ScoreService {

  async summaryFor(user: RequestUser) {
    const { rows } = await db.query(
      `SELECT id, action, entity_id, points, created_at
       FROM score_events
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [user.id],
    );
    const total = rows.reduce((sum: number, r: { points: number }) => sum + r.points, 0);
    return {
      total,
      events: rows.map((r: Record<string, unknown>) => ({
        id:        r.id,
        action:    r.action,
        entityId:  r.entity_id,
        points:    r.points,
        createdAt: r.created_at,
      })),
    };
  }

  /** Awards points — silently skips if this (user, action, entityId) combo was already awarded. */
  async award(user: RequestUser, action: string, points: number, entityId?: string) {
    const { rows } = await db.query(
      `INSERT INTO score_events (user_id, action, entity_id, points)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, action, entity_id) WHERE entity_id IS NOT NULL DO NOTHING
       RETURNING id, action, entity_id, points, created_at`,
      [user.id, action, entityId ?? null, points],
    );
    if (!rows[0]) return null; // duplicate — silently ignored
    return {
      id:        rows[0].id,
      action:    rows[0].action,
      entityId:  rows[0].entity_id,
      points:    rows[0].points,
      createdAt: rows[0].created_at,
    };
  }
}
