'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, CheckCheck, Loader2, Play } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { parseMessage } from '@/lib/messageParser';

export default function ChatPanel() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<any[]>([
    { role: 'assistant', content: 'Merhaba! Ben DevAI. Aklındaki uygulamayı anlat, planlayıp kodlayalım.' }
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Store'dan gerekli verileri çekiyoruz
  const { files, addFile, updateFileContent, setActiveFile } = useStore();

  // Mesaj geldikçe otomatik scroll yap
  useEffect(() => { 
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); 
  }, [messages, isGenerating]);

  // --- 1. TEK DOSYA UYGULA ---
  const handleApplyCode = (fileName: string, code: string) => {
    const cleanName = fileName.trim();
    // Dosya var mı kontrol et
    const existing = files.find(f => f.name === cleanName);
    
    if (existing) {
      // Varsa güncelle
      updateFileContent(existing.id, code);
      setActiveFile(existing);
    } else {
      // Yoksa yeni oluştur
      const newFile = { 
        id: Math.random().toString(36).substr(2, 9), 
        name: cleanName, 
        language: cleanName.split('.').pop() || 'js', 
        content: code 
      };
      addFile(newFile);
      setActiveFile(newFile);
    }
  };

  // --- 2. TÜMÜNÜ UYGULA ---
  const handleApplyAll = (content: string) => {
    const parts = parseMessage(content);
    let count = 0;
    parts.forEach(part => {
      if (part.type === 'code' && part.fileName && part.code) {
        handleApplyCode(part.fileName, part.code);
        count++;
      }
    });
    if (count > 0) alert(`${count} dosya başarıyla güncellendi/oluşturuldu!`);
  };

  // --- 3. MESAJ GÖNDERME (AKILLI BAĞLAM) ---
  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;
    const userMessage = input;
    setInput('');
    setMessages(p => [...p, { role: 'user', content: userMessage }]);
    setIsGenerating(true);

    // MEVCUT DOSYALARI BAĞLAM OLARAK HAZIRLA
    // Bu sayede AI, projenin mevcut durumunu bilir ve sadece gerekeni değiştirir.
    let context = "";
    if (files.length > 0) {
      context = "\n\n=== ŞU ANKİ PROJE DOSYALARI (REFERANS) ===\n";
      files.forEach(f => { 
        // Dosya içeriği çok uzunsa özetlenebilir ama GPT-4o için genelde tamamını vermek daha iyidir.
        context += `[FILE: ${f.name}]\n\`\`\`${f.language}\n${f.content}\n\`\`\`\n`; 
      });
      context += "\n(NOT: Bu dosyalar projenin mevcut halidir. Hepsini tekrar yazmana gerek yok. Sadece değişenleri ver.)\n";
    }

    // TEKNİK YÖNLENDİRME (SYSTEM PROMPT DESTEĞİ)
    const technicalContext = `
      (Sistem Notu: 
      - Eğer bu yeni bir proje isteğiyse: Her şeyi sıfırdan kur, ağaç yapısını göster.
      - Eğer bu bir güncelleme/hata düzeltme isteğiyse: SADECE değişmesi gereken dosyaları [FILE: ...] formatında ver. Değişmeyenleri yazdırma.
      - Değişen dosyanın kodunu her zaman TAM HALİYLE ver.)
    `;

    const finalPrompt = `${userMessage}\n${context}\n\n${technicalContext}`;

    try {
      const res = await fetch('https://ai-coder-backend-9ou7.onrender.com/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: finalPrompt })
      });
      
      const data = await res.json();
      
      if (data.error) throw new Error(data.error);
      
      setMessages(p => [...p, { role: 'assistant', content: data.message }]);
    } catch (e) {
      console.error(e);
      setMessages(p => [...p, { role: 'assistant', content: 'Üzgünüm, bir bağlantı hatası oluştu.' }]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] text-white">
      
      {/* MESAJ LİSTESİ */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-700">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
             
             {/* AVATAR */}
             <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'assistant' ? 'bg-blue-600' : 'bg-green-600'}`}>
               {msg.role === 'assistant' ? <Bot size={16}/> : <User size={16}/>}
             </div>
             
             {/* BALONCUK */}
             <div className={`flex-1 max-w-[90%] p-3 rounded-lg text-sm leading-relaxed ${msg.role === 'user' ? 'bg-green-900/30 text-green-100' : 'bg-[#27272a] text-gray-100'}`}>
                
                {/* İÇERİK PARÇALAYICI (Text ve Code Blokları) */}
                {parseMessage(msg.content).map((part, idx) => (
                  <div key={idx} className="mb-3 last:mb-0">
                    {part.type === 'text' ? (
                      <div className="whitespace-pre-wrap font-sans">{part.content}</div>
                    ) : (
                      // KOD KUTUSU
                      <div className="mt-2 border border-gray-700 rounded-md overflow-hidden bg-black shadow-lg">
                        <div className="flex justify-between px-3 py-2 bg-[#18181b] border-b border-gray-700 items-center">
                          <span className="text-xs font-mono text-blue-400 font-bold">{part.fileName}</span>
                          <button 
                            onClick={() => handleApplyCode(part.fileName!, part.code!)} 
                            className="flex items-center gap-1 text-[10px] bg-green-700 px-2 py-1 rounded text-white hover:bg-green-600 transition-colors font-semibold"
                            title="Bu dosyayı projeye kaydet"
                          >
                            <Play size={10} /> KAYDET
                          </button>
                        </div>
                        <pre className="p-3 text-xs overflow-x-auto text-gray-300 font-mono scrollbar-thin scrollbar-thumb-gray-600">
                          <code>{part.code}</code>
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
                
                {/* TÜMÜNÜ UYGULA BUTONU (Sadece AI mesajlarında ve dosya varsa) */}
                {msg.role === 'assistant' && msg.content.includes('[FILE:') && (
                   <button 
                     onClick={() => handleApplyAll(msg.content)} 
                     className="mt-4 w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-md shadow-md flex items-center justify-center gap-2 transition-all transform active:scale-95"
                   >
                     <CheckCheck size={16}/> TÜM DEĞİŞİKLİKLERİ UYGULA
                   </button>
                )}
             </div>
          </div>
        ))}
        
        {/* YAZIYOR ANİMASYONU */}
        {isGenerating && (
          <div className="flex gap-2 items-center text-gray-500 text-xs pl-12 animate-pulse">
            <Loader2 size={14} className="animate-spin text-blue-500" />
            <span>DevAI düşünüyor...</span>
          </div>
        )}
        <div ref={messagesEndRef}/>
      </div>

      {/* INPUT ALANI */}
      <div className="p-4 bg-[#18181b] border-t border-gray-800 shrink-0">
        <div className="flex gap-2 relative">
          <textarea 
            value={input} 
            onChange={e=>setInput(e.target.value)} 
            onKeyDown={e=>{if(e.key==='Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}} 
            className="flex-1 bg-[#27272a] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none h-12 max-h-32 text-white placeholder-gray-500 shadow-inner font-sans" 
            placeholder="Bir uygulama iste veya hata düzeltmesi talep et..."
            rows={1}
          />
          <button 
            onClick={handleSend} 
            disabled={!input.trim() || isGenerating}
            className="p-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
          >
            <Send size={18}/>
          </button>
        </div>
        <div className="text-[10px] text-gray-600 mt-2 text-center select-none">
          Shift + Enter yeni satır • GPT-4o devrede 🚀
        </div>
      </div>
    </div>
  );
}