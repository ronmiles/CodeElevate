import { IsString, IsArray, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CheckpointDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsNumber()
  order: number;
}

export class RoadmapDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckpointDto)
  checkpoints: CheckpointDto[];
} 