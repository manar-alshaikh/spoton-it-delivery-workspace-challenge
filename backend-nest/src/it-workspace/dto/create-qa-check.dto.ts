import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateQaCheckDto {
  @IsString()
  @IsNotEmpty()
  testTitle!: string;

  @IsString()
  @IsOptional()
  expectedResult?: string;

  @IsString()
  @IsOptional()
  actualResult?: string;

  @IsString()
  @IsOptional()
  tester?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
