import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

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

export class CustomizationQuestion {
  @IsString()
  id: string;

  @IsString()
  question: string;

  @IsString()
  type: 'text' | 'select' | 'multiselect';

  @IsArray()
  @IsOptional()
  options?: string[];
}

export class CustomizationAnswer {
  @IsString()
  questionId: string;

  @IsString()
  answer: string;
}

export class GenerateQuestionsDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateCustomizedGoalDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  deadline?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomizationAnswer)
  customizationAnswers: CustomizationAnswer[];
}

export class UpdateGoalStatusDto {
  @IsEnum(GoalStatus)
  status: GoalStatus;
}
