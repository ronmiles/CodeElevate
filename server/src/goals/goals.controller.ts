import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Request,
  Put,
  Delete,
} from '@nestjs/common';
import { GoalsService } from './goals.service';
import { LearningMaterialsService } from './learningMaterials.service';
import {
  CreateGoalDto,
  UpdateGoalStatusDto,
  GenerateQuestionsDto,
  CreateCustomizedGoalDto,
} from './dto/goals.dto';
import {
  CreateLearningMaterialDto,
  UpdateLearningMaterialDto,
} from './dto/learningMaterial.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('goals')
@UseGuards(JwtAuthGuard)
export class GoalsController {
  constructor(
    private readonly goalsService: GoalsService,
    private readonly learningMaterialsService: LearningMaterialsService
  ) {}

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

  // Learning Materials Endpoints
  @Get('checkpoints/:checkpointId/learning-material')
  getLearningMaterial(
    @Request() req,
    @Param('checkpointId') checkpointId: string
  ) {
    return this.learningMaterialsService.getLearningMaterial(
      req.user.id,
      checkpointId
    );
  }

  @Post('checkpoints/:checkpointId/learning-material/generate')
  generateLearningMaterial(
    @Request() req,
    @Param('checkpointId') checkpointId: string
  ) {
    return this.learningMaterialsService.generateLearningMaterial(
      req.user.id,
      checkpointId
    );
  }

  @Get('checkpoints/:checkpointId/with-content')
  getCheckpointWithLearningMaterial(
    @Request() req,
    @Param('checkpointId') checkpointId: string
  ) {
    return this.learningMaterialsService.getCheckpointWithLearningMaterial(
      req.user.id,
      checkpointId
    );
  }

  @Post('learning-materials')
  createLearningMaterial(
    @Request() req,
    @Body() createLearningMaterialDto: CreateLearningMaterialDto
  ) {
    return this.learningMaterialsService.createLearningMaterial(
      req.user.id,
      createLearningMaterialDto
    );
  }

  @Put('learning-materials/:id')
  updateLearningMaterial(
    @Request() req,
    @Param('id') id: string,
    @Body() updateLearningMaterialDto: UpdateLearningMaterialDto
  ) {
    return this.learningMaterialsService.updateLearningMaterial(
      req.user.id,
      id,
      updateLearningMaterialDto
    );
  }

  @Delete('learning-materials/:id')
  deleteLearningMaterial(@Request() req, @Param('id') id: string) {
    return this.learningMaterialsService.deleteLearningMaterial(
      req.user.id,
      id
    );
  }

  @Post('checkpoints/:checkpointId/generate-content')
  generateLearningMaterialAndExercise(
    @Request() req,
    @Param('checkpointId') checkpointId: string
  ) {
    return this.learningMaterialsService.generateLearningMaterialAndExercise(
      req.user.id,
      checkpointId
    );
  }
}
