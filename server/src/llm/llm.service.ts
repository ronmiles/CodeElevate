import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LLMProvider, LLMConfig, ensureInteger } from './interfaces/llm.interface';
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
      model: this.configService.get<string>('GROQ_MODEL') || 'mixtral-8x7b-32768',
      temperature: this.configService.get<number>('GROQ_TEMPERATURE') || 0.7,
      maxTokens: ensureInteger(this.configService.get<number>('GROQ_MAX_TOKENS'), 2000),
    };
    this.providers.set('groq', new GroqProvider(groqConfig));

    // Initialize OpenAI provider (fallback)
    const openaiConfig: LLMConfig = {
      apiKey: this.configService.get<string>('OPENAI_API_KEY')!,
      model: this.configService.get<string>('OPENAI_MODEL') || 'gpt-3.5-turbo',
      temperature: this.configService.get<number>('OPENAI_TEMPERATURE') || 0.7,
      maxTokens: ensureInteger(this.configService.get<number>('OPENAI_MAX_TOKENS'), 2000),
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
    return this.getProvider(provider).generateText(prompt);
  }

  async generateJson<T>(prompt: string, schema: string, provider?: LLMProviderType) {
    return this.getProvider(provider).generateJson<T>(prompt, schema);
  }
} 