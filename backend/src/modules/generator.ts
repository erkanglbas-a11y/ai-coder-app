import { AIOrchestrator } from "../core/ai-orchestrator";

interface GenerateOptions {
  prompt?: string;
  messages?: { role: string; content: string }[];
}

export async function generateContent(options: GenerateOptions) {
  if (!options.prompt && !options.messages) {
    throw new Error("generateContent: prompt veya messages gerekli");
  }

  const result = await AIOrchestrator.generate({
    prompt: options.prompt,
    messages: options.messages,
  });

  return result;
}
