import { Request, Response } from "express";
import { AIOrchestrator } from "../core/ai-orchestrator";

export const generateAIResponse = async (req: Request, res: Response) => {
  try {
    const { prompt, messages } = req.body;

    if (!prompt && !Array.isArray(messages)) {
      return res.status(400).json({
        error: "prompt veya messages zorunludur",
      });
    }

    const result = await AIOrchestrator.generate({
      prompt,
      messages,
    });

    return res.json({
      message: result.content,
      meta: result.meta,
    });
  } catch (error: any) {
    console.error("AI CONTROLLER ERROR:", error);

    return res.status(500).json({
      error: "AI controller hatası",
      details: error.message,
    });
  }
};
