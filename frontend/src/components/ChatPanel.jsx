import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Play, CheckCheck, Loader2, AlertCircle } from 'lucide-react';
import { useStore } from '../store/useStore';

// Mesaj Ayrıştırıcı (Aynı kalıyor)
const parseMessage = (content) => {
  if (!content || typeof content !== 'string') return [{ type: 'text', content: '...' }];
  const parts = [];
  const lines = content.split('\n');
  let inCode = false;
  let currentText = '';
  let currentCode = '';
  let fileName = '';

  lines.forEach(line => {
    if (line.trim().startsWith('[FILE:')) {
      if (currentText) { parts.push({ type: 'text', content: currentText }); currentText = ''; }
      fileName = line.replace('[FILE:', '').replace(']', '').trim();
    } else if (line.trim().startsWith('```')) {
      if (inCode) {
        parts.push({ type: 'code', fileName, code: currentCode.trim() });
        currentCode = ''; fileName = ''; inCode = false;
      } else {
        if (currentText) { parts.push({ type: 'text', content: currentText }); currentText = ''; }
        inCode = true;
      }
    } else {
      if (inCode) currentCode += line + '\n'; else currentText += line + '\n';
    }
  });
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

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isGenerating]);

  const handleApplyCode = (fileName, code) => {
    if (!fileName) fileName = "untitled";
    const cleanName = fileName.trim();
    const existing = files.find(f => f.name === cleanName);
    if (existing) { updateFileContent(existing.id, code); setActiveFile(existing); }
    else {
      const newFile = { id: Math.random().toString(36).substr(2, 9), name: cleanName, language: cleanName.split('.').pop() || 'js', content: code };
      addFile(newFile); setActiveFile(newFile);
    }
  };

  const handleApplyAll = (content) => {
    const parts = parseMessage(content);
    let count = 0;
    parts.forEach(part => { if (part.type === 'code' && part.code) { handleApplyCode(part.fileName, part.code); count++; } });
    if (count > 0) alert(`${count} dosya işlendi! ✅`);
  };

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;
    const userMessage = input;
    setInput('');
    setMessages(p => [...p, { role: 'user', content: userMessage }]);
    setIsGenerating(true);

    let context = "";
    if (files.length > 0) {
      files.forEach(f => { context += `[FILE: ${f.name}]\n\`\`\`${f.language}\n${f.content}\n\`\`\`\n`; });
    }

    try {
      console.log("📡 İstek gönderiliyor...");
      
      const res = await fetch('[https://ai-coder-backend-9ou7.onrender.com/api/generate](https://ai-coder-backend-9ou7.onrender.com/api/generate)', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `${userMessage}\n${context}` })
      });

      console.log("📥 Sunucu Yanıt Durumu:", res.status);

      // Yanıtı önce DÜZ METİN (Text) olarak alalım
      const textData = await res.text();
      console.log("📝 Backend'den Gelen Ham Veri:", textData);

      if (!res.ok) {
        throw new Error(`Sunucu Hatası (${res.status}): ${textData}`);
      }

      // Eğer gelen veri boşsa hata fırlat
      if (!textData || textData.trim() === "") {
        throw new Error("Backend boş yanıt gönderdi!");
      }

      // Şimdi JSON'a çevirmeyi dene
      const data = JSON.parse(textData);
      
      if (data.message) {
        setMessages(p => [...p, { role: 'assistant', content: data.message }]);
      } else {
        setMessages(p => [...p, { role: 'assistant', content: '⚠️ Mesaj formatı hatalı.' }]);
      }

    } catch (e) {
      console.error("❌ FRONTEND HATASI:", e);
      setMessages(p => [...p, { role: 'assistant', content: `❌ HATA: ${e.message}` }]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] text-white font-sans">
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
             <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-lg ${msg.role === 'assistant' ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-zinc-700'}`}>
               {msg.role === 'assistant' ? <Bot size={18} className="text-white"/> : <User size={18} className="text-gray-300"/>}
             </div>
             <div className={`flex-1 max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-md ${msg.role === 'user' ? 'bg-zinc-800 text-gray-100 rounded-tr-none' : 'bg-[#27272a] text-gray-200 rounded-tl-none border border-zinc-700/50'}`}>
                {parseMessage(msg.content).map((part, idx) => (
                  <div key={idx} className="mb-3 last:mb-0">
                    {part.type === 'text' ? <div className="whitespace-pre-wrap">{part.content}</div> : (
                      <div className="mt-3 border border-zinc-700 rounded-lg overflow-hidden bg-[#09090b]">
                        <div className="flex justify-between items-center px-3 py-2 bg-[#18181b] border-b border-zinc-800">
                          <span className="text-xs text-blue-400 font-mono flex items-center gap-1"><AlertCircle size={10}/> {part.fileName}</span>
                          <button onClick={() => handleApplyCode(part.fileName, part.code)} className="text-[10px] bg-green-700 hover:bg-green-600 px-2 py-1 rounded text-white flex gap-1 items-center"><Play size={10} /> Çalıştır</button>
                        </div>
                        <div className="p-3 overflow-x-auto"><pre className="text-xs text-gray-300 font-mono"><code>{part.code}</code></pre></div>
                      </div>
                    )}
                  </div>
                ))}
                {msg.role === 'assistant' && msg.content.includes('[FILE:') && (
                   <button onClick={() => handleApplyAll(msg.content)} className="mt-4 w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 shadow-lg"><CheckCheck size={14}/> TÜMÜNÜ UYGULA</button>
                )}
             </div>
          </div>
        ))}
        {isGenerating && <div className="flex gap-3 animate-pulse pl-2"><div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center"><Loader2 size={16} className="animate-spin text-indigo-400"/></div><div className="text-xs text-gray-500 flex items-center">Backend bekleniyor...</div></div>}
        <div ref={messagesEndRef}/>
      </div>
      <div className="p-4 bg-[#18181b] border-t border-zinc-800 flex gap-2">
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter') handleSend()}} className="flex-1 bg-[#27272a] rounded-xl px-4 py-3 text-sm focus:outline-none text-white placeholder-zinc-500 border border-zinc-700" placeholder="Ne yapalım?" disabled={isGenerating}/>
        <button onClick={handleSend} disabled={isGenerating || !input.trim()} className="p-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white disabled:bg-zinc-700"><Send size={20}/></button>
      </div>
    </div>
  );
}