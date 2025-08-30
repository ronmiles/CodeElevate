import { Module } from '@nestjs/common';
import { GoalsController } from './goals.controller';
import { GoalsService } from './goals.service';
import { GoalsLLMService } from './goals-llm.service';
import { LearningMaterialsService } from './learningMaterials.service';
import { LearningMaterialsLLMService } from './learningMaterials-llm.service';
import { PrismaModule } from '../prisma/prisma.module';
import { LLMModule } from '../llm/llm.module';

@Module({
  imports: [PrismaModule, LLMModule],
  controllers: [GoalsController],
  providers: [
    GoalsService,
    GoalsLLMService,
    LearningMaterialsService,
    LearningMaterialsLLMService,
  ],
})
export class GoalsModule {}
