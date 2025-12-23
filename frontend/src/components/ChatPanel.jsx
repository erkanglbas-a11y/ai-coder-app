import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Play, CheckCheck, Loader2, Sparkles, Terminal, AlertTriangle, FileCode } from 'lucide-react';
import { useStore } from '../store/useStore';

// 🛡️ GÜVENLİ VE AKILLI Mesaj Ayrıştırıcı (REGEX Eklendi)
const parseMessage = (content) => {
  if (!content) return [{ type: 'text', content: '' }];
  if (typeof content !== 'string') return [{ type: 'text', content: 'İçerik okunamadı.' }];

  const parts = [];
  const lines = content.split('\n');
  let inCode = false;
  let currentText = '';
  let currentCode = '';
  let fileName = '';

  lines.forEach(line => {
    // DÜZELTME: Satırın neresinde olursa olsun [FILE: ...] yapısını yakala
    const fileMatch = line.match(/\[FILE:\s*(.*?)\]/);
    
    if (fileMatch) {
      if (currentText) { parts.push({ type: 'text', content: currentText }); currentText = ''; }
      fileName = fileMatch[1].trim(); // Dosya adını temizle
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
    { role: 'assistant', content: 'Merhaba! Ben AI Coder V12. 🧠\nHata düzeltildi, panel genişletildi. Hazırım!' }
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef(null);

  const { files, addFile, updateFileContent, setActiveFile } = useStore();

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isGenerating]);

  const handleApplyCode = (fileName, code) => {
    try {
        if (!fileName) fileName = "untitled.js";
        const cleanName = fileName.trim();
        const existing = files.find(f => f.name === cleanName);
        if (existing) { updateFileContent(existing.id, code); setActiveFile(existing); }
        else {
        const newFile = { id: Math.random().toString(36).substr(2, 9), name: cleanName, language: cleanName.split('.').pop() || 'js', content: code };
        addFile(newFile); setActiveFile(newFile);
        }
    } catch (err) {
        console.error("Dosya hata:", err);
    }
  };

  const handleApplyAll = (content) => {
    const parts = parseMessage(content);
    let count = 0;
    parts.forEach(part => { if (part.type === 'code' && part.code) { handleApplyCode(part.fileName, part.code); count++; } });
    if (count > 0) alert(`${count} dosya güncellendi! 🚀`);
  };

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;
    const userMessageContent = input;
    const newUserMessage = { role: 'user', content: userMessageContent };
    
    setInput('');
    setMessages(prev => [...prev, newUserMessage]);
    setIsGenerating(true);

    let context = "";
    if (files.length > 0) {
      context = "\n\n=== MEVCUT DOSYALAR ===\n";
      files.forEach(f => { context += `[FILE: ${f.name}]\n\`\`\`${f.language}\n${f.content}\n\`\`\`\n`; });
    }

    try {
      const apiMessages = [...messages, { role: 'user', content: userMessageContent + context }];
      const res = await fetch('https://ai-coder-backend-9ou7.onrender.com/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages })
      });

      const textData = await res.text();
      const data = JSON.parse(textData);

      if (!data.message) throw new Error("Boş yanıt");
      setMessages(p => [...p, { role: 'assistant', content: data.message }]);

    } catch (e) {
      setMessages(p => [...p, { role: 'assistant', content: `❌ HATA: ${e.message}` }]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0c0c0e] relative border-l border-[#27272a]">
      
      {/* HEADER - Aynı */}
      <div className="h-14 shrink-0 border-b border-[#27272a] bg-[#0c0c0e]/95 backdrop-blur flex items-center justify-between px-5 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg">
            <Bot size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-100">AI ASİSTAN</h2>
            <p className="text-[10px] text-emerald-500 font-medium">V12 Active</p>
          </div>
        </div>
        <button onClick={() => setMessages([])} className="text-gray-500 hover:text-white"><Terminal size={16} /></button>
      </div>

      {/* MESAJ ALANI - Aynı */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800 pb-40">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
             <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border border-white/5 ${msg.role === 'assistant' ? 'bg-[#18181b]' : 'bg-indigo-600'}`}>
               {msg.role === 'assistant' ? <Sparkles size={16} className="text-indigo-400"/> : <User size={16} className="text-white"/>}
             </div>
             <div className={`flex-1 max-w-[90%] space-y-2`}>
                <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-[#18181b] text-gray-300 border border-[#27272a]'}`}>
                  {parseMessage(msg.content).map((part, idx) => (
                    <div key={idx} className="mb-2">
                        {part.type === 'text' ? <div className="whitespace-pre-wrap">{part.content}</div> : (
                            <div className="my-3 rounded-lg overflow-hidden border border-[#27272a] bg-[#09090b]">
                                <div className="flex justify-between items-center px-3 py-2 bg-[#121214] border-b border-[#27272a]">
                                    <span className="text-xs text-indigo-400 font-mono flex items-center gap-1.5"><FileCode size={12}/> {part.fileName}</span>
                                    <button onClick={() => handleApplyCode(part.fileName, part.code)} className="text-[10px] bg-indigo-500/10 text-indigo-300 px-2 py-1 rounded flex gap-1"><Play size={10} /> Uygula</button>
                                </div>
                                <div className="p-3 overflow-x-auto bg-[#050505]"><pre className="text-xs text-gray-300 font-mono"><code>{part.code}</code></pre></div>
                            </div>
                        )}
                    </div>
                  ))}
                </div>
                {msg.role === 'assistant' && msg.content.includes('[FILE:') && (
                   <button onClick={() => handleApplyAll(msg.content)} className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg flex items-center gap-2"><CheckCheck size={14}/> TÜMÜNÜ UYGULA</button>
                )}
             </div>
          </div>
        ))}
        {isGenerating && <div className="flex gap-3 pl-2 opacity-70"><Loader2 size={16} className="animate-spin text-indigo-400"/><span className="text-xs text-gray-500">Yazıyor...</span></div>}
        <div ref={messagesEndRef}/>
      </div>

      {/* INPUT ALANI (GÜNCELLENDİ: Daha Büyük ve Şık) */}
      <div className="absolute bottom-0 left-0 w-full p-5 bg-[#0c0c0e] border-t border-[#27272a] z-30">
        <div className="relative flex flex-col gap-2 bg-[#18181b] p-3 rounded-2xl border border-[#27272a] focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all shadow-xl">
          <textarea 
            value={input} 
            onChange={e=>setInput(e.target.value)} 
            onKeyDown={e=>{if(e.key==='Enter' && !e.shiftKey) {e.preventDefault(); handleSend();}}} 
            // DÜZELTME BURADA: min-h-[80px] yaptık
            className="w-full bg-transparent text-sm text-white placeholder-gray-500 px-2 py-1 min-h-[80px] max-h-60 focus:outline-none resize-none scrollbar-hide font-sans leading-relaxed" 
            placeholder="Bir uygulama hayal et... (Shift+Enter ile alt satıra geç)"
            disabled={isGenerating}
          />
          <div className="flex justify-between items-center border-t border-[#27272a] pt-2 mt-1">
             <span className="text-[10px] text-gray-600 pl-2">V12 Model • GPT-4o</span>
             <button onClick={handleSend} disabled={isGenerating || !input.trim()} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-[#27272a] disabled:text-gray-600 rounded-xl text-white transition-all shadow-lg shadow-indigo-500/20 font-medium text-xs flex items-center gap-2">
                {isGenerating ? <> <Loader2 size={14} className="animate-spin"/> Düşünüyor </> : <> <Send size={14}/> Gönder </>}
             </button>
          </div>
        </div>
      </div>

    </div>
  );
}