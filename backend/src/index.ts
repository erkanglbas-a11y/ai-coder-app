import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// ----------------------------------------------------------------------
// 🧠 ROL VE MODEL TANIMLARI (BRAIN V12)
// ----------------------------------------------------------------------

// 1. Sistem Rolleri (Yapay Zekanın Kişilikleri)
const SYSTEM_ROLES = {
    ARCHITECT: `Sen Kıdemli Yazılım Mimarisin (Software Architect). 
    Görevin: Dosya yapılarını analiz etmek, eksik modülleri bulmak ve en sağlam altyapıyı kurgulamak.
    Kod yazmaktan çok "nasıl yapılması gerektiğini" planlarsın.
    ⚠️ KRİTİK KURAL: Eğer bir dosya içeriği veya kod örneği vereceksen, kod bloğundan hemen önce MUTLAKA şu formatta dosya adını yazmalısın:
    [FILE: klasor/dosya_adi.uzantisi]
    Bunu yazmazsan sistem dosyayı kaydedemez.`,

    TECH_LEAD: `Sen Takım Liderisin (Tech Lead). 
    Görevin: Karmaşık sorunları çözmek, güvenlik açıklarını kapatmak ve 'Best Practice' standartlarını uygulamak.
    Hata affetmezsin, kodun en optimize halini istersin.
    ⚠️ KRİTİK KURAL: Kod paylaşırken her zaman dosya adını belirt:
    [FILE: src/utils/helper.ts]
    \`\`\`typescript
    ...kod...
    \`\`\`
    Format bu şekilde olmalı.`,

    SENIOR_CODER: `Sen Kıdemli Geliştiricisin (Senior Developer).
    Görevin: Verilen görevi eksiksiz kodlamak. TypeScript, React ve Node.js konusunda uzmansın.
    Yazdığın kod hemen çalışmalı ve hatasız olmalı.
    ⚠️ EN ÖNEMLİ KURAL: Kod yazarken HİÇBİR ZAMAN dosya adını yazmayı unutma.
    Her kod bloğunun başına "[FILE: dosya_yolu/dosya_adi]" etiketini koymak ZORUNDASIN.
    Örnek:
    [FILE: src/components/Header.jsx]
    \`\`\`jsx
    const Header = ...
    \`\`\`
    Bu formatı her seferinde uygula.`,

    JUNIOR_CODER: `Sen Yardımcı Geliştiricisin (Junior Developer).
    Görevin: Basit fonksiyonlar yazmak, açıklama satırları eklemek ve kullanıcıyla sohbet etmek.
    Hızlı ve yardımseversin.
    ⚠️ KURAL: Kod yazarken başına [FILE: dosya_adi.js] eklemeyi unutma.`,
};

// 2. Model Haritası (Hangi Rol Hangi Motoru Kullanacak?)
const MODEL_CONFIG = {
    // Zorlu görevler için Amiral Gemisi
    HEAVY_DUTY: "gpt-4o", 
    // Basit görevler için Hızlı ve Ucuz Motor
    LIGHT_DUTY: "gpt-4o-mini" 
};

// 3. Akıllı Seçici (Smart Router)
// Gelen isteğin içeriğine göre en uygun uzmanı atar.
const selectSpecialist = (messages: any[], prompt: string | undefined) => {
    const lastMsg = messages?.length > 0 ? messages[messages.length - 1].content : (prompt || "");
    const contextLength = JSON.stringify(messages).length;
    
    // Anahtar Kelime Analizi
    const isArchitectTask = lastMsg.includes("analiz et") || lastMsg.includes("mimari") || lastMsg.includes("yapı");
    const isDebugTask = lastMsg.includes("hata") || lastMsg.includes("fix") || lastMsg.includes("çöz");
    const hasFiles = lastMsg.includes("[FILE:");
    const isLongContext = contextLength > 3000;

    // KARAR MEKANİZMASI
    if (hasFiles || isArchitectTask) {
        return { 
            role: "Software Architect 🏗️", 
            model: MODEL_CONFIG.HEAVY_DUTY, 
            systemPrompt: SYSTEM_ROLES.ARCHITECT 
        };
    }

    if (isDebugTask || isLongContext) {
        return { 
            role: "Tech Lead 🛡️", 
            model: MODEL_CONFIG.HEAVY_DUTY, 
            systemPrompt: SYSTEM_ROLES.TECH_LEAD 
        };
    }

    if (lastMsg.includes("kod") || lastMsg.includes("fonksiyon")) {
        return { 
            role: "Senior Coder 💻", 
            model: MODEL_CONFIG.HEAVY_DUTY, // Kod kalitesi için 4o tercih ettik
            systemPrompt: SYSTEM_ROLES.SENIOR_CODER 
        };
    }

    // Geriye kalan her şey (Sohbet, basit sorular)
    return { 
        role: "Fast Assistant ⚡", 
        model: MODEL_CONFIG.LIGHT_DUTY, 
        systemPrompt: SYSTEM_ROLES.JUNIOR_CODER 
    };
};

// ----------------------------------------------------------------------
// API ENDPOINT
// ----------------------------------------------------------------------

app.get('/', (req, res) => {
    res.send('AI Coder Backend (Smart Roles Active) 🧠🚀');
});

app.post('/api/generate', async (req: Request, res: Response): Promise<void> => {
    try {
        const { prompt, messages } = req.body;
        let userMessages: any[] = [];

        // Veri Formatı Kontrolü
        if (messages && Array.isArray(messages)) {
            userMessages = messages;
        } else if (prompt) {
            userMessages = [{ role: "user", content: prompt }];
        } else {
            res.status(400).json({ error: "Eksik veri." });
            return;
        }

        // 🧠 Beyin Devreye Giriyor: Uzmanı Seç
        const specialist = selectSpecialist(userMessages, prompt);

        console.log(`🤖 Atanan Uzman: ${specialist.role}`);
        console.log(`⚙️  Kullanılan Motor: ${specialist.model}`);

        // OpenAI'ya gidecek mesaj listesini hazırla
        // En başa sistem mesajını (System Prompt) ekliyoruz
        const finalMessages = [
            { role: "system", content: specialist.systemPrompt },
            ...userMessages
        ];

        const completion = await openai.chat.completions.create({
            model: specialist.model,
            messages: finalMessages,
            temperature: 0.2, // Kod için düşük sıcaklık
            max_tokens: 4000,
        });

        const aiResponse = completion.choices[0].message.content;

        // Frontend'e hem cevabı hem de kimin cevapladığını dönüyoruz
        res.json({ 
            message: aiResponse, 
            meta: { 
                role: specialist.role, 
                model: specialist.model 
            } 
        });

    } catch (error: any) {
        console.error("❌ BACKEND HATASI:", error);
        
        const statusCode = error.response?.status || 500;
        const errorMessage = error.response?.data?.error?.message || error.message;

        if (errorMessage.includes("model") && errorMessage.includes("not exist")) {
             res.status(404).json({ 
                error: "Model Hatası", 
                details: "Model erişim sorunu. Lütfen kodda 'gpt-4o' yerine 'gpt-4o-mini' kullanın." 
            });
            return;
        }

        res.status(statusCode).json({ error: "AI işlem hatası", details: errorMessage });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});