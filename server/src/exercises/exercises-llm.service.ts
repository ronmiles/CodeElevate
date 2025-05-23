import { Injectable } from '@nestjs/common';
import { LLMService } from '../llm/llm.service';

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

interface CodeReviewResponse {
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
  score: number;
}

@Injectable()
export class ExercisesLLMService {
  constructor(private llmService: LLMService) {}

  async generateExercise(
    goalTitle: string,
    checkpointTitle: string,
    checkpointDescription: string,
    language: string
  ): Promise<GeneratedExercise> {
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

    const prompt = `${systemPrompt}

    Create a coding exercise for:
    Goal: "${goalTitle}"
    Checkpoint: "${checkpointTitle}"
    Checkpoint Description: "${checkpointDescription}"
    Programming Language: ${language}

    The exercise should help the user master this specific checkpoint.
    Make it challenging but achievable for someone at this stage in their learning journey.`;

    try {
      const exerciseData =
        await this.llmService.generateJson<GeneratedExercise>(prompt, schema);

      return exerciseData;
    } catch (error) {
      console.error('Error generating exercise:', error);
      throw new Error('Failed to generate exercise');
    }
  }

  async reviewCode(
    exerciseTitle: string,
    exerciseDescription: string,
    language: string,
    code: string
  ): Promise<CodeReviewResponse> {
    // Step 1: Generate a human-like code review with bullet points
    const step1Prompt = `
      Your job is to review the following code submission and identify any issues or notable qualities.

      Exercise title: "${exerciseTitle}"

      Exercise description:
      ${exerciseDescription}

      Submitted code:
      \`\`\`${language || 'code'}
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
      - Don't speculate — base your feedback only on what's present in the code.
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
        \`\`\`${language || 'code'}
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
          },
          "score": <number between 0 and 100>
        }

        Calculate a score from 0 to 100 based on:
          * Correctness (does the code fulfill the exercise requirements?)
          * Code quality (readability, organization, naming)
          * Efficiency (algorithmic approach, performance concerns)
          * Number and severity of errors and suggestions
          * Extra points for creative solutions and best practices
          * A perfect score of 100 means the code is excellent with no issues.
          * A score below 60 indicates major issues that need to be fixed.
          * Dont be to hard on the score, the user is still learning.

        Rules:
        - Carefully read the code to identify the line(s) responsible for each feedback point.
        - If the issue spans a block, place the comment on the first line that causes the problem.
        - Skip blank lines, comments, and braces unless the issue actually exists there.
        - Do not guess line numbers — assign them only if the feedback clearly maps to code.
        - Keep all fields under 200 characters.

        Return ONLY valid, parseable JSON — nothing else.`;

      const jsonResponse = await this.llmService.generateText(step2Prompt);
      let jsonStr = jsonResponse.content.trim();

      // Extract JSON from response
      const startIdx = jsonStr.indexOf('{');
      const endIdx = jsonStr.lastIndexOf('}');

      if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
        throw new Error('Invalid JSON response format');
      }

      jsonStr = jsonStr.substring(startIdx, endIdx + 1);

      // Parse and validate response
      let reviewResponse: CodeReviewResponse;

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

      // Ensure score is valid, default to 70 if missing or invalid
      if (
        typeof reviewResponse.score !== 'number' ||
        reviewResponse.score < 0 ||
        reviewResponse.score > 100
      ) {
        reviewResponse.score = 70;
      }

      // Process comments - validate format and types
      const validatedComments = reviewResponse.comments
        .map((comment) => ({
          lineRange:
            Array.isArray(comment.lineRange) && comment.lineRange.length === 2
              ? [
                  Math.min(comment.lineRange[0], comment.lineRange[1]),
                  Math.max(comment.lineRange[0], comment.lineRange[1]),
                ] as [number, number]
              : [1, 1] as [number, number],
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
        score: Math.round(reviewResponse.score),
      };
    } catch (error) {
      console.error(error);
      throw new Error(`Failed to generate code review: ${error.message}`);
    }
  }

  async chatAboutReview(
    exerciseTitle: string,
    language: string,
    code: string,
    reviewComments: any[],
    message: string
  ): Promise<{ response: string }> {
    const commentsSummary = reviewComments
      .map(
        (comment) =>
          `- Line ${comment.lineRange[0]}-${
            comment.lineRange[1]
          }: ${comment.type.toUpperCase()} (${comment.severity}): ${
            comment.comment
          }`
      )
      .join('\n');

    // Create prompt for the chat assistant
    const chatPrompt = `
      You are a helpful coding assistant specifically addressing questions about a code review.

      Exercise: "${exerciseTitle}"

      The user has submitted code in ${
        language || 'a programming language'
      } and received a review.

      Submitted code:
      \`\`\`${language || 'code'}
      ${code}
      \`\`\`

      Review comments:
      ${commentsSummary}

      User's question: "${message}"

      Your task:
      - Answer the user's specific question about the code or the review
      - Address technical concepts mentioned in the review
      - If the user asks about fixing issues, provide helpful guidance
      - Focus ONLY on the code and review - do not discuss unrelated topics
      - Be concise but complete with your explanations
      - If asked about code modifications, provide specific examples
      - If unsure about details not mentioned in the review, say so rather than speculating

      IMPORTANT: DO NOT include any thinking process or reasoning in your response. DO NOT use <think> tags or similar.
      Provide ONLY the final answer directly addressing the user's question.

      Keep your response professional, supportive, educational, and to-the-point.
    `;

    try {
      const response = await this.llmService.generateText(chatPrompt);
      let cleanResponse = response.content.trim();

      // Remove <think> tags and their content
      cleanResponse = cleanResponse.replace(/<think>[\s\S]*?<\/think>/g, '');

      // Clean up any other potential thinking indicators
      cleanResponse = cleanResponse.replace(
        /^(Thinking:|I need to|Let me think|Let's analyze|My thought process:).*$/gm,
        ''
      );

      return { response: cleanResponse.trim() };
    } catch (error) {
      throw new Error(`Failed to generate chat response: ${error.message}`);
    }
  }
}
