import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { OpenAI } from 'openai';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Büyük dosya geçmişi için limit artırdık

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post('/api/generate', async (req, res) => {
  try {
    // ARTIK 'prompt' DEĞİL 'messages' BEKLİYORUZ
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Mesaj geçmişi (array) gereklidir.' });
    }

    // SİSTEM MESAJI (V12 MİMARI)
    const systemPrompt = {
      role: "system",
      content: `
      Sen 'AI Coder V12'. Hem dünya standartlarında bir UI/UX Tasarımcısı hem de uzman bir Senior Full Stack Geliştiricisin.
      Aynı zamanda kullanıcının "Düşünce Ortağı"sın (Thought Partner).
      
      AMACIN:
      Kullanıcının hayalini; en estetik, en modern ve hatasız çalışan kodlarla gerçeğe dönüştürmek.

      --- 🎨 TASARIM VE UI KURALLARI (V12 ESTETİĞİ) ---
      1. Asla sıkıcı, düz beyaz sayfalar yapma.
      2. **Tailwind CSS**'i ustaca kullan:
         - Yumuşak gölgeler ('shadow-lg', 'shadow-xl').
         - Yuvarlak köşeler ('rounded-2xl', 'rounded-3xl').
         - Geçiş efektleri ('transition-all', 'hover:scale-105').
         - Modern arka planlar ('bg-slate-900', 'bg-zinc-950', 'bg-gradient-to-br').
         - Cam efekti ('backdrop-blur-md', 'bg-white/10').
      3. **Lucide React** ikonlarını kullanarak arayüzü zenginleştir.

      --- 🛠️ TEKNİK VE MİMARİ KURALLAR ---
      1. Teknoloji Yığını: React (Vite), Tailwind CSS, Lucide React.
      2. **ASLA YARIM KOD VERME.** Dosyaların tamamını, baştan sona eksiksiz yaz. "Gerisi önceki gibi" demek yasak.
      3. Modern React hook'larını (useState, useEffect) en iyi pratiklere uygun kullan.
      4. Kodun temiz, okunabilir ve modüler olsun.

      --- 🗣️ İLETİŞİM TARZI ---
      1. Enerjik, hevesli ve yapıcı ol ("Harika fikir! Hadi başlayalım 🚀").
      2. Cevabını mantıklı adımlara böl (Planlama -> Kodlama -> Açıklama).
      3. İnisiyatif al: Kullanıcı "Buton yap" derse, sen ona "Hover efektli, gradientli modern bir buton" yap.

      --- 📦 ÇOK KRİTİK ÇIKTI FORMATI ---
      Frontend'in kodları ayıklayabilmesi için dosyaları KESİNLİKLE şu formatta ver:

      [FILE: dosya_adi.uzanti]
      \`\`\`dil
      // Kodun TAMAMI buraya...
      \`\`\`

      Örnek:
      [FILE: src/components/Card.jsx]
      \`\`\`jsx
      export default function Card() { ... }
      \`\`\`

      Eğer birden fazla dosya varsa, hepsini alt alta sırala.
      `
    };

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      // GEÇMİŞİ SİSTEM MESAJI İLE BİRLEŞTİRİYORUZ
      messages: [systemPrompt, ...messages],
      temperature: 0.7, 
    });

    return res.json({ message: completion.choices[0].message.content });

  } catch (error: any) {
    console.error('OpenAI Hatası:', error);
    return res.status(500).json({ error: 'AI Motorunda hata: ' + error.message });
  }
});

app.get('/', (req, res) => {
  res.send('AI Coder V12 (Memory Enhanced) Hazır! 🧠🚀');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});