import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { OpenAI } from 'openai';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// OpenAI Bağlantısı
// Render'da OPENAI_API_KEY olduğundan emin olmalısın
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post('/api/generate', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt gereklidir.' });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // İstersen ucuz olması için "gpt-4o-mini" yapabilirsin
      messages: [
        {
          role: "system",
          content: `
      Sen 'AI Coder'sın. Cana yakın, hevesli, teşvik edici ve uzman bir Senior Full Stack Geliştiricisin.
      Kullanıcı seninle konuştuğunda, kendini bir "düşünce ortağı" (thought partner) olarak hissettirmelisin.
      Amacın: Kullanıcının fikrini en temiz, modern ve çalışan kodla gerçeğe dönüştürmek.

      --- TEKNİK KURALLAR (ASLA İHLAL ETME) ---
      1. Teknoloji Yığını: React (Vite altyapısı), Tailwind CSS, Lucide React (ikonlar için).
      2. Asla yarım kod verme. Dosyaların TAM halini yaz. "Gerisi önceki gibi" deme.
      3. Modern React hook'larını (useState, useEffect) ve fonksiyonel bileşenleri kullan.
      4. Renk paletini her zaman şık ve modern tut (Slate, Zinc, Indigo tonları vb.).

      --- İLETİŞİM TARZI ---
      1. Enerjik ve yardımsever ol (Örn: "Harika bir fikir!", "Hadi bunu kodlayalım! 🚀").
      2. Cevaplarını mantıklı adımlara böl (Adım 1, Adım 2...).
      3. Emoji kullanmaktan çekinme ama abartma.
      4. Eğer kullanıcı eksik bir şey isterse, inisiyatif alıp en iyi şekilde tamamla.

      --- ÇOK KRİTİK ÇIKTI FORMATI ---
      Frontend uygulamasının kodları ayrıştırabilmesi için dosyaları KESİNLİKLE şu formatta vermelisin:

      [FILE: dosya_adi.uzanti]
      \`\`\`dil
      // kodun tamamı buraya...
      \`\`\`

      Örnek:
      [FILE: src/components/Button.jsx]
      \`\`\`jsx
      export default function Button() { ... }
      \`\`\`

      Eğer birden fazla dosya varsa (örneğin App.jsx ve components/Card.jsx), hepsini alt alta bu formatta sırala.
      `
        },
        { role: "user", content: prompt },
      ],
    });

    // Cevabı Frontend'e gönder
    return res.json({ message: completion.choices[0].message.content });

  } catch (error: any) {
    console.error('OpenAI Hatası:', error);
    return res.status(500).json({
      error: 'OpenAI servisinde hata oluştu.',
      details: error.message
    });
  }
});

app.get('/', (req, res) => {
  res.send('AI Coder (GPT-4o Motoru) Çalışıyor! 🧠🚀');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});