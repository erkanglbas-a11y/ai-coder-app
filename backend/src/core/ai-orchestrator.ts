// src/core/ai-orchestrator.ts

import OpenAI from "openai";

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
  // Mimari analiz, uzun context, karmaşık muhakeme
  ARCHITECT: "gpt-5.2",

  // Kod yazma, refactor, debug
  CODING: "gpt-5.2-codex",

  // Basit, hızlı, düşük maliyetli işler
  FAST: "gpt-5-mini",
};

/* ------------------------------------------------------------------ */
/* TYPES */
/* ------------------------------------------------------------------ */

interface GenerateInput {
  prompt?: string;
  messages?: { role: string; content: string }[];
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

function selectSpecialist(
  messages: { role: string; content: string }[],
  prompt?: string
) {
  const lastMessage =
    messages?.length > 0 ? messages[messages.length - 1].content : prompt || "";

  const contextSize = JSON.stringify(messages).length;

  const isArchitectTask =
    /analiz|mimari|architecture|design|refactor|yapı/i.test(lastMessage) ||
    contextSize > 5000;

  const isCodingTask =
    /kod|code|fonksiyon|function|bug|hata|fix|debug/i.test(lastMessage);

  // 1️⃣ Ağır mimari işler
  if (isArchitectTask) {
    return {
      role: "Software Architect",
      model: MODEL_CONFIG.ARCHITECT,
      systemPrompt: SYSTEM_ROLES.ARCHITECT,
    };
  }

  // 2️⃣ Kod & teknik işler
  if (isCodingTask) {
    return {
      role: "Senior Developer",
      model: MODEL_CONFIG.CODING,
      systemPrompt: SYSTEM_ROLES.SENIOR_CODER,
    };
  }

  // 3️⃣ Hafif işler
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
    const messages =
      input.messages && Array.isArray(input.messages)
        ? input.messages
        : input.prompt
        ? [{ role: "user", content: input.prompt }]
        : [];

    if (messages.length === 0) {
      throw new Error("AIOrchestrator: prompt veya messages boş.");
    }

    const specialist = selectSpecialist(messages, input.prompt);

    const finalMessages = [
      { role: "system", content: specialist.systemPrompt },
      ...messages,
    ];

    try {
      const completion = await openai.chat.completions.create({
        model: specialist.model,
        messages: finalMessages,
        temperature: 0.2,
        max_tokens: 8000,
      });

      return {
        content: completion.choices[0].message.content || "",
        meta: {
          model: specialist.model,
          role: specialist.role,
        },
      };
    } catch (err) {
      // Fallback (stabil, genel amaçlı)
      const fallback = await openai.chat.completions.create({
        model: "gpt-5-mini",
        messages: finalMessages,
        temperature: 0.2,
      });

      return {
        content: fallback.choices[0].message.content || "",
        meta: {
          model: "gpt-5-mini (fallback)",
          role: specialist.role,
        },
      };
    }
  }
}
