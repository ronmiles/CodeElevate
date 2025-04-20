import OpenAI from 'openai';
import {
  LLMConfig,
  LLMProvider,
  LLMResponse,
  ensureInteger,
  ensureTemperature,
} from '../interfaces/llm.interface';
import { Injectable } from '@nestjs/common';

@Injectable()
export class OpenAIProvider implements LLMProvider {
  private openai: OpenAI;
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = {
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      maxTokens: 2000,
      ...config,
    };

    this.openai = new OpenAI({
      apiKey: this.config.apiKey,
    });
  }

  async generateText(prompt: string): Promise<LLMResponse> {
    try {
      const completion = await this.openai.chat.completions.create({
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
      throw new Error(`OpenAI API Error: ${error.message}`);
    }
  }

  async generateJson<T>(prompt: string, schema: string): Promise<T> {
    const systemPrompt = `You are a JSON generator. You must respond with valid JSON that matches this schema: ${schema}`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: this.config.model!,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: ensureTemperature(this.config.temperature),
        max_tokens: ensureInteger(this.config.maxTokens, 2000),
        response_format: { type: 'json_object' },
      });

      const content = completion.choices[0].message.content || '{}';
      return JSON.parse(content) as T;
    } catch (error) {
      throw new Error(`OpenAI JSON Generation Error: ${error.message}`);
    }
  }
}
