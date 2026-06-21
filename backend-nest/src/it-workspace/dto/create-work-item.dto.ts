import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsIn,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { ALL_PRIORITIES, ALL_STATUSES, ALL_TYPES } from '../constants/workflow';

export class CreateWorkItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsIn(ALL_TYPES)
  type!: string;

  @IsIn(ALL_STATUSES)
  @IsOptional()
  status?: string; // defaults to 'backlog' in the service

  @IsIn(ALL_PRIORITIES)
  priority!: string;

  @IsString()
  @IsOptional()
  assignee?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;
}
