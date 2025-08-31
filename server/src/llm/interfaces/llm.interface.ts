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
  value: number | string | undefined,
  defaultValue: number
): number {
  if (value === undefined || value === null) return defaultValue;
  const numericValue = typeof value === 'string' ? parseInt(value, 10) : value;
  if (typeof numericValue !== 'number' || isNaN(numericValue)) {
    return defaultValue;
  }
  return Math.floor(numericValue);
}

// Helper function to ensure valid temperature values
export function ensureTemperature(
  value: any,
  defaultValue: number = 0.7
): number {
  if (value === undefined || value === null) return defaultValue;
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  if (typeof numericValue !== 'number' || isNaN(numericValue))
    return defaultValue;
  return Math.max(0, Math.min(1, numericValue));
}
