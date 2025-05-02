export interface LLMConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface LLMProvider {
  generateText(prompt: string): Promise<LLMResponse>;
  generateJson<T>(prompt: string, schema: string): Promise<T>;
}

// Helper function to ensure integer values
export function ensureInteger(
  value: number | undefined,
  defaultValue: number
): number {
  if (value === undefined) return defaultValue;
  return Math.floor(value);
}

// Helper function to ensure valid temperature values
export function ensureTemperature(
  value: any,
  defaultValue: number = 0.7
): number {
  if (typeof value !== 'number' || isNaN(value)) return defaultValue;
  return Math.max(0, Math.min(1, value)); // Clamp between 0 and 1
}
