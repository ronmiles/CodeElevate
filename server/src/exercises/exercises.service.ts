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
  constructor(private prisma: PrismaService, private llmService: LLMService) {}

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
      language: {
        connect: { id: createExerciseDto.languageId },
      },
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

      const exerciseData =
        await this.llmService.generateJson<GeneratedExercise>(
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
        completedAt:
          updateProgressDto.status === 'COMPLETED' ? new Date() : null,
      },
      create: {
        userId,
        exerciseId,
        ...updateProgressDto,
        attempts: 1,
        completedAt:
          updateProgressDto.status === 'COMPLETED' ? new Date() : null,
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
      completed: progress.filter((p) => p.status === 'COMPLETED').length,
      inProgress: progress.filter((p) => p.status === 'IN_PROGRESS').length,
      byLanguage: {},
      byDifficulty: {},
    };

    progress.forEach((p) => {
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

  async reviewCode(userId: string, exerciseId: string, code: string) {
    const exercise = await this.getExercise(userId, exerciseId);

    if (!exercise) {
      throw new NotFoundException(`Exercise not found`);
    }

    if (!code || code.trim() === '') {
      throw new BadRequestException('Code content is required');
    }

    // Create a prompt for the LLM to review the code - simplified
    const prompt = `
      You are an expert code reviewer for a coding education platform.
      Review this code submission for the exercise: "${exercise.title}".

      Exercise description: ${exercise.description}

      Code submitted:
      \`\`\`${exercise.language?.name || 'code'}
      ${code}
      \`\`\`

      Analyze for correctness, logic, and best practices.

      Return ONLY a JSON object with this structure:
      {
        "logicBlocks": [
          {
            "description": "<brief description>",
            "lineRange": [<start_line>, <end_line>],
            "feedback": "<concise feedback>",
            "type": "strength|improvement|critical",
            "severity": "low|medium|high"
          }
        ],
        "specificIssues": [
          {
            "line": <line number>,
            "type": "suggestion|error|praise",
            "comment": "<brief comment>",
            "severity": "low|medium|high"
          }
        ],
        "summary": {
          "strengths": "<concise summary of strengths>",
          "improvements": "<concise summary of improvements>",
          "overallAssessment": "<brief overall assessment>"
        }
      }

      IMPORTANT CHARACTER LIMITS:
      - description: maximum 50 characters - do not exceed this limit
      - feedback: maximum 200 characters - do not exceed this limit
      - comment: maximum 200 characters - do not exceed this limit
      - strengths/improvements/overallAssessment: maximum 200 characters each - do not exceed these limits

      DO NOT write content that exceeds these limits. Rather than using ellipsis (...) to truncate, craft complete thoughts within the character limits.`;

    try {
      const rawResponse = await this.llmService.generateText(prompt);
      let jsonStr = rawResponse.content.trim();

      // Extract JSON from response
      const startIdx = jsonStr.indexOf('{');
      const endIdx = jsonStr.lastIndexOf('}');

      if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
        throw new Error('Invalid JSON response format');
      }

      jsonStr = jsonStr.substring(startIdx, endIdx + 1);

      // Parse and validate response
      let reviewResponse: {
        logicBlocks: Array<{
          description: string;
          lineRange: [number, number];
          feedback: string;
          type: string;
          severity: string;
        }>;
        specificIssues: Array<{
          line: number;
          type: string;
          comment: string;
          severity: string;
        }>;
        summary: {
          strengths: string;
          improvements: string;
          overallAssessment: string;
        };
      };

      try {
        reviewResponse = JSON.parse(jsonStr);
      } catch (parseError) {
        throw new Error(`Failed to parse JSON: ${parseError.message}`);
      }

      // Ensure all required properties exist with defaults if missing
      if (
        !reviewResponse.logicBlocks ||
        !Array.isArray(reviewResponse.logicBlocks)
      ) {
        reviewResponse.logicBlocks = [];
      }

      if (
        !reviewResponse.specificIssues ||
        !Array.isArray(reviewResponse.specificIssues)
      ) {
        reviewResponse.specificIssues = [];
      }

      if (!reviewResponse.summary) {
        reviewResponse.summary = {
          strengths: 'Good practices identified in your code.',
          improvements: 'Some improvements suggested to enhance quality.',
          overallAssessment: 'Overall assessment is positive.',
        };
      }

      // Process specific issues - simplified validation without truncation
      const validatedIssues = reviewResponse.specificIssues
        .map((issue) => ({
          line:
            typeof issue.line === 'number' && !isNaN(issue.line)
              ? issue.line
              : 1,
          type: ['suggestion', 'error', 'praise'].includes(issue.type)
            ? issue.type
            : issue.type === 'issue'
            ? 'error'
            : 'suggestion',
          comment:
            typeof issue.comment === 'string'
              ? issue.comment
              : String(issue.comment || ''),
          severity: ['low', 'medium', 'high'].includes(issue.severity)
            ? issue.severity
            : issue.type === 'error'
            ? 'high'
            : 'medium',
        }))
        .sort((a, b) => a.line - b.line);

      // Process logic blocks - simplified validation without truncation
      const validatedLogicBlocks = reviewResponse.logicBlocks
        .map((block) => ({
          description:
            typeof block.description === 'string'
              ? block.description
              : String(block.description || ''),
          lineRange:
            Array.isArray(block.lineRange) && block.lineRange.length === 2
              ? [
                  Math.min(block.lineRange[0], block.lineRange[1]),
                  Math.max(block.lineRange[0], block.lineRange[1]),
                ]
              : [1, 1],
          feedback:
            typeof block.feedback === 'string'
              ? block.feedback
              : String(block.feedback || ''),
          type: ['strength', 'improvement', 'critical'].includes(block.type)
            ? block.type
            : block.type === 'issue'
            ? 'critical'
            : 'improvement',
          severity: ['low', 'medium', 'high'].includes(block.severity)
            ? block.severity
            : block.type === 'critical'
            ? 'high'
            : 'medium',
        }))
        .sort((a, b) => a.lineRange[0] - b.lineRange[0]);

      // Use summary without truncation
      const processedSummary = {
        strengths:
          typeof reviewResponse.summary.strengths === 'string'
            ? reviewResponse.summary.strengths
            : 'Code has good aspects.',
        improvements:
          typeof reviewResponse.summary.improvements === 'string'
            ? reviewResponse.summary.improvements
            : 'Some improvements possible.',
        overallAssessment:
          typeof reviewResponse.summary.overallAssessment === 'string'
            ? reviewResponse.summary.overallAssessment
            : 'Overall assessment is positive.',
      };

      return {
        logicBlocks: validatedLogicBlocks,
        specificIssues: validatedIssues,
        summary: processedSummary,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to generate code review: ${error.message}`
      );
    }
  }
}
