import { Module } from '@nestjs/common';
import { ExercisesController } from './exercises.controller';
import { ExercisesService } from './exercises.service';
import { ExercisesLLMService } from './exercises-llm.service';
import { PrismaModule } from '../prisma/prisma.module';
import { LLMModule } from '../llm/llm.module';

@Module({
  imports: [PrismaModule, LLMModule],
  controllers: [ExercisesController],
  providers: [ExercisesService, ExercisesLLMService],
})
export class ExercisesModule {}
