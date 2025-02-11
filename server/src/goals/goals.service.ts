import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGoalDto, UpdateGoalStatusDto } from './dto/goals.dto';

@Injectable()
export class GoalsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createGoalDto: CreateGoalDto) {
    return this.prisma.learningGoal.create({
      data: {
        ...createGoalDto,
        userId,
        status: 'NOT_STARTED',
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.learningGoal.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updateStatus(userId: string, goalId: string, updateGoalStatusDto: UpdateGoalStatusDto) {
    // First check if the goal exists and belongs to the user
    const goal = await this.prisma.learningGoal.findUnique({
      where: { id: goalId },
    });

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    if (goal.userId !== userId) {
      throw new ForbiddenException('You can only update your own goals');
    }

    return this.prisma.learningGoal.update({
      where: { id: goalId },
      data: {
        status: updateGoalStatusDto.status,
      },
    });
  }
} 