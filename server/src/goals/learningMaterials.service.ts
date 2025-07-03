import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LearningMaterialsLLMService } from './learningMaterials-llm.service';
import {
  CreateLearningMaterialDto,
  UpdateLearningMaterialDto,
  LearningMaterialDto,
} from './dto/learningMaterial.dto';

@Injectable()
export class LearningMaterialsService {
  constructor(
    private prisma: PrismaService,
    private learningMaterialsLlmService: LearningMaterialsLLMService
  ) {}

  async createLearningMaterial(
    userId: string,
    createLearningMaterialDto: CreateLearningMaterialDto
  ) {
    // Verify that the checkpoint belongs to the user
    const checkpoint = await this.prisma.checkpoint.findFirst({
      where: {
        id: createLearningMaterialDto.checkpointId,
        roadmap: {
          goal: {
            userId,
          },
        },
      },
      include: {
        roadmap: {
          include: {
            goal: true,
          },
        },
      },
    });

    if (!checkpoint) {
      throw new ForbiddenException(
        'Checkpoint not found or does not belong to user'
      );
    }

    const learningMaterialData = {
      title: createLearningMaterialDto.learningMaterial.title,
      overview: createLearningMaterialDto.learningMaterial.overview,
      sections: createLearningMaterialDto.learningMaterial.sections as any,
      estimatedTimeMinutes:
        createLearningMaterialDto.learningMaterial.estimatedTimeMinutes,
      codeExamples: (createLearningMaterialDto.learningMaterial.codeExamples ||
        []) as any,
      checkpoint: {
        connect: { id: createLearningMaterialDto.checkpointId },
      },
    };

    return this.prisma.learningMaterial.create({
      data: learningMaterialData,
      include: {
        checkpoint: true,
      },
    });
  }

  async generateLearningMaterial(userId: string, checkpointId: string) {
    // Verify that the checkpoint belongs to the user
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
        roadmap: {
          include: {
            goal: true,
          },
        },
        learningMaterial: true,
      },
    });

    if (!checkpoint) {
      throw new NotFoundException('Checkpoint not found');
    }

    // Check if learning material already exists
    if (checkpoint.learningMaterial) {
      return checkpoint.learningMaterial;
    }

    if (!checkpoint.roadmap.goal.language) {
      throw new NotFoundException('Goal has no language set');
    }

    try {
      const learningMaterialData =
        await this.learningMaterialsLlmService.generateLearningMaterial(
          checkpoint.roadmap.goal.title,
          checkpoint.roadmap.goal.description || '',
          checkpoint.title,
          checkpoint.description,
          checkpoint.roadmap.goal.language
        );

      return this.createLearningMaterial(userId, {
        checkpointId: checkpoint.id,
        learningMaterial: learningMaterialData,
      });
    } catch (error) {
      console.error('Error generating learning material:', error);
      throw new Error('Failed to generate learning material');
    }
  }

  async getLearningMaterial(userId: string, checkpointId: string) {
    const learningMaterial = await this.prisma.learningMaterial.findFirst({
      where: {
        checkpointId,
        checkpoint: {
          roadmap: {
            goal: {
              userId,
            },
          },
        },
      },
      include: {
        checkpoint: {
          include: {
            roadmap: {
              include: {
                goal: true,
              },
            },
          },
        },
      },
    });

    if (!learningMaterial) {
      throw new NotFoundException('Learning material not found');
    }

    return learningMaterial;
  }

  async updateLearningMaterial(
    userId: string,
    learningMaterialId: string,
    updateLearningMaterialDto: UpdateLearningMaterialDto
  ) {
    // Verify that the learning material belongs to the user
    const existingMaterial = await this.prisma.learningMaterial.findFirst({
      where: {
        id: learningMaterialId,
        checkpoint: {
          roadmap: {
            goal: {
              userId,
            },
          },
        },
      },
    });

    if (!existingMaterial) {
      throw new NotFoundException('Learning material not found');
    }

    const updateData: any = {};

    if (updateLearningMaterialDto.learningMaterial) {
      const material = updateLearningMaterialDto.learningMaterial;
      if (material.title) updateData.title = material.title;
      if (material.overview) updateData.overview = material.overview;
      if (material.sections) updateData.sections = material.sections;
      if (material.estimatedTimeMinutes)
        updateData.estimatedTimeMinutes = material.estimatedTimeMinutes;
      if (material.codeExamples)
        updateData.codeExamples = material.codeExamples;
    }

    return this.prisma.learningMaterial.update({
      where: { id: learningMaterialId },
      data: updateData,
      include: {
        checkpoint: true,
      },
    });
  }

  async deleteLearningMaterial(userId: string, learningMaterialId: string) {
    // Verify that the learning material belongs to the user
    const existingMaterial = await this.prisma.learningMaterial.findFirst({
      where: {
        id: learningMaterialId,
        checkpoint: {
          roadmap: {
            goal: {
              userId,
            },
          },
        },
      },
    });

    if (!existingMaterial) {
      throw new NotFoundException('Learning material not found');
    }

    return this.prisma.learningMaterial.delete({
      where: { id: learningMaterialId },
    });
  }

  async getCheckpointWithLearningMaterial(
    userId: string,
    checkpointId: string
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
        learningMaterial: true,
        exercises: {
          include: {
            progress: {
              where: { userId },
              orderBy: { updatedAt: 'desc' },
              take: 1,
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        roadmap: {
          include: {
            goal: true,
          },
        },
      },
    });

    if (!checkpoint) {
      throw new NotFoundException('Checkpoint not found');
    }

    return checkpoint;
  }

  async generateLearningMaterialAndExercise(
    userId: string,
    checkpointId: string
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
        roadmap: {
          include: {
            goal: true,
          },
        },
        learningMaterial: true,
        exercises: true,
      },
    });

    if (!checkpoint) {
      throw new NotFoundException('Checkpoint not found');
    }

    if (!checkpoint.roadmap.goal.language) {
      throw new NotFoundException('Goal has no language set');
    }

    try {
      const combinedData =
        await this.learningMaterialsLlmService.generateCombinedContent(
          checkpoint.roadmap.goal.title,
          checkpoint.roadmap.goal.description || '',
          checkpoint.title,
          checkpoint.description,
          checkpoint.roadmap.goal.language
        );

      // Create learning material if it doesn't exist
      let learningMaterial;
      if (!checkpoint.learningMaterial) {
        learningMaterial = await this.createLearningMaterial(userId, {
          checkpointId: checkpoint.id,
          learningMaterial: combinedData.learningMaterial,
        });
      } else {
        learningMaterial = checkpoint.learningMaterial;
      }

      return {
        learningMaterial,
        exerciseData: combinedData.exercise,
      };
    } catch (error) {
      console.error('Error generating combined content:', error);
      throw new Error('Failed to generate combined content');
    }
  }
}
