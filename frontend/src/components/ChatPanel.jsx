import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Play, CheckCheck, Loader2, AlertCircle } from 'lucide-react';
import { useStore } from '../store/useStore';

// GÜVENLİ Mesaj Ayrıştırıcı
const parseMessage = (content) => {
  // Eğer içerik boşsa veya yazı değilse boş dizi dön (Çökme engellendi)
  if (!content || typeof content !== 'string') return [{ type: 'text', content: '...' }];

  const parts = [];
  const lines = content.split('\n');
  let inCode = false;
  let currentText = '';
  let currentCode = '';
  let fileName = '';

  lines.forEach(line => {
    // Dosya başlangıcını yakala
    if (line.trim().startsWith('[FILE:')) {
      if (currentText) { parts.push({ type: 'text', content: currentText }); currentText = ''; }
      fileName = line.replace('[FILE:', '').replace(']', '').trim();
    } 
    // Kod bloğu başlangıcı/bitişi
    else if (line.trim().startsWith('```')) {
      if (inCode) {
        // Kod bloğu bitti
        parts.push({ type: 'code', fileName, code: currentCode.trim() });
        currentCode = '';
        fileName = '';
        inCode = false;
      } else {
        // Kod bloğu başladı
        if (currentText) { parts.push({ type: 'text', content: currentText }); currentText = ''; }
        inCode = true;
      }
    } 
    // Normal satır
    else {
      if (inCode) currentCode += line + '\n';
      else currentText += line + '\n';
    }
  });

  // Kalan metni ekle
  if (currentText) parts.push({ type: 'text', content: currentText });
  return parts;
};

export default function ChatPanel() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Merhaba! Ben AI Coder. Senin için ne geliştirelim? 🚀' }
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef(null);

  const { files, addFile, updateFileContent, setActiveFile } = useStore();

  // Her mesajda en alta kaydır
  useEffect(() => { 
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); 
  }, [messages, isGenerating]);

  // Tekil kod uygulama
  const handleApplyCode = (fileName, code) => {
    if (!fileName) fileName = "untitled"; // Dosya adı yoksa koruma
    const cleanName = fileName.trim();
    
    const existing = files.find(f => f.name === cleanName);
    if (existing) {
      updateFileContent(existing.id, code);
      setActiveFile(existing);
    } else {
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

  // Tüm kodları uygulama
  const handleApplyAll = (content) => {
    const parts = parseMessage(content);
    let count = 0;
    parts.forEach(part => {
      if (part.type === 'code' && part.code) {
        handleApplyCode(part.fileName, part.code);
        count++;
      }
    });
    if (count > 0) alert(`${count} dosya başarıyla oluşturuldu/güncellendi! ✅`);
    else alert("Kaydedilecek kod bloğu bulunamadı.");
  };

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;

    const userMessage = input;
    setInput('');
    setMessages(p => [...p, { role: 'user', content: userMessage }]);
    setIsGenerating(true);

    // Mevcut dosyaları bağlam (context) olarak ekle
    let context = "";
    if (files.length > 0) {
      context = "\n\n=== MEVCUT PROJE DOSYALARI (Referans Al) ===\n";
      files.forEach(f => { 
        context += `[FILE: ${f.name}]\n\`\`\`${f.language}\n${f.content}\n\`\`\`\n`; 
      });
    }

    try {
      const res = await fetch('[https://ai-coder-backend-9ou7.onrender.com/api/generate](https://ai-coder-backend-9ou7.onrender.com/api/generate)', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `${userMessage}\n${context}` })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Sunucu hatası');
      }

      if (data.message) {
        setMessages(p => [...p, { role: 'assistant', content: data.message }]);
      } else {
        setMessages(p => [...p, { role: 'assistant', content: '⚠️ Boş cevap döndü.' }]);
      }

    } catch (e) {
      console.error("HATA:", e);
      setMessages(p => [...p, { role: 'assistant', content: `❌ Bir hata oluştu: ${e.message}` }]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] text-white font-sans">
      {/* Mesaj Alanı */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
             
             {/* Avatar */}
             <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-lg ${msg.role === 'assistant' ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-zinc-700'}`}>
               {msg.role === 'assistant' ? <Bot size={18} className="text-white"/> : <User size={18} className="text-gray-300"/>}
             </div>

             {/* Mesaj Balonu */}
             <div className={`flex-1 max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-md ${msg.role === 'user' ? 'bg-zinc-800 text-gray-100 rounded-tr-none' : 'bg-[#27272a] text-gray-200 rounded-tl-none border border-zinc-700/50'}`}>
                
                {/* Mesaj İçeriği */}
                {parseMessage(msg.content).map((part, idx) => (
                  <div key={idx} className="mb-3 last:mb-0">
                    {part.type === 'text' ? (
                      <div className="whitespace-pre-wrap">{part.content}</div>
                    ) : (
                      <div className="mt-3 border border-zinc-700 rounded-lg overflow-hidden bg-[#09090b] shadow-inner">
                        <div className="flex justify-between items-center px-3 py-2 bg-[#18181b] border-b border-zinc-800">
                          <span className="text-xs text-blue-400 font-mono flex items-center gap-1">
                            <AlertCircle size={10} className="text-blue-500"/>
                            {part.fileName || 'kod_parcasi'}
                          </span>
                          <button 
                            onClick={() => handleApplyCode(part.fileName, part.code)} 
                            className="text-[10px] bg-green-700/80 hover:bg-green-600 px-2 py-1 rounded text-white flex gap-1 items-center transition-colors"
                          >
                            <Play size={10} /> Çalıştır
                          </button>
                        </div>
                        <div className="p-3 overflow-x-auto">
                          <pre className="text-xs text-gray-300 font-mono leading-5"><code>{part.code}</code></pre>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Tümünü Uygula Butonu (Sadece AI mesajında ve dosya varsa) */}
                {msg.role === 'assistant' && msg.content.includes('[FILE:') && (
                   <button 
                    onClick={() => handleApplyAll(msg.content)} 
                    className="mt-4 w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
                   >
                     <CheckCheck size={14}/> TÜM DOSYALARI UYGULA
                   </button>
                )}
             </div>
          </div>
        ))}

        {/* Yükleniyor Animasyonu */}
        {isGenerating && (
          <div className="flex gap-3 animate-pulse pl-2">
             <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                <Loader2 size={16} className="animate-spin text-indigo-400"/>
             </div>
             <div className="text-xs text-gray-500 flex items-center">AI düşünüyor ve kodluyor...</div>
          </div>
        )}
        
        <div ref={messagesEndRef}/>
      </div>

      {/* Input Alanı */}
      <div className="p-4 bg-[#18181b] border-t border-zinc-800">
        <div className="flex gap-2 relative">
          <input 
            value={input} 
            onChange={e=>setInput(e.target.value)} 
            onKeyDown={e=>{if(e.key==='Enter') handleSend()}} 
            className="flex-1 bg-[#27272a] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-white placeholder-zinc-500 border border-zinc-700 transition-all" 
            placeholder="Örn: Mavi temalı bir yapılacaklar listesi yap..."
            disabled={isGenerating}
          />
          <button 
            onClick={handleSend} 
            disabled={isGenerating || !input.trim()} 
            className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-700 disabled:text-zinc-500 rounded-xl text-white transition-all shadow-lg shadow-indigo-500/20"
          >
            {isGenerating ? <Loader2 size={20} className="animate-spin"/> : <Send size={20}/>}
          </button>
        </div>
      </div>
    </div>
  );
}