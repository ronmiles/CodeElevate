import { Groq } from 'groq-sdk';
import {
  LLMConfig,
  LLMProvider,
  LLMResponse,
  ensureInteger,
  ensureTemperature,
} from '../interfaces/llm.interface';
import { Injectable } from '@nestjs/common';
import { jsonrepair } from 'jsonrepair';

@Injectable()
export class GroqProvider implements LLMProvider {
  private groq: Groq;
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = {
      model: 'mixtral-8x7b-32768',
      temperature: 0.1,
      maxTokens: 4000,
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
    const systemPrompt = `You are a JSON generator. Your task is to generate valid RFC 8259 JSON that strictly follows this schema:

${schema}

Important rules:
1. Respond ONLY with the JSON object (no prose, no prefixes/suffixes)
2. Do not include any explanations or markdown formatting
3. Do NOT use code fences (no triple backticks)
4. Ensure all required fields are present and types are correct
5. Do not add any fields not defined in the schema
6. All strings MUST be valid JSON strings: escape embedded quotes (\") and newlines as \n
Return a single minified JSON object.`;

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

      // Normalize and attempt strict parse first
      const cleaned = content
        .replace(/^```[a-zA-Z]*\n?/, '')
        .replace(/\n?```$/, '')
        .trim();

      const tryParse = (text: string): T => JSON.parse(text) as T;

      try {
        return tryParse(cleaned);
      } catch (_) {
        // Attempt to repair common JSON issues (unterminated strings, stray commas, etc.)
        try {
          const repaired = jsonrepair(cleaned);
          return tryParse(repaired);
        } catch (_) {
          // Attempt to extract the largest JSON object and repair
          const match = cleaned.match(/\{[\s\S]*\}/);
          if (match) {
            try {
              return tryParse(jsonrepair(match[0]));
            } catch (e) {
              throw e;
            }
          }
          // Re-throw last error if nothing worked
          throw new Error('Unable to parse or repair JSON response');
        }
      }
    } catch (error) {
      throw new Error(`Groq JSON Generation Error: ${error.message}`);
    }
  }
}
