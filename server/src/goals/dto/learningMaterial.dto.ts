import {
  IsString,
  IsArray,
  IsNumber,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class LearningMaterialSectionDto {
  @IsString()
  heading: string;

  @IsString()
  body: string;
}

export class CodeExampleDto {
  @IsString()
  language: string;

  @IsString()
  code: string;

  @IsString()
  explanation: string;
}

export class LearningMaterialDto {
  @IsString()
  title: string;

  @IsString()
  overview: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LearningMaterialSectionDto)
  sections: LearningMaterialSectionDto[];

  @IsNumber()
  estimatedTimeMinutes: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CodeExampleDto)
  @IsOptional()
  codeExamples?: CodeExampleDto[];
}

export class CreateLearningMaterialDto {
  @IsString()
  checkpointId: string;

  @ValidateNested()
  @Type(() => LearningMaterialDto)
  learningMaterial: LearningMaterialDto;
}

export class UpdateLearningMaterialDto {
  @ValidateNested()
  @Type(() => LearningMaterialDto)
  @IsOptional()
  learningMaterial?: LearningMaterialDto;
}
