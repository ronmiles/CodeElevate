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

    // Create a prompt for the LLM to review the code
    const prompt = `
      You are an expert code reviewer for a coding education platform.
      You need to review this code submission for the exercise: "${
        exercise.title
      }".

      Exercise description: ${exercise.description}

      Code submitted:
      \`\`\`${exercise.language?.name || 'code'}
      ${code}
      \`\`\`

      Analyze the code for:
      1. Correctness: Does it meet the requirements?
      2. Logic: Are the algorithms and approaches appropriate?
      3. Style and best practices: Does it follow good coding practices?

      YOUR RESPONSE MUST BE VALID JSON WITH NO ADDITIONAL TEXT BEFORE OR AFTER THE JSON OBJECT.

      The response should be ONLY a JSON object with this structure and no additional text outside the JSON:
      {
        "logicBlocks": [
          {
            "description": "<brief description of what this logical block does>",
            "lineRange": [<start_line>, <end_line>],
            "feedback": "<detailed feedback about this logical section of code>",
            "type": "strength" | "improvement" | "critical",
            "severity": "low" | "medium" | "high"
          }
        ],
        "specificIssues": [
          {
            "line": <line number>,
            "type": "suggestion" | "error" | "praise",
            "comment": "<your detailed comment>",
            "severity": "low" | "medium" | "high"
          }
        ],
        "summary": {
          "strengths": "<a concise paragraph summarizing the code's strengths>",
          "improvements": "<a concise paragraph summarizing suggested improvements>",
          "overallAssessment": "<an overall assessment of the solution quality>"
        }
      }

      IMPORTANT GUIDELINES:
      - Use "logicBlocks" for multi-line code patterns and algorithmic concepts that span several lines:
        * "strength" type: For well-implemented algorithms or design patterns
        * "improvement" type: For working but suboptimal implementations that could be enhanced
        * "critical" type: For fundamentally flawed logic that needs major restructuring

      - Use "specificIssues" for individual line-level comments:
        * "praise" type: For excellent code practices, clever solutions, or optimal implementations
        * "suggestion" type: For style improvements, best practices, minor optimizations (use lightbulb icon)
        * "error" type: For bugs, syntax errors, incorrect implementations (use error icon)

      - Apply appropriate severity for each issue:
        * "high": Critical bugs or major issues that must be fixed immediately
        * "medium": Important improvements that should be addressed
        * "low": Minor enhancements or style suggestions

      - Do not duplicate feedback between logicBlocks and specificIssues
      - Be precise about line numbers in specificIssues
      - In logicBlocks, provide exact start and end line numbers
      - Never use "suggestion" type for actual errors or bugs - use "error" type instead
      - Keep feedback actionable and educational - explain why each issue matters
      - Include code examples in your feedback when appropriate

      The summary should be from the perspective of an experienced software engineer, highlighting overall patterns and providing a practical TL;DR of the review.

      Focus on being helpful, educational, and encouraging. Explain why certain practices are good or could be improved.

      IMPORTANT: Return ONLY the JSON object without any additional text or explanation.
    `;

    try {
      const rawResponse = await this.llmService.generateText(prompt);

      let jsonStr = rawResponse.content.trim();

      const startIdx = jsonStr.indexOf('{');
      const endIdx = jsonStr.lastIndexOf('}');

      if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
        throw new Error('Invalid JSON response format');
      }

      jsonStr = jsonStr.substring(startIdx, endIdx + 1);

      let reviewResponse: {
        logicBlocks: {
          description: string;
          lineRange: [number, number];
          feedback: string;
          type: string;
          severity: string;
        }[];
        specificIssues: {
          line: number;
          type: string;
          comment: string;
          severity: string;
        }[];
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
        // Create a default summary if one isn't provided
        reviewResponse.summary = {
          strengths:
            'The AI review identified some good practices in your code.',
          improvements:
            'Consider implementing the suggestions to improve your code quality.',
          overallAssessment:
            'The overall assessment of the solution quality is positive.',
        };
      }

      // Validate each specific issue
      const validatedIssues = reviewResponse.specificIssues.map((issue) => {
        // Ensure line is a number
        if (typeof issue.line !== 'number' || isNaN(issue.line)) {
          issue.line = 1; // Default to line 1 if invalid
        }

        // Ensure type is valid
        if (!['suggestion', 'error', 'praise'].includes(issue.type)) {
          // If it was "issue" in the response, convert it to "error" for consistency
          issue.type = issue.type === 'issue' ? 'error' : 'suggestion';
        }

        // Ensure severity is valid and appropriate for the type
        if (
          !issue.severity ||
          !['low', 'medium', 'high'].includes(issue.severity)
        ) {
          issue.severity =
            issue.type === 'error'
              ? 'high'
              : issue.type === 'suggestion'
              ? 'medium'
              : 'low';
        } else if (issue.type === 'praise' && issue.severity === 'high') {
          // Praise should never be high severity
          issue.severity = 'medium';
        } else if (issue.type === 'error' && issue.severity === 'low') {
          // Errors should never be low severity
          issue.severity = 'medium';
        }

        // Ensure comment is a string and has appropriate length
        if (typeof issue.comment !== 'string') {
          issue.comment = String(issue.comment);
        }

        // Make sure comments are not too long
        if (issue.comment.length > 500) {
          issue.comment = issue.comment.substring(0, 497) + '...';
        }

        return issue;
      });

      // Sort comments by line number
      const sortedIssues = validatedIssues.sort((a, b) => a.line - b.line);

      // Validate each logic block
      const validatedLogicBlocks = reviewResponse.logicBlocks.map((block) => {
        // Ensure description is a string
        if (typeof block.description !== 'string') {
          block.description = String(block.description);
        }

        // Make sure descriptions are not too long
        if (block.description.length > 100) {
          block.description = block.description.substring(0, 97) + '...';
        }

        // Ensure lineRange is a valid array of two numbers
        if (!Array.isArray(block.lineRange) || block.lineRange.length !== 2) {
          block.lineRange = [1, 1];
        } else {
          block.lineRange = [
            typeof block.lineRange[0] === 'number' ? block.lineRange[0] : 1,
            typeof block.lineRange[1] === 'number' ? block.lineRange[1] : 1,
          ];

          // Make sure start line <= end line
          if (block.lineRange[0] > block.lineRange[1]) {
            const temp = block.lineRange[0];
            block.lineRange[0] = block.lineRange[1];
            block.lineRange[1] = temp;
          }
        }

        // Ensure feedback is a string
        if (typeof block.feedback !== 'string') {
          block.feedback = String(block.feedback);
        }

        // Make sure feedback is not too long
        if (block.feedback.length > 800) {
          block.feedback = block.feedback.substring(0, 797) + '...';
        }

        // Ensure type is valid and convert old "issue" type to "critical"
        if (!['strength', 'improvement', 'critical'].includes(block.type)) {
          block.type = block.type === 'issue' ? 'critical' : 'improvement';
        }

        // Ensure severity is valid and appropriate for the type
        if (
          !block.severity ||
          !['low', 'medium', 'high'].includes(block.severity)
        ) {
          block.severity =
            block.type === 'critical'
              ? 'high'
              : block.type === 'improvement'
              ? 'medium'
              : 'low';
        } else if (block.type === 'strength' && block.severity === 'high') {
          // Strengths default to medium unless explicitly set lower
          block.severity = 'medium';
        } else if (block.type === 'critical' && block.severity === 'low') {
          // Critical blocks should never be low severity
          block.severity = 'medium';
        }

        return block;
      });

      // Sort logic blocks by starting line
      const sortedLogicBlocks = validatedLogicBlocks.sort(
        (a, b) => a.lineRange[0] - b.lineRange[0]
      );

      return {
        logicBlocks: sortedLogicBlocks,
        specificIssues: sortedIssues,
        summary: reviewResponse.summary,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to generate code review: ${error.message}`
      );
    }
  }
}
