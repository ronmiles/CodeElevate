import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InsightsService } from './insights.service';

@Controller('insights')
@UseGuards(JwtAuthGuard)
export class InsightsController {
  constructor(private insights: InsightsService) {}

  @Get('dashboard')
  async getDashboard(@Request() req) {
    const data = await this.insights.getInsights(req.user.id);
    return (
      data || {
        strongPoints: [],
        skillsToStrengthen: [],
      }
    );
  }
}
