import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateGoalDto,
  UpdateGoalStatusDto,
  GenerateQuestionsDto,
  CreateCustomizedGoalDto,
  CustomizationQuestion,
} from './dto/goals.dto';
import { GoalsLLMService } from './goals-llm.service';

@Injectable()
export class GoalsService {
  constructor(
    private prisma: PrismaService,
    private goalsLlmService: GoalsLLMService
  ) {}

  async generateCustomizationQuestions(
    generateQuestionsDto: GenerateQuestionsDto
  ): Promise<CustomizationQuestion[]> {
    return this.goalsLlmService.generateCustomizationQuestions(
      generateQuestionsDto.title,
      generateQuestionsDto.description
    );
  }

  async createCustomized(
    userId: string,
    createCustomizedGoalDto: CreateCustomizedGoalDto
  ) {
    // Detect the programming language from the title and description
    const detectedLanguage = await this.goalsLlmService.detectLanguage(
      createCustomizedGoalDto.title,
      createCustomizedGoalDto.description
    );

    // Create the goal
    const goal = await this.prisma.learningGoal.create({
      data: {
        title: createCustomizedGoalDto.title,
        description: createCustomizedGoalDto.description,
        deadline: createCustomizedGoalDto.deadline,
        userId,
        status: 'NOT_STARTED',
        language: detectedLanguage,
      },
    });

    // Generate and create the roadmap with customization answers
    await this.generateRoadmapWithCustomization(
      goal.id,
      goal.title,
      goal.description,
      createCustomizedGoalDto.customizationAnswers
    );

    return this.prisma.learningGoal.findUnique({
      where: { id: goal.id },
      include: {
        roadmap: {
          include: {
            checkpoints: {
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
      },
    });
  }

  async create(userId: string, createGoalDto: CreateGoalDto) {
    // Detect the programming language from the title and description
    const detectedLanguage = await this.goalsLlmService.detectLanguage(
      createGoalDto.title,
      createGoalDto.description
    );

    // Create the goal
    const goal = await this.prisma.learningGoal.create({
      data: {
        ...createGoalDto,
        userId,
        status: 'NOT_STARTED',
        language: detectedLanguage,
      },
    });

    // Generate and create the roadmap
    await this.generateRoadmap(goal.id, goal.title, goal.description);

    return this.prisma.learningGoal.findUnique({
      where: { id: goal.id },
      include: {
        roadmap: {
          include: {
            checkpoints: {
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
      },
    });
  }

  private async generateRoadmapWithCustomization(
    goalId: string,
    title: string,
    description?: string,
    customizationAnswers?: any[]
  ) {
    try {
      const roadmapData = await this.goalsLlmService.generateRoadmap(
        title,
        description,
        customizationAnswers
      );

      await this.prisma.roadmap.create({
        data: {
          goalId,
          checkpoints: {
            create: roadmapData.checkpoints.map((checkpoint) => ({
              ...checkpoint,
              status: 'NOT_STARTED',
            })),
          },
        },
      });
    } catch (error) {
      console.error('Error generating customized roadmap:', error);
      throw new Error('Failed to generate customized roadmap');
    }
  }

  private async generateRoadmap(
    goalId: string,
    title: string,
    description?: string
  ) {
    try {
      const roadmapData = await this.goalsLlmService.generateRoadmap(
        title,
        description
      );

      await this.prisma.roadmap.create({
        data: {
          goalId,
          checkpoints: {
            create: roadmapData.checkpoints.map((checkpoint) => ({
              ...checkpoint,
              status: 'NOT_STARTED',
            })),
          },
        },
      });
    } catch (error) {
      console.error('Error generating roadmap:', error);
      throw new Error('Failed to generate roadmap');
    }
  }

  async findAll(userId: string) {
    const goals = await this.prisma.learningGoal.findMany({
      where: {
        userId,
      },
      include: {
        roadmap: {
          include: {
            checkpoints: {
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Recalculate and persist status if out of sync
    for (const goal of goals) {
      const checkpoints = goal.roadmap?.checkpoints || [];
      if (checkpoints.length === 0) continue;

      const allCompleted = checkpoints.every((cp) => cp.status === 'COMPLETED');
      const anyStarted = checkpoints.some((cp) => cp.status !== 'NOT_STARTED');

      const computedStatus = allCompleted
        ? 'COMPLETED'
        : anyStarted
        ? 'IN_PROGRESS'
        : 'NOT_STARTED';

      if (goal.status !== computedStatus) {
        await this.prisma.learningGoal.update({
          where: { id: goal.id },
          data: { status: computedStatus },
        });
        (goal as any).status = computedStatus;
      }
    }

    return goals;
  }

  async findOne(userId: string, goalId: string) {
    const goal = await this.prisma.learningGoal.findFirst({
      where: {
        id: goalId,
        userId,
      },
      include: {
        roadmap: {
          include: {
            checkpoints: {
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
      },
    });

    if (!goal) {
      throw new NotFoundException(`Goal with ID ${goalId} not found`);
    }

    // Recalculate and persist status if out of sync
    const checkpoints = goal.roadmap?.checkpoints || [];
    if (checkpoints.length > 0) {
      const allCompleted = checkpoints.every((cp) => cp.status === 'COMPLETED');
      const anyStarted = checkpoints.some((cp) => cp.status !== 'NOT_STARTED');

      const computedStatus = allCompleted
        ? 'COMPLETED'
        : anyStarted
        ? 'IN_PROGRESS'
        : 'NOT_STARTED';

      if (goal.status !== computedStatus) {
        await this.prisma.learningGoal.update({
          where: { id: goal.id },
          data: { status: computedStatus },
        });
        (goal as any).status = computedStatus;
      }
    }

    return goal;
  }

  async updateStatus(
    userId: string,
    goalId: string,
    updateGoalStatusDto: UpdateGoalStatusDto
  ) {
    const goal = await this.prisma.learningGoal.findFirst({
      where: {
        id: goalId,
        userId,
      },
    });

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    return this.prisma.learningGoal.update({
      where: { id: goalId },
      data: {
        status: updateGoalStatusDto.status,
      },
      include: {
        roadmap: {
          include: {
            checkpoints: {
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
      },
    });
  }

  async updateCheckpointStatus(
    userId: string,
    checkpointId: string,
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
  ) {
    const checkpoint = await this.prisma.checkpoint.findFirst({
      where: {
        id: checkpointId,
        roadmap: {
          goal: {
            userId,
          },
        },
      },
      include: {
        roadmap: true,
      },
    });

    if (!checkpoint) {
      throw new NotFoundException('Checkpoint not found');
    }

    const updated = await this.prisma.checkpoint.update({
      where: { id: checkpointId },
      data: { status },
    });

    // Recompute and update goal status based on all checkpoint statuses
    if (checkpoint.roadmap && checkpoint.roadmap.goalId) {
      await this.updateGoalStatusFromCheckpoints(checkpoint.roadmap.goalId);
    }

    return updated;
  }

  async enhanceDescription(
    title: string,
    description?: string
  ): Promise<{ description: string }> {
    return this.goalsLlmService.enhanceDescription(title, description);
  }

  // Helper: recompute goal status from its checkpoints
  private async updateGoalStatusFromCheckpoints(goalId: string): Promise<void> {
    // Get all checkpoints for the goal and their statuses
    const checkpoints = await this.prisma.checkpoint.findMany({
      where: {
        roadmap: {
          goalId,
        },
      },
      select: { status: true },
    });

    if (checkpoints.length === 0) {
      return;
    }

    const allCompleted = checkpoints.every((cp) => cp.status === 'COMPLETED');
    const anyStarted = checkpoints.some((cp) => cp.status !== 'NOT_STARTED');

    const newStatus = allCompleted
      ? 'COMPLETED'
      : anyStarted
      ? 'IN_PROGRESS'
      : 'NOT_STARTED';

    // Update only if changed
    await this.prisma.learningGoal.update({
      where: { id: goalId },
      data: { status: newStatus },
    });
  }
}
