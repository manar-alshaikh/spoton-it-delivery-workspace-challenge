import { IsIn } from 'class-validator';
import { ALL_STATUSES } from '../constants/workflow';

export class TransitionStatusDto {
  @IsIn(ALL_STATUSES)
  status!: string;
}
