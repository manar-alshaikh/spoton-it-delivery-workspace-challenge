/**
 * Unit tests for ItWorkspaceService business logic.
 * No DB or NestJS container — pure function tests.
 */
import { BadRequestException } from '@nestjs/common';
import { ItWorkspaceService } from './it-workspace.service';
import { VALID_TRANSITIONS } from './constants/workflow';

// Minimal mock of ScoreService — we only test that it doesn't throw
const mockScoreService = { award: jest.fn().mockResolvedValue(null) };

function makeService() {
  return new ItWorkspaceService(mockScoreService as never);
}

describe('ItWorkspaceService.validateTransition', () => {
  let service: ItWorkspaceService;
  beforeEach(() => { service = makeService(); jest.clearAllMocks(); });

  // ── Valid transitions ────────────────────────────────────────────────────

  test.each([
    ['backlog',           'planned'],
    ['planned',           'in_progress'],
    ['planned',           'backlog'],
    ['in_progress',       'qa'],
    ['in_progress',       'planned'],
    ['qa',                'ready_for_release'],
    ['qa',                'in_progress'],
    ['ready_for_release', 'qa'],
  ])('allows %s → %s', (from, to) => {
    expect(() => service.validateTransition(from, to)).not.toThrow();
  });

  // ── Invalid transitions ───────────────────────────────────────────────────

  test.each([
    ['backlog',     'released',          'skip QA'],
    ['backlog',     'ready_for_release', 'skip QA and in_progress'],
    ['in_progress', 'released',          'skip QA and ready steps'],
    ['released',    'in_progress',       'no transitions from released'],
    ['released',    'backlog',           'no transitions from released'],
  ])('blocks %s → %s (%s)', (from, to) => {
    expect(() => service.validateTransition(from, to)).toThrow(BadRequestException);
  });

  // ── VALID_TRANSITIONS shape ───────────────────────────────────────────────

  it('has an entry for every status', () => {
    const statuses = ['backlog', 'planned', 'in_progress', 'qa', 'ready_for_release', 'released'];
    for (const s of statuses) {
      expect(VALID_TRANSITIONS[s]).toBeDefined();
    }
  });

  it('released status has no allowed transitions', () => {
    expect(VALID_TRANSITIONS['released']).toEqual([]);
  });
});
