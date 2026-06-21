import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import type { RequestUser } from '../common/request-user';
import { ItWorkspaceService } from './it-workspace.service';
import { CreateWorkItemDto } from './dto/create-work-item.dto';
import { UpdateWorkItemDto } from './dto/update-work-item.dto';
import { TransitionStatusDto } from './dto/transition-status.dto';

@UseGuards(JwtAuthGuard)
@Controller('it-workspace')
export class ItWorkspaceController {
  constructor(private readonly workspace: ItWorkspaceService) {}

  // ─── Summary ──────────────────────────────────────────────────────────────

  @Get('summary')
  summary() {
    return this.workspace.summary();
  }

  // ─── Work Items ───────────────────────────────────────────────────────────

  @Post('work-items')
  create(
    @Body() body: CreateWorkItemDto,
    @CurrentUser() user: RequestUser,
  ) {
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
      status,
      priority,
      assignee,
      search,
      // ?mine=true filters to items created by the current user
      createdBy: mine === 'true' ? user?.id : undefined,
    });
  }

  @Get('work-items/:id')
  getOne(@Param('id') id: string) {
    return this.workspace.findOne(id);
  }

  @Patch('work-items/:id')
  update(
    @Param('id') id: string,
    @Body() body: UpdateWorkItemDto,
  ) {
    return this.workspace.update(id, body);
  }

  @Patch('work-items/:id/status')
  transition(
    @Param('id') id: string,
    @Body() body: TransitionStatusDto,
  ) {
    return this.workspace.transitionStatus(id, body.status);
  }

  @Delete('work-items/:id')
  remove(@Param('id') id: string) {
    return this.workspace.remove(id);
  }
}
