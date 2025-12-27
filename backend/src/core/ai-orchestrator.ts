// src/core/ai-orchestrator.ts

import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat";

/* ------------------------------------------------------------------ */
/* CONFIG */
/* ------------------------------------------------------------------ */

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* ------------------------------------------------------------------ */
/* SYSTEM ROLES */
/* ------------------------------------------------------------------ */

const SYSTEM_ROLES = {
  ARCHITECT: `Sen Kıdemli Yazılım Mimarisin.
Görevin: Sistem mimarisi, analiz, refactor ve yüksek seviye kararlar.`,

  TECH_LEAD: `Sen Tech Lead'sin.
Görevin: Kod inceleme, hata çözme, performans ve best practice.`,

  SENIOR_CODER: `Sen Kıdemli Yazılımcısın.
Görevin: Üretime hazır, doğru ve temiz kod yazmak.`,

  JUNIOR_CODER: `Sen Yardımcı Geliştiricisin.
Görevin: Basit görevler ve açıklayıcı cevaplar.`,
};

/* ------------------------------------------------------------------ */
/* MODEL MAP (GPT-5.2 OPTIMIZED) */
/* ------------------------------------------------------------------ */

const MODEL_CONFIG = {
  ARCHITECT: "gpt-5.2",
  CODING: "gpt-5.2-codex",
  FAST: "gpt-5-mini",
} as const;

/* ------------------------------------------------------------------ */
/* TYPES */
/* ------------------------------------------------------------------ */

type RoleType = "system" | "user" | "assistant";

interface Message {
  role: RoleType;
  content: string;
}

interface GenerateInput {
  prompt?: string;
  messages?: Message[];
}

interface GenerateOutput {
  content: string;
  meta: {
    model: string;
    role: string;
  };
}

/* ------------------------------------------------------------------ */
/* SMART ROUTER */
/* ------------------------------------------------------------------ */

function selectSpecialist(messages: Message[], prompt?: string) {
  const lastMessage =
    messages.length > 0 ? messages[messages.length - 1].content : prompt || "";

  const contextSize = JSON.stringify(messages).length;

  const isArchitectTask =
    /analiz|mimari|architecture|design|refactor|yapı/i.test(lastMessage) ||
    contextSize > 5000;

  const isCodingTask =
    /kod|code|fonksiyon|function|bug|hata|fix|debug/i.test(lastMessage);

  if (isArchitectTask) {
    return {
      role: "Software Architect",
      model: MODEL_CONFIG.ARCHITECT,
      systemPrompt: SYSTEM_ROLES.ARCHITECT,
    };
  }

  if (isCodingTask) {
    return {
      role: "Senior Developer",
      model: MODEL_CONFIG.CODING,
      systemPrompt: SYSTEM_ROLES.SENIOR_CODER,
    };
  }

  return {
    role: "Assistant",
    model: MODEL_CONFIG.FAST,
    systemPrompt: SYSTEM_ROLES.JUNIOR_CODER,
  };
}

/* ------------------------------------------------------------------ */
/* ORCHESTRATOR */
/* ------------------------------------------------------------------ */

export class AIOrchestrator {
  static async generate(input: GenerateInput): Promise<GenerateOutput> {
    const messages: Message[] =
      input.messages && Array.isArray(input.messages)
        ? input.messages
        : input.prompt
        ? [{ role: "user", content: input.prompt }]
        : [];

    if (messages.length === 0) {
      throw new Error("AIOrchestrator: prompt veya messages boş.");
    }

    const specialist = selectSpecialist(messages, input.prompt);

    const finalMessages: ChatCompletionMessageParam[] = [
      { role: "system", content: specialist.systemPrompt },
      ...messages,
    ];

    try {
      const completion = await openai.chat.completions.create({
        model: specialist.model,
        messages: finalMessages,
        max_tokens: 8000,
      });

      return {
        content: completion.choices[0].message.content ?? "",
        meta: {
          model: specialist.model,
          role: specialist.role,
        },
      };
    } catch {
      const fallback = await openai.chat.completions.create({
        model: MODEL_CONFIG.FAST,
        messages: finalMessages,
      });

      return {
        content: fallback.choices[0].message.content ?? "",
        meta: {
          model: "gpt-5-mini (fallback)",
          role: specialist.role,
        },
      };
    }
  }
}
