// backend/src/controllers/aiController.ts
import { Request, Response } from 'express';
import { detectTaskTypeFromPrompt } from '../utils/intent-detector'; // Import ettik
import { AIOrchestrator } from '../core/ai-orchestrator';

export const generateCode = async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;

    // 1. ADIM: Backend, niyeti kendisi analiz eder.
    // Frontend'den type gelmesini beklemeyiz (güvenmeyiz).
    const detectedTaskType = detectTaskTypeFromPrompt(prompt);

    console.log(`[Backend Log] Prompt: "${prompt}" -> Algılanan: ${detectedTaskType}`);

    // 2. ADIM: Orkestratör devreye girer
    const orchestrator = AIOrchestrator.getInstance();
    const result = await orchestrator.execute({
      taskType: detectedTaskType,
      prompt: prompt
    });

    res.json(result);

  } catch (error) {
    res.status(500).json({ error: 'AI işlem hatası' });
  }
};