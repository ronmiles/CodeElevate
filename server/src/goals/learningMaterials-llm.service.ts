import { Injectable } from '@nestjs/common';
import { LLMService } from '../llm/llm.service';
import {
  LearningMaterialDto,
  LearningMaterialSectionDto,
  CodeExampleDto,
} from './dto/learningMaterial.dto';

interface GeneratedLearningMaterial {
  title: string;
  overview: string;
  sections: LearningMaterialSectionDto[];
  estimatedTimeMinutes: number;
  codeExamples?: CodeExampleDto[];
}

@Injectable()
export class LearningMaterialsLLMService {
  constructor(private llmService: LLMService) {}

  async generateLearningMaterial(
    goalTitle: string,
    goalDescription: string,
    checkpointTitle: string,
    checkpointDescription: string,
    language: string
  ): Promise<GeneratedLearningMaterial> {
    const schema = `{
      "type": "object",
      "required": ["title", "overview", "sections", "estimatedTimeMinutes"],
      "properties": {
        "title": {
          "type": "string",
          "description": "Clear, engaging title for the learning material"
        },
        "overview": {
          "type": "string",
          "description": "Brief overview explaining what learners will gain from this material"
        },
        "sections": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["heading", "body"],
            "properties": {
              "heading": {
                "type": "string",
                "description": "Section heading"
              },
              "body": {
                "type": "string",
                "description": "Section content in markdown format"
              }
            }
          },
          "description": "2-3 focused learning sections"
        },
        "estimatedTimeMinutes": {
          "type": "number",
          "description": "Estimated reading time in minutes (5-15 minutes)"
        },
        "codeExamples": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["language", "code", "explanation"],
            "properties": {
              "language": {
                "type": "string",
                "description": "Programming language"
              },
              "code": {
                "type": "string",
                "description": "Code example"
              },
              "explanation": {
                "type": "string",
                "description": "Explanation of what the code does"
              }
            }
          },
          "description": "Optional code examples that illustrate the concepts"
        }
      }
    }`;

    const systemPrompt = `You are an expert educational content creator specializing in programming concepts.
      Your task is to create concise, engaging learning materials that prepare learners for hands-on exercises.
      
      You must return a JSON object that strictly follows this schema:
      ${schema}

      Content Guidelines:
      1. Keep materials bite-sized (one screenful of content max)
      2. Focus on practical knowledge needed for the checkpoint
      3. Use clear analogies and real-world examples
      4. Include 2-3 focused sections covering key concepts
      5. Add relevant code examples that demonstrate the concepts
      6. Make content beginner-friendly and engaging
      7. Ensure everything needed to complete the exercises is covered
      8. Use markdown formatting for better readability
      9. Estimated time should be realistic (5-15 minutes)
      10. DO NOT include any explanatory text outside the JSON structure`;

    const prompt = `${systemPrompt}

    Create learning material for:
    Goal: "${goalTitle}"
    Goal Description: "${goalDescription || 'Not provided'}"
    Checkpoint: "${checkpointTitle}"
    Checkpoint Description: "${checkpointDescription}"
    Programming Language: ${language}

    This learning material should teach the concepts needed to understand and complete exercises for this checkpoint.
    Make it engaging, practical, and focused on what the learner needs to know.
    
    Focus on:
    - Clear explanation of the key concepts
    - Why these concepts are important
    - How they work in practice
    - Simple examples that illustrate the concepts
    - Preparation for hands-on exercises`;

    try {
      const learningMaterialData =
        await this.llmService.generateJson<GeneratedLearningMaterial>(
          prompt,
          schema
        );

      // Validate and clean the data
      const cleanedData: GeneratedLearningMaterial = {
        title: learningMaterialData.title || checkpointTitle,
        overview:
          learningMaterialData.overview ||
          'Learn the fundamentals of this topic.',
        sections: Array.isArray(learningMaterialData.sections)
          ? learningMaterialData.sections.filter(
              (section) => section.heading && section.body
            )
          : [],
        estimatedTimeMinutes: Math.max(
          3,
          Math.min(20, learningMaterialData.estimatedTimeMinutes || 8)
        ),
        codeExamples: Array.isArray(learningMaterialData.codeExamples)
          ? learningMaterialData.codeExamples.filter(
              (example) => example.language && example.code
            )
          : [],
      };

      // Ensure we have at least one section
      if (cleanedData.sections.length === 0) {
        cleanedData.sections = [
          {
            heading: 'Understanding ' + checkpointTitle,
            body: cleanedData.overview,
          },
        ];
      }

      return cleanedData;
    } catch (error) {
      console.error('Error generating learning material:', error);
      throw new Error('Failed to generate learning material');
    }
  }

  async generateCombinedContent(
    goalTitle: string,
    goalDescription: string,
    checkpointTitle: string,
    checkpointDescription: string,
    language: string
  ): Promise<{ learningMaterial: GeneratedLearningMaterial; exercise: any }> {
    const schema = `{
      "type": "object",
      "required": ["learningMaterial", "exercise"],
      "properties": {
        "learningMaterial": {
          "type": "object",
          "required": ["title", "overview", "sections", "estimatedTimeMinutes"],
          "properties": {
            "title": {
              "type": "string",
              "description": "Clear, engaging title for the learning material"
            },
            "overview": {
              "type": "string",
              "description": "Brief overview explaining what learners will gain"
            },
            "sections": {
              "type": "array",
              "items": {
                "type": "object",
                "required": ["heading", "body"],
                "properties": {
                  "heading": {"type": "string"},
                  "body": {"type": "string"}
                }
              }
            },
            "estimatedTimeMinutes": {"type": "number"},
            "codeExamples": {
              "type": "array",
              "items": {
                "type": "object",
                "required": ["language", "code", "explanation"],
                "properties": {
                  "language": {"type": "string"},
                  "code": {"type": "string"},
                  "explanation": {"type": "string"}
                }
              }
            }
          }
        },
        "exercise": {
          "type": "object",
          "required": ["title", "description", "initialCode", "solution", "hints", "testCases"],
          "properties": {
            "title": {"type": "string"},
            "description": {"type": "string"},
            "initialCode": {"type": "string"},
            "solution": {"type": "string"},
            "hints": {"type": "array", "items": {"type": "string"}},
            "testCases": {
              "type": "array",
              "items": {
                "type": "object",
                "required": ["input", "expectedOutput"],
                "properties": {
                  "input": {},
                  "expectedOutput": {}
                }
              }
            }
          }
        }
      }
    }`;

    const systemPrompt = `You are an expert educational content creator. Generate both learning material and an exercise together.
      The learning material should teach everything needed to solve the exercise.
      
      Critical rule: Everything required to solve the exercise MUST appear in the learning material.
      
      Return JSON following this schema: ${schema}`;

    const prompt = `${systemPrompt}

    Create both learning material and exercise for:
    Goal: "${goalTitle}"
    Goal Description: "${goalDescription || 'Not provided'}"
    Checkpoint: "${checkpointTitle}"
    Checkpoint Description: "${checkpointDescription}"
    Programming Language: ${language}

    The learning material should prepare the learner to complete the exercise successfully.`;

    try {
      const combinedData = await this.llmService.generateJson<{
        learningMaterial: GeneratedLearningMaterial;
        exercise: any;
      }>(prompt, schema);

      return combinedData;
    } catch (error) {
      console.error('Error generating combined content:', error);
      throw new Error('Failed to generate combined content');
    }
  }
}
