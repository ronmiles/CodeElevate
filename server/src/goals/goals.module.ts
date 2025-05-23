import { Module } from '@nestjs/common';
import { GoalsController } from './goals.controller';
import { GoalsService } from './goals.service';
import { GoalsLLMService } from './goals-llm.service';
import { PrismaModule } from '../prisma/prisma.module';
import { LLMModule } from '../llm/llm.module';

@Module({
  imports: [PrismaModule, LLMModule],
  controllers: [GoalsController],
  providers: [GoalsService, GoalsLLMService],
})
export class GoalsModule {}
