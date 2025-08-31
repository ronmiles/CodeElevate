import { Groq } from 'groq-sdk';
import {
  LLMConfig,
  LLMProvider,
  LLMResponse,
  ensureInteger,
  ensureTemperature,
} from '../interfaces/llm.interface';
import { Injectable } from '@nestjs/common';

@Injectable()
export class GroqProvider implements LLMProvider {
  private groq: Groq;
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = {
      model: 'mixtral-8x7b-32768',
      temperature: 0.1,
      maxTokens: 2000,
      ...config,
    };

    this.groq = new Groq({
      apiKey: this.config.apiKey,
    });
  }

  async generateText(prompt: string): Promise<LLMResponse> {
    try {
      const completion = await this.groq.chat.completions.create({
        model: this.config.model!,
        messages: [{ role: 'user', content: prompt }],
        temperature: ensureTemperature(this.config.temperature),
        max_tokens: ensureInteger(this.config.maxTokens, 2000),
      });

      return {
        content: completion.choices[0].message.content || '',
        usage: {
          promptTokens: completion.usage?.prompt_tokens || 0,
          completionTokens: completion.usage?.completion_tokens || 0,
          totalTokens: completion.usage?.total_tokens || 0,
        },
      };
    } catch (error) {
      throw new Error(`Groq API Error: ${error.message}`);
    }
  }

  async generateJson<T>(prompt: string, schema: string): Promise<T> {
    const systemPrompt = `You are a JSON generator. Your task is to generate valid JSON that strictly follows this schema:

${schema}

Important rules:
1. Respond ONLY with the JSON object
2. Do not include any explanations or markdown formatting
3. Ensure all required fields are present
4. Follow the exact types specified in the schema
5. Do not add any fields not defined in the schema

Example of correct response format:
{
  "field": "value"
}`;

    try {
      const completion = await this.groq.chat.completions.create({
        model: this.config.model!,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: ensureTemperature(this.config.temperature, 0.5), // Lower temperature for more consistent JSON
        max_tokens: ensureInteger(this.config.maxTokens, 2000),
      });

      const content = completion.choices[0].message.content || '{}';

      // Clean the response to ensure it only contains JSON
      const jsonStr = content
        .replace(/^```json\n?|\n?```$/g, '') // Remove code blocks
        .replace(/^\s*\{/, '{') // Ensure it starts with {
        .replace(/\}\s*$/, '}') // Ensure it ends with }
        .trim();

      try {
        return JSON.parse(jsonStr) as T;
      } catch (parseError) {
        // If parsing fails, try to extract JSON from the response
        const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]) as T;
        }
        throw parseError;
      }
    } catch (error) {
      throw new Error(`Groq JSON Generation Error: ${error.message}`);
    }
  }
}
