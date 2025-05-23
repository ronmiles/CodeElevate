import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateExerciseDto,
  UpdateProgressDto,
  DifficultyLevel,
} from './dto/exercises.dto';
import { ExercisesLLMService } from './exercises-llm.service';

@Injectable()
export class ExercisesService {
  constructor(
    private prisma: PrismaService,
    private exercisesLlmService: ExercisesLLMService
  ) {}

  async createExercise(userId: string, createExerciseDto: CreateExerciseDto) {
    if (!createExerciseDto.goalId) {
      throw new ForbiddenException('Goal ID is required');
    }

    // Verify that the goal belongs to the user
    const goal = await this.prisma.learningGoal.findFirst({
      where: {
        id: createExerciseDto.goalId,
        userId,
      },
    });

    if (!goal) {
      throw new ForbiddenException('Goal not found or does not belong to user');
    }

    const exerciseData = {
      title: createExerciseDto.title,
      description: createExerciseDto.description,
      difficulty: createExerciseDto.difficulty,
      language: createExerciseDto.language,
      initialCode: createExerciseDto.initialCode || '',
      solution: createExerciseDto.solution || '',
      hints: createExerciseDto.hints || [],
      testCases: createExerciseDto.testCases || {},
      user: {
        connect: { id: userId },
      },
      goal: {
        connect: { id: goal.id },
      },
      checkpoint: createExerciseDto.checkpointId
        ? {
            connect: { id: createExerciseDto.checkpointId },
          }
        : undefined,
    };

    return this.prisma.exercise.create({
      data: exerciseData,
      include: {
        goal: true,
      },
    });
  }

  async generateExercise(userId: string, goalId: string, checkpointId: string) {
    if (!goalId) {
      throw new ForbiddenException('Goal ID is required');
    }

    if (!checkpointId) {
      throw new ForbiddenException('Checkpoint ID is required');
    }

    const [goal, checkpoint] = await Promise.all([
      this.prisma.learningGoal.findFirst({
        where: { id: goalId, userId },
      }),
      this.prisma.checkpoint.findFirst({
        where: {
          id: checkpointId,
          roadmap: {
            goal: {
              userId,
              id: goalId,
            },
          },
        },
      }),
    ]);

    if (!goal || !checkpoint) {
      throw new NotFoundException('Goal or checkpoint not found');
    }

    if (!goal.language) {
      throw new NotFoundException('Goal has no language set');
    }

    try {
      const exerciseData = await this.exercisesLlmService.generateExercise(
        goal.title,
        checkpoint.title,
        checkpoint.description,
        goal.language
      );

      return this.createExercise(userId, {
        title: exerciseData.title,
        description: exerciseData.description,
        difficulty: DifficultyLevel.MEDIUM,
        language: goal.language,
        goalId: goal.id,
        checkpointId: checkpoint.id,
        initialCode: exerciseData.initialCode,
        solution: exerciseData.solution,
        hints: exerciseData.hints,
        testCases: exerciseData.testCases,
      });
    } catch (error) {
      throw new Error('Failed to generate exercise');
    }
  }

  async getUserExercises(userId: string) {
    return this.prisma.exercise.findMany({
      where: { userId },
      include: {
        goal: true,
        progress: {
          where: { userId },
          orderBy: { updatedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getExercise(userId: string, exerciseId: string) {
    const exercise = await this.prisma.exercise.findFirst({
      where: {
        id: exerciseId,
        userId,
      },
      include: {
        goal: true,
        progress: {
          where: { userId },
          orderBy: { updatedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!exercise) {
      throw new NotFoundException('Exercise not found');
    }

    return exercise;
  }

  async updateProgress(
    userId: string,
    exerciseId: string,
    updateProgressDto: UpdateProgressDto
  ) {
    // Verify exercise exists and belongs to user
    const exercise = await this.prisma.exercise.findFirst({
      where: {
        id: exerciseId,
        userId,
      },
      include: {
        checkpoint: true,
      },
    });

    if (!exercise) {
      throw new NotFoundException('Exercise not found');
    }

    // Prepare data with explicit typing
    const updateData = {
      status: updateProgressDto.status || undefined,
      code: updateProgressDto.code,
      attempts: { increment: 1 },
      completedAt: updateProgressDto.status === 'COMPLETED' ? new Date() : null,
    } as any; // Use type assertion for now

    // Add grade if provided
    if (updateProgressDto.grade !== undefined) {
      updateData.grade = updateProgressDto.grade;
    }

    const createData = {
      userId,
      exerciseId,
      status: updateProgressDto.status || 'IN_PROGRESS',
      code: updateProgressDto.code,
      attempts: 1,
      completedAt: updateProgressDto.status === 'COMPLETED' ? new Date() : null,
    } as any; // Use type assertion for now

    // Add grade if provided
    if (updateProgressDto.grade !== undefined) {
      createData.grade = updateProgressDto.grade;
    }

    // Create or update progress
    const progress = await this.prisma.progress.upsert({
      where: {
        userId_exerciseId: {
          userId,
          exerciseId,
        },
      },
      update: updateData,
      create: createData,
    });

    // If the exercise belongs to a checkpoint, update the checkpoint status
    if (exercise.checkpointId) {
      await this.updateCheckpointStatus(userId, exercise.checkpointId);
    }

    return progress;
  }

  // Helper method to update checkpoint status based on exercise progress
  private async updateCheckpointStatus(userId: string, checkpointId: string) {
    // Get all exercises for this checkpoint
    const exercises = await this.prisma.exercise.findMany({
      where: {
        checkpointId,
        userId,
      },
      include: {
        progress: {
          where: { userId },
          orderBy: { updatedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (exercises.length === 0) {
      return;
    }

    // Check if all exercises are completed with a passing grade
    const allCompleted = exercises.every(
      (ex) =>
        ex.progress &&
        ex.progress.length > 0 &&
        ex.progress[0].grade !== undefined &&
        ex.progress[0].grade >= 70
    );

    // Determine the new status
    let newStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

    if (allCompleted) {
      newStatus = 'COMPLETED';
    } else if (exercises.some((ex) => ex.progress && ex.progress.length > 0)) {
      newStatus = 'IN_PROGRESS';
    } else {
      newStatus = 'NOT_STARTED';
    }

    // Update the checkpoint status
    await this.prisma.checkpoint.update({
      where: { id: checkpointId },
      data: { status: newStatus },
    });
  }

  async getUserProgress(userId: string) {
    const progress = await this.prisma.progress.findMany({
      where: { userId },
      include: {
        exercise: {
          include: {
            goal: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Calculate statistics
    const stats = {
      totalExercises: progress.length,
      completed: progress.filter((p) => p.status === 'COMPLETED').length,
      inProgress: progress.filter((p) => p.status === 'IN_PROGRESS').length,
      byLanguage: {},
      byDifficulty: {},
    };

    progress.forEach((p) => {
      // Count by language
      const lang = p.exercise.language;
      if (!stats.byLanguage[lang]) {
        stats.byLanguage[lang] = { total: 0, completed: 0 };
      }
      stats.byLanguage[lang].total++;
      if (p.status === 'COMPLETED') {
        stats.byLanguage[lang].completed++;
      }

      // Count by difficulty
      const diff = p.exercise.difficulty;
      if (!stats.byDifficulty[diff]) {
        stats.byDifficulty[diff] = { total: 0, completed: 0 };
      }
      stats.byDifficulty[diff].total++;
      if (p.status === 'COMPLETED') {
        stats.byDifficulty[diff].completed++;
      }
    });

    return {
      progress,
      stats,
    };
  }

  async getCheckpointExercises(userId: string, checkpointId: string) {
    const checkpoint = await this.prisma.checkpoint.findFirst({
      where: {
        id: checkpointId,
        roadmap: {
          goal: {
            userId,
          },
        },
      },
    });

    if (!checkpoint) {
      throw new NotFoundException('Checkpoint not found');
    }

    return this.prisma.exercise.findMany({
      where: {
        userId,
        checkpointId,
      },
      include: {
        goal: true,
        checkpoint: true,
        progress: {
          where: { userId },
          orderBy: { updatedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async reviewCode(userId: string, exerciseId: string, code: string) {
    const exercise = await this.getExercise(userId, exerciseId);

    if (!exercise) {
      throw new NotFoundException(`Exercise not found`);
    }

    if (!code || code.trim() === '') {
      throw new BadRequestException('Code content is required');
    }

    try {
      return await this.exercisesLlmService.reviewCode(
        exercise.title,
        exercise.description,
        exercise.language || 'code',
        code
      );
    } catch (error) {
      console.error(error);
      throw new BadRequestException(
        `Failed to generate code review: ${error.message}`
      );
    }
  }

  async chatAboutReview(
    userId: string,
    exerciseId: string,
    message: string,
    code: string,
    reviewComments: any[]
  ) {
    const exercise = await this.getExercise(userId, exerciseId);

    if (!exercise) {
      throw new NotFoundException(`Exercise not found`);
    }

    if (!message || message.trim() === '') {
      throw new BadRequestException('Message is required');
    }

    try {
      return await this.exercisesLlmService.chatAboutReview(
        exercise.title,
        exercise.language || 'code',
        code,
        reviewComments,
        message
      );
    } catch (error) {
      throw new Error(`Failed to generate chat response: ${error.message}`);
    }
  }
}
