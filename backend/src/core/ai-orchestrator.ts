import * as dotenv from 'dotenv';
import { OpenAI } from 'openai'; // Gerçek OpenAI
import { AIRequest, AIResponse, TaskType } from '../types';

dotenv.config();

export class AIOrchestrator {
  private static instance: AIOrchestrator;
  private openai: OpenAI;

  private constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  public static getInstance(): AIOrchestrator {
    if (!AIOrchestrator.instance) {
      AIOrchestrator.instance = new AIOrchestrator();
    }
    return AIOrchestrator.instance;
  }

  /**
   * 1. Hangi modeli kullanacağımıza karar veren fonksiyon
   * (Eskiden index.ts içindeydi, artık burada)
   */
  private selectModel(task: TaskType, forceExpensive: boolean = false): string {
    // Eğer zorla pahalı model isteniyorsa (Fallback durumu)
    if (forceExpensive) return 'gpt-4o';

    // Standart Akış
    switch (task) {
      case 'STRATEGY': return 'gpt-4o-mini'; // Strateji taslağı için ucuz yeter
      case 'ARCHITECT': return 'gpt-4o';      // Mimari her zaman zeka ister
      case 'CODER': return 'gpt-4o-mini';     // Basit kodlar için ucuz
      case 'REVIEW': return 'gpt-4o';         // Review hatasız olmalı
      default: return 'gpt-4o-mini';
    }
  }

  /**
   * 2. Cevabın kalitesini ölçen fonksiyon (Confidence Check)
   */
  private isLowConfidence(output: string, task: TaskType): boolean {
    if (!output) return true;
    // Kod istedik ama kod bloğu yoksa veya çok kısaysa başarısızdır.
    if (task === 'CODER' || task === 'ARCHITECT') {
      return output.length < 50 || (!output.includes('```') && !output.includes('function'));
    }
    return output.length < 20;
  }

  /**
   * 3. System Prompt Oluşturucu
   */
  private getSystemRole(task: TaskType): string {
    const BASE_ROLE = "Sen AI Coder. Uzman bir yazılım geliştiricisin.";
    
    switch (task) {
        case 'STRATEGY': return `${BASE_ROLE} Stratejik planlama, ROI ve Mimari öneriler sun. Kod yazma, yol göster.`;
        case 'ARCHITECT': return `${BASE_ROLE} Senior Architect gibi davran. Security, Scalability ve Best Practice odaklı ol.`;
        case 'CODER': return `${BASE_ROLE} Junior Developer gibi davran. Hızlı, çalışan ve temiz kod ver. Gereksiz açıklama yapma.`;
        default: return BASE_ROLE;
    }
  }

  /**
   * ANA ÇALIŞTIRMA FONKSİYONU
   */
  public async execute(req: AIRequest): Promise<AIResponse> {
    console.log(`\n🤖 [ORCHESTRATOR] İşleniyor: ${req.taskType}`);
    
    // 1. Önce ucuz/standart modeli dene
    let selectedModel = this.selectModel(req.taskType, false);
    const systemRole = this.getSystemRole(req.taskType);

    let output = await this.callOpenAI(selectedModel, systemRole, req.prompt);

    // 2. Cevabı kontrol et (Confidence Check)
    if (this.isLowConfidence(output, req.taskType)) {
        console.warn(`⚠️ [LOW CONFIDENCE] ${selectedModel} yetersiz kaldı. Güçlü modele geçiliyor...`);
        
        // Modeli yükselt (Fallback -> gpt-4o)
        selectedModel = this.selectModel(req.taskType, true); 
        output = await this.callOpenAI(selectedModel, systemRole, req.prompt);
    }

    return {
      success: true,
      content: output,
      modelUsed: selectedModel
    };
  }

  // OpenAI Wrapper
  private async callOpenAI(model: string, system: string, userPrompt: string): Promise<string> {
    try {
        const response = await this.openai.chat.completions.create({
            model: model,
            messages: [
                { role: 'system', content: system },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.2 // Kod için düşük sıcaklık
        });
        return response.choices[0]?.message?.content || "";
    } catch (e) {
        console.error("OpenAI Error:", e);
        return "";
    }
  }
}