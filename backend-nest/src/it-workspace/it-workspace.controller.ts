import {
  Body, Controller, Delete, Get, Param,
  Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import type { RequestUser } from '../common/request-user';
import { ItWorkspaceService } from './it-workspace.service';
import { CreateWorkItemDto } from './dto/create-work-item.dto';
import { UpdateWorkItemDto } from './dto/update-work-item.dto';
import { TransitionStatusDto } from './dto/transition-status.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateQaCheckDto } from './dto/create-qa-check.dto';
import { UpdateQaCheckDto } from './dto/update-qa-check.dto';
import { CreateReleaseDto } from './dto/create-release.dto';

@UseGuards(JwtAuthGuard)
@Controller('it-workspace')
export class ItWorkspaceController {
  constructor(private readonly workspace: ItWorkspaceService) {}

  // ─── Summary ──────────────────────────────────────────────────────────────

  @Get('summary')
  summary() { return this.workspace.summary(); }

  // ─── Work Items ───────────────────────────────────────────────────────────

  @Post('work-items')
  create(@Body() body: CreateWorkItemDto, @CurrentUser() user: RequestUser) {
    return this.workspace.create(body, user);
  }

  @Get('work-items')
  list(
    @Query('status')   status?: string,
    @Query('priority') priority?: string,
    @Query('assignee') assignee?: string,
    @Query('search')   search?: string,
    @Query('mine')     mine?: string,
    @CurrentUser()     user?: RequestUser,
  ) {
    return this.workspace.findAll({
      status, priority, assignee, search,
      createdBy: mine === 'true' ? user?.id : undefined,
    });
  }

  @Get('work-items/:id')
  getOne(@Param('id') id: string) { return this.workspace.findOne(id); }

  @Patch('work-items/:id')
  update(@Param('id') id: string, @Body() body: UpdateWorkItemDto) {
    return this.workspace.update(id, body);
  }

  @Patch('work-items/:id/status')
  transition(
    @Param('id') id: string,
    @Body() body: TransitionStatusDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.workspace.transitionStatus(id, body.status, user);
  }

  @Delete('work-items/:id')
  remove(@Param('id') id: string) { return this.workspace.remove(id); }

  // ─── Comments ─────────────────────────────────────────────────────────────

  @Get('work-items/:id/comments')
  comments(@Param('id') id: string) { return this.workspace.findComments(id); }

  @Post('work-items/:id/comments')
  addComment(
    @Param('id') id: string,
    @Body() body: CreateCommentDto,
    @CurrentUser() user: RequestUser,
  ) { return this.workspace.addComment(id, body.message, user); }

  // ─── QA Checks ───────────────────────────────────────────────────────────

  @Get('work-items/:id/qa-checks')
  listQaChecks(@Param('id') id: string) {
    return this.workspace.findQaChecks(id);
  }

  @Post('work-items/:id/qa-checks')
  createQaCheck(
    @Param('id') id: string,
    @Body() body: CreateQaCheckDto,
    @CurrentUser() user: RequestUser,
  ) { return this.workspace.createQaCheck(id, body, user); }

  @Patch('qa-checks/:checkId')
  updateQaCheck(
    @Param('checkId') checkId: string,
    @Body() body: UpdateQaCheckDto,
    @CurrentUser() user: RequestUser,
  ) { return this.workspace.updateQaCheck(checkId, body, user); }

  @Delete('qa-checks/:checkId')
  deleteQaCheck(@Param('checkId') checkId: string) {
    return this.workspace.deleteQaCheck(checkId);
  }

  // ─── Releases ────────────────────────────────────────────────────────────

  @Get('releases')
  listReleases() { return this.workspace.findReleases(); }

  @Post('releases')
  createRelease(@Body() body: CreateReleaseDto) {
    return this.workspace.createRelease(body);
  }

  @Get('releases/:id')
  getRelease(@Param('id') id: string) { return this.workspace.findRelease(id); }

  @Post('releases/:id/work-items')
  linkWorkItem(
    @Param('id') releaseId: string,
    @Body('workItemId') workItemId: string,
  ) { return this.workspace.linkWorkItem(releaseId, workItemId); }

  @Delete('releases/:id/work-items/:workItemId')
  unlinkWorkItem(
    @Param('id') releaseId: string,
    @Param('workItemId') workItemId: string,
  ) { return this.workspace.unlinkWorkItem(releaseId, workItemId); }

  @Post('releases/:id/deploy')
  deployRelease(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.workspace.deployRelease(id, user);
  }
}
