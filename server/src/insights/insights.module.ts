import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { LLMModule } from '../llm/llm.module';
import { InsightsService } from './insights.service';
import { InsightsController } from './insights.controller';

@Module({
  imports: [PrismaModule, LLMModule],
  providers: [InsightsService],
  controllers: [InsightsController],
})
export class InsightsModule {}
