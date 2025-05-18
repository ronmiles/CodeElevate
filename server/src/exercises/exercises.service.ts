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

    // Step 1: Generate a human-like code review with bullet points
    const step1Prompt = `
      Your job is to review the following code submission and identify any issues or notable qualities.

      Exercise title: "${exercise.title}"

      Exercise description:
      ${exercise.description}

      Submitted code:
      \`\`\`${exercise.language?.name || 'code'}
      ${code}
      \`\`\`

      Your task:
      List clear, human-readable feedback points for this code that would help a learner improve or gain confidence. Focus only on **issues or praise**, not on line numbers.

      For each issue, include:
      - Type: error, suggestion, or praise
      - Severity: low, medium, or high
      - Your feedback: short and precise (max 200 characters)

      Also add a summary:
      - Strengths: what the code does well (max 200 chars)
      - Improvements: what should be fixed or added (max 200 chars)
      - Overall Assessment: your general impression (max 200 chars)

      Output format:
        {
          "comments": [
            {
              "lineRange": [<start_line>, <end_line>],
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

      Rules:
      - Don’t speculate — base your feedback only on what’s present in the code.
      - No duplicate comments.
      - Skip irrelevant boilerplate or unnecessary praise.
      - Comments must help the learner meaningfully.
    `;

    try {
      // Step 1: Get the human-readable review
      const rawReviewResponse = await this.llmService.generateText(step1Prompt);
      const reviewText = rawReviewResponse.content.trim();

      const step2Prompt = `
        You are a code review line-mapper and formatter.
        Your job is to take feedback points and check if they are valid for the original code, and make sure they are mapped to the correct line ranges.

        Original code:
        \`\`\`${exercise.language?.name || 'code'}
        ${code}
        \`\`\`

        Feedback to map:
        ${reviewText}

        Output format:
        {
          "comments": [
            {
              "lineRange": [<start_line>, <end_line>],
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

        Rules:
        - Carefully read the code to identify the line(s) responsible for each feedback point.
        - If the issue spans a block, place the comment on the first line that causes the problem.
        - Skip blank lines, comments, and braces unless the issue actually exists there.
        - Do not guess line numbers — assign them only if the feedback clearly maps to code.
        - Keep all fields under 200 characters.

        Return ONLY valid, parseable JSON — nothing else.`;

      const jsonResponse = await this.llmService.generateText(step2Prompt);
      console.log({ jsonResponse });
      let jsonStr = jsonResponse.content.trim();

      // Extract JSON from response
      const startIdx = jsonStr.indexOf('{');
      const endIdx = jsonStr.lastIndexOf('}');

      if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
        throw new Error('Invalid JSON response format');
      }

      jsonStr = jsonStr.substring(startIdx, endIdx + 1);

      // Parse and validate response
      let reviewResponse: {
        comments: Array<{
          lineRange: [number, number];
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
      if (!reviewResponse.comments || !Array.isArray(reviewResponse.comments)) {
        reviewResponse.comments = [];
      }

      if (!reviewResponse.summary) {
        reviewResponse.summary = {
          strengths: 'Good practices identified in your code.',
          improvements: 'Some improvements suggested to enhance quality.',
          overallAssessment: 'Overall assessment is positive.',
        };
      }

      // Process comments - validate format and types
      const validatedComments = reviewResponse.comments
        .map((comment) => ({
          lineRange:
            Array.isArray(comment.lineRange) && comment.lineRange.length === 2
              ? [
                  Math.min(comment.lineRange[0], comment.lineRange[1]),
                  Math.max(comment.lineRange[0], comment.lineRange[1]),
                ]
              : [1, 1],
          type: ['suggestion', 'error', 'praise'].includes(comment.type)
            ? comment.type
            : comment.type === 'issue'
            ? 'error'
            : 'suggestion',
          comment:
            typeof comment.comment === 'string'
              ? comment.comment
              : String(comment.comment || ''),
          severity: ['low', 'medium', 'high'].includes(comment.severity)
            ? comment.severity
            : comment.type === 'error'
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
        comments: validatedComments,
        summary: processedSummary,
      };
    } catch (error) {
      console.error(error);
      throw new BadRequestException(
        `Failed to generate code review: ${error.message}`
      );
    }
  }
}
