import { IsDateString, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

const DEPLOYMENT_STATUSES = ['draft', 'scheduled', 'deployed', 'rolled_back'] as const;

export class CreateReleaseDto {
  @IsString()
  @IsNotEmpty()
  version!: string;

  @IsString()
  @IsOptional()
  summary?: string;

  @IsDateString()
  @IsOptional()
  releaseDate?: string;

  @IsIn(DEPLOYMENT_STATUSES)
  @IsOptional()
  deploymentStatus?: string;
}
