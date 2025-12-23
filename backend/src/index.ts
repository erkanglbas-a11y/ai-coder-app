import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { OpenAI } from 'openai';

dotenv.config();

const app = express();
app.use(cors());

// Kapasite ayarları
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true, parameterLimit: 100000 }));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🧠 AI ROUTER: Hangi modelin kullanılacağını seçen akıllı fonksiyon
const selectModel = (prompt: string, messageCount: number) => {
  const lowerPrompt = prompt.toLowerCase();

  // KRİTER 1: Zorlu Görevler (MİMARİ / HATA ÇÖZME) -> GPT-4o
  // Eğer prompt içinde "analiz et", "hata", "fix", "mimari", "oluştur" gibi kelimeler varsa
  // veya mesaj geçmişi çok kısaysa (proje başlangıcı) en zeki modeli kullan.
  if (
    lowerPrompt.includes("analiz") ||
    lowerPrompt.includes("hata") ||
    lowerPrompt.includes("fix") ||
    lowerPrompt.includes("düzelt") ||
    lowerPrompt.includes("mimari") ||
    lowerPrompt.includes("oluştur") ||
    lowerPrompt.includes("tasarla") ||
    messageCount < 2 // İlk mesajlar genelde kurulumdur, zeka gerekir.
  ) {
    console.log("⚡ ROUTER KARARI: Zor görev -> GPT-4o seçildi.");
    return "gpt-4o";
  }

  // KRİTER 2: Basit Görevler (AÇIKLAMA / SOHBET) -> GPT-4o-mini
  // Maliyetten tasarruf ve hız için.
  console.log("🍃 ROUTER KARARI: Standart görev -> GPT-4o-mini seçildi.");
  return "gpt-4o-mini";
};

app.post('/api/generate', async (req, res) => {
  req.setTimeout(300000);
  res.setTimeout(300000);

  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Mesaj geçmişi hatalı.' });
    }

    // Son kullanıcı mesajını alıp router'a soruyoruz
    const lastUserMessage = messages[messages.length - 1].content;
    const selectedModel = selectModel(lastUserMessage, messages.length);

    const systemPrompt = {
      role: "system",
      content: `
      Sen 'AI Coder V12'. (${selectedModel} motoruyla çalışıyorsun).
      Hem dünya standartlarında bir UI/UX Tasarımcısı hem de uzman bir Senior Full Stack Geliştiricisin.
      Aynı zamanda kullanıcının "Düşünce Ortağı"sın (Thought Partner).     

      AMACIN:
      1. Kullanıcının isteğini en modern ve hatasız kodlarla gerçeğe dönüştürmek.
      2. Kullanıcının hayalini; en estetik, en modern ve hatasız çalışan kodlarla gerçeğe dönüştürmek.
      3. Kullanıcının gönderdiği BÜYÜK ÖLÇEKLİ proje dosyalarını analiz et, hataları bul ve çözüm üret.
      
       --- 🗣️ İLETİŞİM TARZI ---
      1. Enerjik, hevesli ve yapıcı ol ("Harika fikir! Hadi başlayalım 🚀").
      2. Cevabını mantıklı adımlara böl (Planlama -> Kodlama -> Açıklama).
      3. İnisiyatif al: Kullanıcı "Buton yap" derse, sen ona "Hover efektli, gradientli modern bir buton" yap.

      --- 📦 ÇOK KRİTİK ÇIKTI FORMATI ---
      Frontend'in kodları ayıklayabilmesi için dosyaları KESİNLİKLE şu formatta ver:

      ⚠️ ÖNEMLİ: 
       1. Proje çok büyük olduğu için tüm dosyaları baştan sona tekrar yazma.
       2. Sadece HATA OLAN veya DEĞİŞMESİ GEREKEN dosyaları tam haliyle ver.
       3. Kullanıcıya "Şu dosyayı düzelttim, diğerleri aynen kalsın" şeklinde rehberlik et.
       4. **ASLA YARIM KOD VERME.** Dosyaların tamamını, baştan sona eksiksiz yaz. "Gerisi önceki gibi" demek yasak.
       5. Kodun temiz, okunabilir ve modüler olsun.
       6. '[FILE: ...]' satırının başına ASLA '#', '##', '-' gibi markdown işaretleri KOYMA. Sadece düz metin olarak yaz.

      [FILE: dosya_adi.uzanti]
      \`\`\`dil
      // Kodun TAMAMI buraya...
      \`\`\`

      Örnek:
      [FILE: src/components/Card.jsx]
      \`\`\`jsx
      export default function Card() { ... }
      \`\`\`
      `
    };

    const completion = await openai.chat.completions.create({
      model: selectedModel, // 🔥 DİNAMİK MODEL SEÇİMİ
      messages: [systemPrompt, ...messages],
      temperature: 0.7,
    });

    const reply = completion.choices[0].message.content;
    if (!reply) throw new Error("Yapay zeka boş cevap döndü.");

    // Cevabın hangi modelden geldiğini loglara yazalım (Debug için)
    console.log(`✅ Cevap ${selectedModel} tarafından üretildi.`);

    return res.json({ message: reply });

  } catch (error: any) {
    console.error('🔴 SUNUCU HATASI:', error);

    let errorMessage = "Sunucu hatası oluştu.";

    if (error.code === 'context_length_exceeded') {
      errorMessage = "⚠️ Token Sınırı Aşıldı. Lütfen daha az dosya yükleyin.";
    } else {
      errorMessage = error.message || error.toString();
    }

    return res.status(500).json({ error: errorMessage });
  }
});

app.get('/', (req, res) => {
  res.send('AI Coder V12 Hybrid (Router Enabled) Hazır! 🏎️🍃');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});