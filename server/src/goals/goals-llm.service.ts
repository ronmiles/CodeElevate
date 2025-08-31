import { Injectable } from '@nestjs/common';
import { LLMService } from '../llm/llm.service';
import { RoadmapDto } from './dto/roadmap.dto';
import { CustomizationQuestion, CustomizationAnswer } from './dto/goals.dto';

@Injectable()
export class GoalsLLMService {
  constructor(private llmService: LLMService) {}

  async generateCustomizationQuestions(
    title: string,
    description?: string
  ): Promise<CustomizationQuestion[]> {
    const prompt = `Based on the following learning goal, generate 5 personalized follow-up questions that will help customize the learning experience for the user:

    Title: "${title}"
    ${description ? `Description: "${description}"` : ''}

    Generate questions that help understand:
    1. How deep/comprehensive they want their learning to be
    2. Available time commitment for practicing exercises
    3. Current programming experience (if any, follow up with languages)
    4. Preferred difficulty progression (gradual vs challenging)
    5. Specific focus areas within the topic

    QUESTION REQUIREMENTS:
    - ALWAYS prefer "select" or "multiselect" questions over "text"
    - Each question should have 3-4 clear, practical options
    - Focus on exercise-based learning and coding practice
    - For prior programming experience: if user has experience, include popular languages as options plus "Other" for text input
    - Questions should be about depth, pace, difficulty, and focus - NOT about content types (videos, tutorials, etc.)

    SPECIAL HANDLING FOR PRIOR EXPERIENCE:
    - First ask if they have programming experience (Yes/No/Some)
    - If they answer "Yes" or "Some", the next question should ask about languages with common options + "Other (specify)"

    Example question types:
    - "How comprehensive do you want your learning to be?"
    - "What's your current programming experience level?"
    - "How do you prefer to progress through exercises?"
    - "How much time can you dedicate to practice weekly?"

    For each question, determine the most appropriate input type:
    - "select" for single choice questions (provide 3-4 specific options)
    - "multiselect" for multiple choice questions (provide 3-4 specific options)
    - "text" only for "Other (specify)" type scenarios

    IMPORTANT CONTEXT: Our learning platform provides ONLY coding exercises and practice problems. No videos, tutorials, or other content types.

    Ensure questions are clear, concise, and directly relevant to creating a personalized exercise-based learning roadmap.`;

    const schema = `{
      "questions": [
        {
          "id": "string",
          "question": "string",
          "type": "select" | "multiselect" | "text",
          "options": ["string"] (required for select/multiselect types)
        }
      ]
    }`;

    try {
      const response = await this.llmService.generateJson<{
        questions: Array<{
          id: string;
          question: string;
          type: 'text' | 'select' | 'multiselect';
          options?: string[];
        }>;
      }>(prompt, schema);

      return response.questions.map((q, index) => ({
        id: q.id || `q${index + 1}`,
        question: q.question,
        type: q.type,
        options: q.options,
      }));
    } catch (error) {
      console.error('Error generating customization questions:', error);
      throw new Error('Failed to generate customization questions');
    }
  }

  async detectLanguage(title: string, description?: string): Promise<string> {
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

    const response = await this.llmService.generateJson<{ language?: string }>(
      prompt,
      schema
    );

    const detectedLanguageRaw = (response?.language ?? '').toString().trim();

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

    const normalized = detectedLanguageRaw.toLowerCase();

    if (!normalized) {
      return 'JavaScript';
    }

    // Handle common aliases
    if (normalized === 'js') return 'JavaScript';
    if (normalized === 'ts') return 'TypeScript';

    return languageMap[normalized] ?? 'JavaScript';
  }

  async generateRoadmap(
    title: string,
    description?: string,
    customizationAnswers?: CustomizationAnswer[]
  ): Promise<RoadmapDto> {
    let customizationContext = '';
    if (customizationAnswers && customizationAnswers.length > 0) {
      customizationContext = `

    Based on the user's responses to customization questions:
    ${customizationAnswers
      .map((answer) => `- ${answer.questionId}: ${answer.answer}`)
      .join('\n    ')}

    Use this information to tailor the roadmap to the user's specific needs, experience level, and preferences.`;
    }

    const prompt = `Create a detailed learning roadmap for the following goal:
    Title: "${title}"
    ${description ? `Description: "${description}"` : ''}${customizationContext}

    Create a step-by-step roadmap with checkpoints that will help the user achieve this goal.
    Each checkpoint should represent a specific milestone or concept to master.
    The checkpoints should be ordered logically, starting from basics and progressing to more advanced concepts.
    Each checkpoint's description should clearly explain what needs to be learned and why it's important.
    Keep the total number of checkpoints between 5-10 depending on the complexity of the goal.

    ${
      customizationAnswers
        ? "Customize the difficulty, pace, and content based on the user's responses above."
        : ''
    }`;

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

      return roadmapData;
    } catch (error) {
      console.error('Error generating roadmap:', error);
      throw new Error('Failed to generate roadmap');
    }
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
