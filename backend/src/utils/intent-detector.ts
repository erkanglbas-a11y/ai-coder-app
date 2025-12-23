// src/utils/intent-detector.ts
import { TaskType } from '../types';

export function detectTaskTypeFromPrompt(prompt: string): TaskType {
  const normalizedPrompt = prompt.toLowerCase();

  // 1. STRATEJİ SİNYALLERİ (En Tepe Katman)
  // Bu kelimeler geçiyorsa koddan önce bir pazarlama/iş planı gerekir.
  const strategyKeywords = [
    'strateji', 'analiz et', 'kpi', 'roi', 'hedef kitle', 
    'büyüme', 'persona', 'pazarlama planı', 'rakip analizi',
    'neden', 'fikir ver', 'nasıl satarım'
  ];

  if (strategyKeywords.some(kw => normalizedPrompt.includes(kw))) {
    return 'STRATEGY';
  }

  // 2. MİMARİ & UZMANLIK SİNYALLERİ (High-Level Code)
  // "Karmaşık", "Güvenlik", "Mimari" gibi kelimeler Junior modelin boyunu aşar.
  const architectKeywords = [
    'karmaşık', 'complex', 'mimari', 'architecture', 
    'yapısı kur', 'optimize et', 'security', 'güvenlik',
    'scalable', 'ölçeklenebilir', 'best practice', 
    'refactor', 'entegrasyon', 'mikroservis', 'full stack'
  ];

  if (architectKeywords.some(kw => normalizedPrompt.includes(kw))) {
    return 'ARCHITECT'; // -> gpt-4o / Codex-Max
  }

  // 3. İÇERİK ÜRETİMİ
  const contentKeywords = [
    'blog yazısı', 'tweet', 'reklam metni', 'mail taslağı', 'seo uyumlu makale'
  ];

  if (contentKeywords.some(kw => normalizedPrompt.includes(kw))) {
    return 'STRATEGY'; // Veya CONTENT_CREATOR diye ayrı bir tip
  }

  // 4. VARSAYILAN: BASİT KODLAMA (Low-Level Code)
  // Eğer yukarıdaki iddialı kelimeler yoksa, muhtemelen basit bir scripttir.
  return 'CODER'; // -> gpt-4o-mini / Codex
}