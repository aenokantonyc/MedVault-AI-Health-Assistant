declare module '../services/ai/gemini.service' {
  export const AI_DISCLAIMER: string;
  export const SYSTEM_PROMPT: string;
  export const isAiEnabled: () => boolean;
  export const ensureDisclaimer: (text: string) => string;
  export const generateGeminiContent: (params: {
    systemPrompt?: string;
    userPrompt: string;
    temperature?: number;
  }) => Promise<{ text: string }>;
}

declare module '../services/ai/contextBuilder' {
  export const fetchRecentChatHistory: (userId: string, limit?: number) => Promise<{ data: any[] | null; error: any }>;
  export const fetchOlderChatSummaries: (userId: string, offset?: number, limit?: number) => Promise<string>;
  export const createContextSummary: (userMessage: string, aiResponse: string) => string;
  export const buildAssistantContext: (params: {
    userId: string;
    userMessage: string;
    language?: string;
  }) => Promise<{ systemPrompt: string; userPrompt: string; contextSummarySeed: string }>;
}

declare module '../services/ai/translation.service' {
  export const translateText: (text: string, targetLanguage?: string) => Promise<string>;
}

declare module '../services/ai/reportAnalyzer' {
  export const extractTextFromFile: (file: File) => Promise<string>;
  export const analyzeReport: (params: {
    userId: string;
    reportId: string;
    file: File;
    language?: string;
  }) => Promise<{ extractedText: string; summary: string; translatedSummary: Record<string, string> }>;
}
