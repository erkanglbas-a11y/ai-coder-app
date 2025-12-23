import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { OpenAI } from 'openai';

dotenv.config();

const app = express();

app.use(cors());

// 🔥 ULTRA KAPASİTE: 500MB 🚀
// parameterLimit'i de artırdık ki çok fazla dosya gelirse patlamasın.
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true, parameterLimit: 100000 }));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post('/api/generate', async (req, res) => {
  // Zaman aşımını engellemek için sunucu zaman aşımını artırmayı deneyelim (Render izin verirse)
  req.setTimeout(300000); // 5 Dakika
  res.setTimeout(300000);

  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Mesaj geçmişi hatalı.' });
    }

    const systemPrompt = {
      role: "system",
      content: `
      Sen 'AI Coder V12'. Hem dünya standartlarında bir UI/UX Tasarımcısı hem de uzman bir Senior Full Stack Geliştiricisin.
      Aynı zamanda kullanıcının "Düşünce Ortağı"sın (Thought Partner).
      
      AMACIN:
      1. Kullanıcının hayalini; en estetik, en modern ve hatasız çalışan kodlarla gerçeğe dönüştürmek.
      2. Kullanıcının gönderdiği BÜYÜK ÖLÇEKLİ proje dosyalarını analiz et, hataları bul ve çözüm üret.


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

      ⚠️ ÖNEMLİ: 
       1. Proje çok büyük olduğu için tüm dosyaları baştan sona tekrar yazma.
       2. Sadece HATA OLAN veya DEĞİŞMESİ GEREKEN dosyaları tam haliyle ver.
       3. Kullanıcıya "Şu dosyayı düzelttim, diğerleri aynen kalsın" şeklinde rehberlik et.
       4. '[FILE: ...]' satırının başına ASLA '#', '##', '-' gibi markdown işaretleri KOYMA. Sadece düz metin olarak yaz.

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
      model: "gpt-4o",
      messages: [systemPrompt, ...messages],
      temperature: 0.7,
    });

    const reply = completion.choices[0].message.content;
    if (!reply) throw new Error("Yapay zeka boş cevap döndü.");

    return res.json({ message: reply });

  } catch (error: any) {
    console.error('🔴 SUNUCU HATASI:', error);
    
    let errorMessage = "Sunucu hatası oluştu.";
    
    // Payload Too Large (Express 413)
    if (error.type === 'entity.too.large') {
        errorMessage = "Proje boyutu 500MB sınırını bile aştı! Lütfen 'node_modules' veya gereksiz büyük dosyaları temizlediğinden emin ol.";
    } 
    // OpenAI Context Length Exceeded (400)
    else if (error.code === 'context_length_exceeded') {
        errorMessage = "⚠️ DİKKAT: Proje çok fazla kod içeriyor (Token Sınırı Aşıldı). Lütfen tüm projeyi değil, sadece ilgili klasörleri (örn: sadece src/) yüklemeyi dene.";
    }
    else if (error.response) {
        errorMessage = `AI Servis Hatası: ${error.response.data?.error?.message || error.message}`;
    }
    else {
        errorMessage = error.message || error.toString();
    }

    return res.status(500).json({ error: errorMessage });
  }
});

app.get('/', (req, res) => {
  res.send('AI Coder V12 (ULTRA MODE - 500MB) Hazır! 🦍🔥');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});