import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Google Gemini Bağlantısı
// Render'da çevre değişkeni adını 'GEMINI_API_KEY' yapacağız.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

app.post('/api/generate', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt gereklidir.' });
    }

    // Gemini 1.5 Flash Modelini Seçiyoruz (Hızlı ve Ücretsiz)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: `Sen uzman bir yazılım geliştiricisisin.
      Kullanıcı senden bir uygulama istediğinde, çalışan React kodları vermelisin.
      
      ÇOK ÖNEMLİ KURALLAR:
      1. Dosyaları [FILE: ...] formatında ayır.
      2. React için 'export default function App()' kullan.
      3. Tailwind CSS kullan.
      
      FORMAT:
      [FILE: dosya_adi.uzanti]
      \`\`\`dil
      kodlar...
      \`\`\`
      `
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return res.json({ message: text });

  } catch (error) {
    console.error('Gemini Hatası:', error);
    return res.status(500).json({ error: 'Google AI servisinde hata oluştu.' });
  }
});

app.get('/', (req, res) => {
  res.send('AI Coder (Google Gemini Motoru) Çalışıyor! ⚡');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});