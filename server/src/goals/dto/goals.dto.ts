import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';

export enum GoalStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ABANDONED = 'ABANDONED',
}

export class CreateGoalDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  deadline?: string;
}

export class UpdateGoalStatusDto {
  @IsEnum(GoalStatus)
  status: GoalStatus;
} 