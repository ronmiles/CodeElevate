import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { GoalsService } from './goals.service';
import {
  CreateGoalDto,
  UpdateGoalStatusDto,
  GenerateQuestionsDto,
  CreateCustomizedGoalDto,
} from './dto/goals.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('goals')
@UseGuards(JwtAuthGuard)
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Post()
  create(@Request() req, @Body() createGoalDto: CreateGoalDto) {
    return this.goalsService.create(req.user.id, createGoalDto);
  }

  @Post('generate-questions')
  generateQuestions(
    @Request() req,
    @Body() generateQuestionsDto: GenerateQuestionsDto
  ) {
    return this.goalsService.generateCustomizationQuestions(
      generateQuestionsDto
    );
  }

  @Post('create-customized')
  createCustomized(
    @Request() req,
    @Body() createCustomizedGoalDto: CreateCustomizedGoalDto
  ) {
    return this.goalsService.createCustomized(
      req.user.id,
      createCustomizedGoalDto
    );
  }

  @Post('enhance-description')
  enhanceDescription(
    @Request() req,
    @Body() data: { title: string; description?: string }
  ) {
    return this.goalsService.enhanceDescription(data.title, data.description);
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
    @Body() updateGoalStatusDto: UpdateGoalStatusDto
  ) {
    return this.goalsService.updateStatus(req.user.id, id, updateGoalStatusDto);
  }

  @Patch('checkpoints/:id/status')
  updateCheckpointStatus(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' }
  ) {
    return this.goalsService.updateCheckpointStatus(
      req.user.id,
      id,
      body.status
    );
  }
}
