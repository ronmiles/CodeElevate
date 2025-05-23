import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGoalDto, UpdateGoalStatusDto } from './dto/goals.dto';
import { RoadmapDto } from './dto/roadmap.dto';
import { LLMService } from '../llm/llm.service';

@Injectable()
export class GoalsService {
  constructor(private prisma: PrismaService, private llmService: LLMService) {}

  async create(userId: string, createGoalDto: CreateGoalDto) {
    // Detect the programming language from the title and description
    const detectedLanguage = await this.detectLanguage(
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

  private async detectLanguage(
    title: string,
    description?: string
  ): Promise<string> {
    const prompt = `Analyze the following learning goal and determine the most appropriate programming language for it.

    Title: "${title}"
    ${description ? `Description: "${description}"` : ''}

    Consider common programming languages and determine which one best fits this goal based on the technologies, frameworks, or concepts mentioned.

    Available programming languages:
    JavaScript, Python, Java, C++, C#, Go, Rust, TypeScript, PHP, Ruby, Swift, Kotlin, Scala, R, HTML/CSS, SQL

    You MUST select one specific programming language from the list above. If the goal is general or doesn't clearly specify a language, choose JavaScript as it's the most versatile for beginners.

    Return only the programming language name.`;

    const schema = `{
      "language": "string"
    }`;

    const response = await this.llmService.generateJson<{ language: string }>(
      prompt,
      schema
    );

    const detectedLanguage = response.language?.trim();

    const languageMap: Record<string, string> = {
      javascript: 'JavaScript',
      python: 'Python',
      java: 'Java',
      'c++': 'C++',
      'c#': 'C#',
      csharp: 'C#',
      go: 'Go',
      golang: 'Go',
      rust: 'Rust',
      typescript: 'TypeScript',
      php: 'PHP',
      ruby: 'Ruby',
      swift: 'Swift',
      kotlin: 'Kotlin',
      scala: 'Scala',
      r: 'R',
      html: 'HTML/CSS',
      css: 'HTML/CSS',
      sql: 'SQL',
    };

    return languageMap[detectedLanguage.toLowerCase()] ?? 'JavaScript';
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
