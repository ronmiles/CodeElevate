import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  IsObject,
} from 'class-validator';

export enum DifficultyLevel {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
  EXPERT = 'EXPERT',
}

export class CreateExerciseDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsEnum(DifficultyLevel)
  difficulty: DifficultyLevel;

  @IsString()
  language: string;

  @IsString()
  goalId: string;

  @IsString()
  @IsOptional()
  checkpointId?: string;

  @IsString()
  @IsOptional()
  initialCode?: string;

  @IsString()
  @IsOptional()
  solution?: string;

  @IsArray()
  @IsOptional()
  hints?: string[];

  @IsObject()
  @IsOptional()
  testCases?: Record<string, any>;
}

export class UpdateProgressDto {
  @IsEnum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'])
  @IsOptional()
  status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

  @IsString()
  @IsOptional()
  code?: string;

  @IsOptional()
  grade?: number;
}
