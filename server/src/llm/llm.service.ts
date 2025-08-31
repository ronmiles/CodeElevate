import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  LLMProvider,
  LLMConfig,
  ensureInteger,
} from './interfaces/llm.interface';
import { OpenAIProvider } from './providers/openai.provider';
import { GroqProvider } from './providers/groq.provider';

export type LLMProviderType = 'openai' | 'groq';

@Injectable()
export class LLMService {
  private providers: Map<LLMProviderType, LLMProvider>;
  private defaultProvider: LLMProviderType = 'groq';

  constructor(private configService: ConfigService) {
    this.providers = new Map();
    this.initializeProviders();
  }

  private initializeProviders() {
    // Initialize Groq provider (primary)
    const groqConfig: LLMConfig = {
      apiKey: this.configService.get<string>('GROQ_API_KEY')!,
      model:
        this.configService.get<string>('GROQ_MODEL') || 'openai/gpt-oss-120b',
      temperature: this.configService.get<number>('GROQ_TEMPERATURE') || 0,
      maxTokens: ensureInteger(
        this.configService.get<number>('GROQ_MAX_TOKENS'),
        2000
      ),
    };
    this.providers.set('groq', new GroqProvider(groqConfig));

    // Initialize OpenAI provider (fallback)
    const openaiConfig: LLMConfig = {
      apiKey: this.configService.get<string>('OPENAI_API_KEY')!,
      model: this.configService.get<string>('OPENAI_MODEL') || 'gpt-3.5-turbo',
      temperature: this.configService.get<number>('OPENAI_TEMPERATURE') || 0.7,
      maxTokens: ensureInteger(
        this.configService.get<number>('OPENAI_MAX_TOKENS'),
        2000
      ),
    };
    this.providers.set('openai', new OpenAIProvider(openaiConfig));
  }

  getProvider(type?: LLMProviderType): LLMProvider {
    const providerType = type || this.defaultProvider;
    const provider = this.providers.get(providerType);
    if (!provider) {
      throw new Error(`LLM provider '${providerType}' not found`);
    }
    return provider;
  }

  async generateText(prompt: string, provider?: LLMProviderType) {
    try {
      return await this.getProvider(provider).generateText(prompt);
    } catch (error) {
      // Enhance error message for better client-side handling
      if (error.message?.includes('JSON')) {
        throw new Error(`JSON formatting error: ${error.message}`);
      }

      if (error.message?.includes('timeout') || error.code === 'ETIMEDOUT') {
        throw new Error(
          'Request to AI service timed out. Please try again later.'
        );
      }

      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        throw new Error(
          'Failed to connect to AI service. Service may be unavailable.'
        );
      }

      // Pass through the original error if no specific handling is needed
      throw error;
    }
  }

  async generateJson<T>(
    prompt: string,
    schema: string,
    provider?: LLMProviderType
  ) {
    try {
      return await this.getProvider(provider).generateJson<T>(prompt, schema);
    } catch (error) {
      // Enhance error message for better client-side handling
      if (error.message?.includes('JSON')) {
        throw new Error(`JSON formatting error: ${error.message}`);
      }

      if (error.message?.includes('timeout') || error.code === 'ETIMEDOUT') {
        throw new Error(
          'Request to AI service timed out. Please try again later.'
        );
      }

      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        throw new Error(
          'Failed to connect to AI service. Service may be unavailable.'
        );
      }

      // Pass through the original error if no specific handling is needed
      throw error;
    }
  }
}
