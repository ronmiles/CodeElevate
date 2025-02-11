import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { GoalsService } from './goals.service';
import { CreateGoalDto, UpdateGoalStatusDto } from './dto/goals.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('goals')
@UseGuards(JwtAuthGuard)
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Post()
  create(@Request() req, @Body() createGoalDto: CreateGoalDto) {
    return this.goalsService.create(req.user.id, createGoalDto);
  }

  @Get()
  findAll(@Request() req) {
    return this.goalsService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.goalsService.findOne(req.user.id, id);
  }

  @Patch(':id/status')
  updateStatus(
    @Request() req,
    @Param('id') id: string,
    @Body() updateGoalStatusDto: UpdateGoalStatusDto,
  ) {
    return this.goalsService.updateStatus(req.user.id, id, updateGoalStatusDto);
  }

  @Patch('checkpoints/:id/status')
  updateCheckpointStatus(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' },
  ) {
    return this.goalsService.updateCheckpointStatus(req.user.id, id, body.status);
  }
} 