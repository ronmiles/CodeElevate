import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ExercisesService } from './exercises.service';
import { CreateExerciseDto, UpdateProgressDto } from './dto/exercises.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('exercises')
@UseGuards(JwtAuthGuard)
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  @Post()
  create(@Request() req, @Body() createExerciseDto: CreateExerciseDto) {
    return this.exercisesService.createExercise(req.user.id, createExerciseDto);
  }

  @Post('generate')
  generateExercise(
    @Request() req,
    @Body('goalId') goalId: string,
    @Body('checkpointId') checkpointId: string
  ) {
    return this.exercisesService.generateExercise(
      req.user.id,
      goalId,
      checkpointId
    );
  }

  @Post(':id/review')
  reviewCode(
    @Request() req,
    @Param('id') id: string,
    @Body('code') code: string
  ) {
    return this.exercisesService.reviewCode(req.user.id, id, code);
  }

  @Get()
  findAll(@Request() req) {
    return this.exercisesService.getUserExercises(req.user.id);
  }

  @Get('checkpoint/:checkpointId')
  getCheckpointExercises(
    @Request() req,
    @Param('checkpointId') checkpointId: string
  ) {
    return this.exercisesService.getCheckpointExercises(
      req.user.id,
      checkpointId
    );
  }

  @Get('progress')
  getUserProgress(@Request() req) {
    return this.exercisesService.getUserProgress(req.user.id);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.exercisesService.getExercise(req.user.id, id);
  }

  @Post(':id/progress')
  updateProgress(
    @Request() req,
    @Param('id') id: string,
    @Body() updateProgressDto: UpdateProgressDto
  ) {
    return this.exercisesService.updateProgress(
      req.user.id,
      id,
      updateProgressDto
    );
  }
}
