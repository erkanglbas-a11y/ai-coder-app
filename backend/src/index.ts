import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { OpenAI } from 'openai';

dotenv.config();

const app = express();

// 1. CORS İzni (Frontend'in erişebilmesi için şart)
app.use(cors());

// 2. JSON verilerini okuyabilmek için
app.use(express.json());

// 3. OpenAI Bağlantısı
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 4. ANA ROTA (Frontend buraya istek atıyor)
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt gereklidir.' });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // veya "gpt-3.5-turbo"
      messages: [
        {
          role: "system",
          content: `Sen uzman bir yazılım geliştiricisisin. 
          Kullanıcı senden bir uygulama istediğinde, kodları birden fazla dosya halinde verebilirsin.
          
          HER DOSYA İÇİN ŞU FORMATI KULLANMALISIN:
          [FILE: dosya_adi.uzanti]
          \`\`\`dil
          kodlar buraya...
          \`\`\`

          Örnek:
          [FILE: index.html]
          \`\`\`html
          <html>...</html>
          \`\`\`

          [FILE: style.css]
          \`\`\`css
          body { ... }
          \`\`\`
          
          Sadece kod odaklı cevap ver, gereksiz sohbetten kaçın.`
        },
        { role: "user", content: prompt },
      ],
    });

    // Cevabı Frontend'e gönder
    res.json({ message: completion.choices[0].message.content });

  } catch (error) {
    console.error('OpenAI Hatası:', error);
    res.status(500).json({ error: 'Sunucu hatası oluştu.' });
  }
});

// Basit bir test rotası (Tarayıcıdan girip sunucu çalışıyor mu diye bakmak için)
app.get('/', (req, res) => {
  res.send('AI Coder Backend Çalışıyor! 🚀');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});