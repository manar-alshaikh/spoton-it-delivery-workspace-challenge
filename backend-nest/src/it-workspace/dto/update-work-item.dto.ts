import {
  IsString,
  IsOptional,
  IsIn,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { ALL_PRIORITIES, ALL_TYPES } from '../constants/workflow';

// All fields optional — PATCH semantics, only provided fields are updated.
// Status transitions are handled separately via PATCH /:id/status.
export class UpdateWorkItemDto {
  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsIn(ALL_TYPES)
  @IsOptional()
  type?: string;

  @IsIn(ALL_PRIORITIES)
  @IsOptional()
  priority?: string;

  @IsString()
  @IsOptional()
  assignee?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;
}
