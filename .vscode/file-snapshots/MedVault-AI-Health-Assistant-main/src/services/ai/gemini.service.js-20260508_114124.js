import { GoogleGenerativeAI } from '@google/generative-ai';

const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
const geminiModel = import.meta.env.VITE_GEMINI_MODEL || 'gemini-1.5-flash';
const aiEnabled = import.meta.env.VITE_AI_ENABLED !== 'false';

export const AI_DISCLAIMER =
  'AI-generated insights are informational only and not a substitute for professional medical advice.';

export const SYSTEM_PROMPT = [
  'You are CliniNova AI, a healthcare record understanding assistant.',
  'You explain medical reports and records in simple language.',
  'You never diagnose diseases, prescribe medication, or suggest treatments.',
  'You never replace a licensed healthcare professional.',
  'Always be careful, neutral, and supportive.',
  `Always include this disclaimer verbatim: "${AI_DISCLAIMER}"`
].join(' ');

let geminiClient;

export const isAiEnabled = () => aiEnabled && Boolean(geminiApiKey);

const getClient = () => {
  if (!isAiEnabled()) return null;
  if (!geminiClient) {
    geminiClient = new GoogleGenerativeAI(geminiApiKey);
  }
  return geminiClient;
};

const sanitizeText = (text, maxLength = 8000) => {
  if (!text) return '';
  return text.replace(/\s+/g, ' ').trim().slice(0, maxLength);
};

export const ensureDisclaimer = (text) => {
  if (!text) return AI_DISCLAIMER;
  if (text.includes(AI_DISCLAIMER)) return text;
  return `${text}\n\n${AI_DISCLAIMER}`;
};

export const generateGeminiContent = async ({ systemPrompt, userPrompt, temperature = 0.4 }) => {
  if (!isAiEnabled()) {
    return {
      text: ensureDisclaimer(
        'AI is currently unavailable. Please try again later or check your settings.'
      )
    };
  }

  const client = getClient();
  if (!client) {
    return {
      text: ensureDisclaimer(
        'AI is not configured. Please add your Gemini API key in environment settings.'
      )
    };
  }

  const model = client.getGenerativeModel({
    model: geminiModel,
    generationConfig: {
      temperature,
      topP: 0.9,
      maxOutputTokens: 800
    }
  });

  const prompt = [sanitizeText(systemPrompt), sanitizeText(userPrompt)]
    .filter(Boolean)
    .join('\n\n');

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  return { text: ensureDisclaimer(responseText) };
};
