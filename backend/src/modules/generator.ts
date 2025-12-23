// src/modules/generator.ts
import { AIOrchestrator } from '../core/ai-orchestrator';

export class FeatureGenerator {
  private ai: AIOrchestrator;

  constructor() {
    this.ai = AIOrchestrator.getInstance();
  }

  /**
   * Senaryo: Kullanıcı "Bana bir Landing Page yap" dedi.
   * Bu sadece kod değil, önce ikna stratejisi sonra kod gerektirir.
   */
  public async generateLandingPageFeature(userGoal: string) {
    console.log(`>>> İşlem Başlatıldı: "${userGoal}"`);

    // ADIM 1: STRATEJİ (GPT-5.2)
    // Önce pazarlama açısından sayfanın nasıl olması gerektiğini planla.
    const strategyResponse = await this.ai.execute({
      taskType: 'STRATEGY',
      prompt: `Kullanıcı şu hedef için bir landing page istiyor: "${userGoal}". 
      Dönüşüm odaklı (CRO) bir sayfa akışı (wireframe text) hazırla. Hangi sectionlar olmalı?`
    });

    console.log("✔ Strateji Hazır.");

    // ADIM 2: MİMARİ & KODLAMA (GPT-5.1-Codex-Max)
    // Stratejiyi alıp doğrudan koda dönüştür.
    const codeResponse = await this.ai.execute({
      taskType: 'ARCHITECT',
      prompt: `Aşağıdaki stratejik plana sadık kalarak, Next.js ve Tailwind CSS ile landing page kodunu yaz.
      
      STRATEJİ PLANI:
      ${strategyResponse.content}
      
      Gereksinimler:
      - Responsive tasarım
      - SEO uyumlu semantik HTML
      - Call-to-Action butonları belirgin olsun.`,
      context: { framework: "Next.js 14", styling: "Tailwind" }
    });

    return {
      strategy: strategyResponse.content,
      code: codeResponse.content
    };
  }

  /**
   * Senaryo: Basit bir Utility fonksiyonu isteği.
   */
  public async generateUtility(description: string) {
    return this.ai.execute({
      taskType: 'CODER', // Ucuz model yeterli
      prompt: `Şu işi yapan bir TypeScript fonksiyonu yaz: ${description}`
    });
  }
}