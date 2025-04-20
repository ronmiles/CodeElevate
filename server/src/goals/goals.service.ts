import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGoalDto, UpdateGoalStatusDto } from './dto/goals.dto';
import { RoadmapDto } from './dto/roadmap.dto';
import { LLMService } from '../llm/llm.service';

@Injectable()
export class GoalsService {
  constructor(private prisma: PrismaService, private llmService: LLMService) {}

  async create(userId: string, createGoalDto: CreateGoalDto) {
    // Get the default language (JavaScript)
    const defaultLanguage = await this.prisma.programmingLanguage.findFirst({
      where: { name: 'JavaScript' },
    });

    if (!defaultLanguage) {
      throw new Error('Default programming language not found');
    }

    // Create the goal
    const goal = await this.prisma.learningGoal.create({
      data: {
        ...createGoalDto,
        userId,
        status: 'NOT_STARTED',
        preferredLanguageId: defaultLanguage.id,
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
        preferredLanguage: true,
      },
    });
  }

  private async generateRoadmap(
    goalId: string,
    title: string,
    description?: string
  ) {
    const prompt = `Create a detailed learning roadmap for the following goal:
    Title: "${title}"
    ${description ? `Description: "${description}"` : ''}
    
    Create a step-by-step roadmap with checkpoints that will help the user achieve this goal.
    Each checkpoint should represent a specific milestone or concept to master.
    The checkpoints should be ordered logically, starting from basics and progressing to more advanced concepts.
    Each checkpoint's description should clearly explain what needs to be learned and why it's important.
    Keep the total number of checkpoints between 5-10 depending on the complexity of the goal.`;

    const schema = `{
      "checkpoints": [
        {
          "title": "string",
          "description": "string",
          "order": "number"
        }
      ]
    }`;

    try {
      const roadmapData = await this.llmService.generateJson<RoadmapDto>(
        prompt,
        schema
      );

      // Create the roadmap with checkpoints
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
    return this.prisma.learningGoal.findMany({
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
        preferredLanguage: true,
      },
    });

    if (!goal) {
      throw new NotFoundException(`Goal with ID ${goalId} not found`);
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
    });

    if (!checkpoint) {
      throw new NotFoundException('Checkpoint not found');
    }

    return this.prisma.checkpoint.update({
      where: { id: checkpointId },
      data: { status },
    });
  }

  async enhanceDescription(
    title: string,
    description?: string
  ): Promise<{ description: string }> {
    const prompt = `Create a proffesional description for a learning goal with the following information:
    
    Title: "${title}"
    ${description ? `Current Description: "${description}"` : ''}
    
    The description should:
    - Outline what the learner will gain from completing it
    - Be concise but professional
    ${
      description
        ? 'Use the current description as a foundation and enhance it.'
        : 'Create a complete description from scratch.'
    }
    
    Return your response as a JSON object with a single field called "description" containing the enhanced description text.`;

    const schema = `{
      "description": "string"
    }`;

    try {
      const result = await this.llmService.generateJson<{
        description: string;
      }>(prompt, schema);
      return { description: result.description.trim() };
    } catch (error) {
      console.error('Error enhancing goal description:', error);
      throw new Error('Failed to enhance goal description');
    }
  }
}
