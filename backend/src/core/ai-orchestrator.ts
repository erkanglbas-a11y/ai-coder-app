import * as dotenv from 'dotenv';
import { OpenAI } from 'openai';
import { AIRequest, AIResponse, TaskType } from '../types';

dotenv.config();

// 2025 MODEL TANIMLARI (Senaryo Gereği)
const MODELS = {
  STRATEGY_MASTER: 'gpt-5.2',           // En zeki, en pahalı (CEO)
  ARCHITECT_PRO:   'gpt-5.1-codex-max', // Büyük kod mimarı (CTO)
  CODER_PRO:      'gpt-5.1-codex-max',     // Hızlı kodlayıcı (Junior Dev)
  LEGACY_SAFE:     'gpt-4o'             // Acil durum yedeği
};

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
   * forceExpensive = true ise "Fallback" devreye girer ve EN İYİSİNİ seçer.
   */
  private selectModel(task: TaskType, forceExpensive: boolean = false): string {
    // 🔥 FALLBACK DURUMU: Paraya kıyıyoruz, en güçlüleri çağırıyoruz.
    if (forceExpensive) {
      console.log(`⚠️ [FALLBACK MODE] GPT-5.2 (Strategy Master) devreye alındı.`);
      // Kod hatasıysa Codex-Max, mantık hatasıysa 5.2.
      // Garanti olsun diye en zeki modeli (5.2) seçiyoruz.
      return MODELS.STRATEGY_MASTER; 
    }

    // STANDART AKIŞ
    switch (task) {
      case 'STRATEGY': 
        // Strateji baştan sağlam olmalı
        return MODELS.STRATEGY_MASTER; 

      case 'ARCHITECT': 
        // Mimari için geniş context lazım
        return MODELS.ARCHITECT_PRO;      

      case 'CODER': 
        // Basit işler için hızlı model
        return MODELS.CODER_PRO;     

      case 'REVIEW': 
        // Review için Pro model
        return MODELS.ARCHITECT_PRO;         

      default: 
        return MODELS.CODER_PRO;
    }
  }

  /**
   * 2. Cevabın kalitesini ölçen fonksiyon (Confidence Check)
   */
  private isLowConfidence(output: string, task: TaskType): boolean {
    if (!output) return true;

    // Kod istedik ama kod bloğu yoksa başarısızdır.
    if (task === 'CODER' || task === 'ARCHITECT') {
      const isTooShort = output.length < 50;
      const hasNoCodeBlock = !output.includes('```') && !output.includes('function') && !output.includes('class');
      
      if (isTooShort || hasNoCodeBlock) {
        console.warn(`📉 [LOW CONFIDENCE] Kod çıktısı yetersiz. Güçlü modele geçilecek.`);
        return true;
      }
    }
    
    return output.length < 20;
  }

  /**
   * 3. System Prompt Oluşturucu
   */
  private getSystemRole(task: TaskType): string {
    // 2025 standartlarına uygun, daha yetkin roller
    const BASE_ROLE = "Sen AI Coder v2025. Geleceğin yazılım teknolojilerine hakimsin.";
    
    switch (task) {
        case 'STRATEGY': return `${BASE_ROLE} Sen bir CTO'sun. Verimlilik, Scalability ve Business Value odaklı düşün.`;
        case 'ARCHITECT': return `${BASE_ROLE} Sen Senior Software Architect. Kod tabanının tamamına hakimsin. SOLID, Clean Architecture vazgeçilmezin.`;
        case 'CODER': return `${BASE_ROLE} Sen Hızlı Geliştirici. Verilen görevi hatasız, modern syntax ile yap.`;
        default: return BASE_ROLE;
    }
  }

  /**
   * ANA ÇALIŞTIRMA FONKSİYONU
   */
  public async execute(req: AIRequest): Promise<AIResponse> {
    console.log(`\n🤖 [ORCHESTRATOR 2025] İşleniyor: ${req.taskType}`);
    
    // A. İLK DENEME (Primary Model)
    let selectedModel = this.selectModel(req.taskType, false);
    const systemRole = this.getSystemRole(req.taskType);
    let output = "";
    let success = false;

    try {
      output = await this.callOpenAI(selectedModel, systemRole, req.prompt);
      success = true;
    } catch (error) {
      console.error(`❌ [ERROR] Model (${selectedModel}) hata verdi. Fallback hazırlanıyor...`);
      success = false;
    }

    // B. FALLBACK MEKANİZMASI (GPT-5 Gücü)
    if (!success || this.isLowConfidence(output, req.taskType)) {
        
        // Burası kritik: Junior (Codex) yapamadıysa, Master (5.2) devreye girer.
        console.warn(`🚀 [RETRY] GPT-5.2 (Ultimate) modeline geçiş yapılıyor...`);
        
        selectedModel = this.selectModel(req.taskType, true); // forceExpensive = true -> GPT-5.2
        
        try {
          output = await this.callOpenAI(selectedModel, systemRole, req.prompt);
        } catch (retryError) {
          console.error(`☠️ [CRITICAL] Fallback modeli de cevap vermedi.`);
          output = "// Sistem şu an aşırı yoğun. Lütfen daha sonra tekrar deneyin.";
        }
    }

    return {
      success: true,
      content: output,
      modelUsed: selectedModel
    };
  }

  private async callOpenAI(model: string, system: string, userPrompt: string): Promise<string> {
    const response = await this.openai.chat.completions.create({
        model: model,
        messages: [
            { role: 'system', content: system },
            { role: 'user', content: userPrompt }
        ],
        temperature: 0.2
    });
    return response.choices[0]?.message?.content || "";
  }
}