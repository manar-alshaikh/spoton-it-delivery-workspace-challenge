import { IsIn, IsOptional, IsString } from 'class-validator';

const QA_STATUSES = ['pending', 'passed', 'failed'] as const;

export class UpdateQaCheckDto {
  @IsString()
  @IsOptional()
  testTitle?: string;

  @IsString()
  @IsOptional()
  expectedResult?: string;

  @IsString()
  @IsOptional()
  actualResult?: string;

  @IsIn(QA_STATUSES)
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  tester?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
