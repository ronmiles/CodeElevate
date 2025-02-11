import { Module } from '@nestjs/common';
import { GoalsController } from './goals.controller';
import { GoalsService } from './goals.service';
import { PrismaModule } from '../prisma/prisma.module';
import { LLMModule } from '../llm/llm.module';

@Module({
  imports: [PrismaModule, LLMModule],
  controllers: [GoalsController],
  providers: [GoalsService],
})
export class GoalsModule {} 