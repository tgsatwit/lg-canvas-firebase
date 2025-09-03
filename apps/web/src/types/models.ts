export interface ModelProvider {
  id: string;
  name: string;
  enabled: boolean;
}

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  capabilities: ModelCapability[];
  maxTokens: number;
  contextWindow: number;
  pricing: {
    inputPerMillion: number;
    outputPerMillion: number;
  };
  features: ModelFeature[];
}

export type ModelCapability = 
  | 'reasoning'
  | 'thinking' 
  | 'research'
  | 'coding'
  | 'creative'
  | 'analysis'
  | 'vision'
  | 'function_calling'
  | 'web_search';

export type ModelFeature = 
  | 'chain_of_thought'
  | 'step_by_step_reasoning' 
  | 'deep_analysis'
  | 'multi_perspective'
  | 'fact_checking'
  | 'source_verification'
  | 'structured_output'
  | 'long_context'
  | 'fast_response'
  | 'high_quality';

export const MODEL_PROVIDERS: ModelProvider[] = [
  { id: 'openai', name: 'OpenAI', enabled: true },
];

export const AI_MODELS: AIModel[] = [
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    description: 'Best for everyday tasks',
    capabilities: ['reasoning', 'creative', 'analysis', 'vision', 'function_calling', 'coding'],
    maxTokens: 16384,
    contextWindow: 128000,
    pricing: { inputPerMillion: 0.15, outputPerMillion: 0.60 },
    features: ['fast_response', 'structured_output', 'long_context']
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    description: 'Most capable for complex tasks',
    capabilities: ['reasoning', 'thinking', 'creative', 'analysis', 'vision', 'function_calling', 'coding', 'research'],
    maxTokens: 16384,
    contextWindow: 128000,
    pricing: { inputPerMillion: 2.50, outputPerMillion: 10.0 },
    features: ['chain_of_thought', 'step_by_step_reasoning', 'deep_analysis', 'high_quality', 'long_context']
  },
  {
    id: 'o1-mini',
    name: 'o1-mini',
    provider: 'openai',
    description: 'Best for reasoning and problem-solving',
    capabilities: ['reasoning', 'thinking', 'analysis', 'coding', 'research'],
    maxTokens: 65536,
    contextWindow: 128000,
    pricing: { inputPerMillion: 3.0, outputPerMillion: 12.0 },
    features: ['chain_of_thought', 'step_by_step_reasoning', 'deep_analysis', 'fast_response']
  },
  {
    id: 'gpt-5',
    name: 'GPT-4o (as GPT-5)',
    provider: 'openai',
    description: 'Most advanced available model (GPT-4o)',
    capabilities: ['reasoning', 'thinking', 'creative', 'analysis', 'vision', 'function_calling', 'coding', 'research'],
    maxTokens: 16384,
    contextWindow: 128000,
    pricing: { inputPerMillion: 2.50, outputPerMillion: 10.0 },
    features: ['chain_of_thought', 'step_by_step_reasoning', 'deep_analysis', 'high_quality', 'long_context', 'structured_output']
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'openai',
    description: 'Fastest for simple tasks',
    capabilities: ['reasoning', 'creative', 'analysis', 'coding'],
    maxTokens: 4096,
    contextWindow: 16385,
    pricing: { inputPerMillion: 0.50, outputPerMillion: 1.50 },
    features: ['fast_response', 'structured_output']
  },
];

export const getModelsByCapability = (capability: ModelCapability): AIModel[] => {
  return AI_MODELS.filter(model => model.capabilities.includes(capability));
};

export const getModelsByProvider = (provider: string): AIModel[] => {
  return AI_MODELS.filter(model => model.provider === provider);
};

export const getReasoningModels = (): AIModel[] => {
  return getModelsByCapability('reasoning').sort((a, b) => {
    // Sort by reasoning capability (o1 models first, then by quality)
    if (a.id.startsWith('o1') && !b.id.startsWith('o1')) return -1;
    if (!a.id.startsWith('o1') && b.id.startsWith('o1')) return 1;
    return b.pricing.outputPerMillion - a.pricing.outputPerMillion; // Higher price = higher quality
  });
};

export const getThinkingModels = (): AIModel[] => {
  return getModelsByCapability('thinking');
};

export const getResearchModels = (): AIModel[] => {
  return getModelsByCapability('research');
};

export const getModelById = (id: string): AIModel | undefined => {
  return AI_MODELS.find(model => model.id === id);
};

export const getDefaultModel = (): AIModel => {
  return AI_MODELS.find(model => model.id === 'gpt-4o-mini') || AI_MODELS[0];
};