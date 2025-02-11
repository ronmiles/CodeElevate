import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExerciseDto, UpdateProgressDto, DifficultyLevel } from './dto/exercises.dto';
import { LLMService } from '../llm/llm.service';
import { Prisma } from '@prisma/client';

interface GeneratedExercise {
  title: string;
  description: string;
  initialCode: string;
  solution: string;
  hints: string[];
  testCases: Array<{
    input: unknown;
    expectedOutput: unknown;
  }>;
}

@Injectable()
export class ExercisesService {
  constructor(
    private prisma: PrismaService,
    private llmService: LLMService,
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

    const exerciseData: Prisma.ExerciseCreateInput = {
      title: createExerciseDto.title,
      description: createExerciseDto.description,
      difficulty: createExerciseDto.difficulty,
      initialCode: createExerciseDto.initialCode || '',
      solution: createExerciseDto.solution || '',
      hints: createExerciseDto.hints || [],
      testCases: createExerciseDto.testCases || {},
      user: {
        connect: { id: userId }
      },
      goal: {
        connect: { id: goal.id }
      },
      checkpoint: createExerciseDto.checkpointId ? {
        connect: { id: createExerciseDto.checkpointId }
      } : undefined,
      language: {
        connect: { id: createExerciseDto.languageId }
      }
    };

    return this.prisma.exercise.create({
      data: exerciseData,
      include: {
        language: true,
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

    // Get the goal and checkpoint details
    const [goal, checkpoint] = await Promise.all([
      this.prisma.learningGoal.findFirst({
        where: { id: goalId, userId },
        include: { preferredLanguage: true },
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

    if (!goal.preferredLanguageId) {
      throw new NotFoundException('Goal has no preferred language set');
    }

    if (!goal.preferredLanguage) {
      throw new NotFoundException('Preferred language not found');
    }

    const schema = `{
      "type": "object",
      "required": ["title", "description", "initialCode", "solution", "hints", "testCases"],
      "properties": {
        "title": {
          "type": "string",
          "description": "A clear, concise title for the exercise"
        },
        "description": {
          "type": "string",
          "description": "Detailed problem description including requirements and constraints"
        },
        "initialCode": {
          "type": "string",
          "description": "Starting code template for the exercise"
        },
        "solution": {
          "type": "string",
          "description": "Complete solution code"
        },
        "hints": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "List of helpful hints for solving the exercise"
        },
        "testCases": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["input", "expectedOutput"],
            "properties": {
              "input": {
                "description": "Input value for the test case"
              },
              "expectedOutput": {
                "description": "Expected output for the test case"
              }
            }
          }
        }
      }
    }`;

    try {
      const systemPrompt = `You are a coding exercise generator. Your task is to create exercises that help users learn programming concepts.
      You must return a JSON object that strictly follows this schema:
      ${schema}

      Important rules:
      1. The exercise should be appropriate for the given programming language
      2. The difficulty should match the checkpoint's position in the learning journey
      3. Include clear examples in the description
      4. The initial code should provide a good starting point
      5. The solution should be complete and well-commented
      6. Hints should guide without giving away the solution
      7. Test cases should cover various scenarios
      8. All code must be valid and runnable in the specified language
      9. DO NOT include any explanatory text outside the JSON structure
      10. The response must be valid JSON that can be parsed`;

      const exerciseData = await this.llmService.generateJson<GeneratedExercise>(
        `${systemPrompt}

        Create a coding exercise for:
        Goal: "${goal.title}"
        Checkpoint: "${checkpoint.title}"
        Checkpoint Description: "${checkpoint.description}"
        Programming Language: ${goal.preferredLanguage.name}

        The exercise should help the user master this specific checkpoint.
        Make it challenging but achievable for someone at this stage in their learning journey.`,
        schema
      );

      // Create the exercise in the database
      return this.createExercise(userId, {
        title: exerciseData.title,
        description: exerciseData.description,
        difficulty: DifficultyLevel.MEDIUM,
        languageId: goal.preferredLanguageId,
        goalId: goal.id,
        checkpointId: checkpoint.id,
        initialCode: exerciseData.initialCode,
        solution: exerciseData.solution,
        hints: exerciseData.hints,
        testCases: exerciseData.testCases,
      });
    } catch (error) {
      console.error('Error generating exercise:', error);
      throw new Error('Failed to generate exercise');
    }
  }

  async getUserExercises(userId: string) {
    return this.prisma.exercise.findMany({
      where: { userId },
      include: {
        language: true,
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
        language: true,
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

  async updateProgress(userId: string, exerciseId: string, updateProgressDto: UpdateProgressDto) {
    // Verify exercise exists and belongs to user
    const exercise = await this.prisma.exercise.findFirst({
      where: {
        id: exerciseId,
        userId,
      },
    });

    if (!exercise) {
      throw new NotFoundException('Exercise not found');
    }

    // Create or update progress
    return this.prisma.progress.upsert({
      where: {
        userId_exerciseId: {
          userId,
          exerciseId,
        },
      },
      update: {
        ...updateProgressDto,
        attempts: { increment: 1 },
        completedAt: updateProgressDto.status === 'COMPLETED' ? new Date() : null,
      },
      create: {
        userId,
        exerciseId,
        ...updateProgressDto,
        attempts: 1,
        completedAt: updateProgressDto.status === 'COMPLETED' ? new Date() : null,
      },
    });
  }

  async getUserProgress(userId: string) {
    const progress = await this.prisma.progress.findMany({
      where: { userId },
      include: {
        exercise: {
          include: {
            language: true,
            goal: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Calculate statistics
    const stats = {
      totalExercises: progress.length,
      completed: progress.filter(p => p.status === 'COMPLETED').length,
      inProgress: progress.filter(p => p.status === 'IN_PROGRESS').length,
      byLanguage: {},
      byDifficulty: {},
    };

    progress.forEach(p => {
      // Count by language
      const lang = p.exercise.language.name;
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
        language: true,
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
} 