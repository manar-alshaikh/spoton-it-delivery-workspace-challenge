import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import type { RequestUser } from '../common/request-user';
import { ScoreService } from './score.service';

class AwardScoreDto {
  @IsString()
  action!: string;

  @IsInt()
  @Min(1)
  @Max(20)
  points!: number;

  @IsString()
  @IsOptional()
  entityId?: string;
}

@UseGuards(JwtAuthGuard)
@Controller('score')
export class ScoreController {
  constructor(private readonly score: ScoreService) {}

  @Get('me')
  me(@CurrentUser() user: RequestUser) {
    return this.score.summaryFor(user);
  }

  @Post('events')
  award(@CurrentUser() user: RequestUser, @Body() body: AwardScoreDto) {
    return this.score.award(user, body.action, body.points, body.entityId);
  }
}
