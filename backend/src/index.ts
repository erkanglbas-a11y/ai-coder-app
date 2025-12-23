import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Google Gemini Bağlantısı
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

app.post('/api/generate', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt gereklidir.' });
    }

    // Model: gemini-1.5-flash
    const model = genAI.getGenerativeModel({
      // "-latest" ekleyerek en güncel versiyonu zorluyoruz
      model: "gemini-1.5-flash",
      // İŞTE YENİ "SÜPER PROMPT" BURADA BAŞLIYOR 👇
      systemInstruction: `
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
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return res.json({ message: text });

  } catch (error: any) {
    // DÜZELTME 2: Hatayı detaylı logla ve Frontend'e düzgün JSON dön
    console.error('🔴 GEMINI API HATASI:', error);
    
    // Google'dan gelen hatanın detayını yakalamaya çalışalım
    const errorMessage = error?.response?.data?.error?.message || error.message || 'Bilinmeyen sunucu hatası';

    return res.status(500).json({ 
      error: `Yapay zeka servisinde hata: ${errorMessage}`,
      details: error.toString() 
    });
  }
});

app.get('/', (req, res) => {
  res.send('AI Coder (Gemini 1.5 Flash) Çalışıyor! ⚡');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});