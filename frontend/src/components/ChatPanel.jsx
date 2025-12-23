import React, { useState, useRef, useEffect } from 'react';
// DÜZELTME BURADA: 'FileCode' ikonunu import listesine ekledik 👇
import { Send, Bot, User, Play, CheckCheck, Loader2, Sparkles, Terminal, AlertTriangle, FileCode } from 'lucide-react';
import { useStore } from '../store/useStore';

// 🛡️ GÜVENLİ Mesaj Ayrıştırıcı
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
    { role: 'assistant', content: 'Merhaba! Ben AI Coder V12. 🧠\nSenin için bugün hangi projeyi geliştirelim?' }
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
        console.error("Dosya uygulama hatası:", err);
        alert("Dosya uygulanırken bir hata oluştu.");
    }
  };

  const handleApplyAll = (content) => {
    const parts = parseMessage(content);
    let count = 0;
    parts.forEach(part => { if (part.type === 'code' && part.code) { handleApplyCode(part.fileName, part.code); count++; } });
    if (count > 0) alert(`${count} dosya başarıyla işlendi! 🚀`);
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
      const res = await fetch('https://ai-coder-backend-9ou7.onrender.com/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `${userMessage}\n${context}` })
      });

      const textData = await res.text();
      let data;
      
      try {
          data = JSON.parse(textData);
      } catch (parseError) {
          throw new Error(`Sunucu geçersiz yanıt döndürdü: ${textData.substring(0, 50)}...`);
      }

      if (!res.ok) throw new Error(data.error || 'Bilinmeyen sunucu hatası');
      
      if (!data.message) {
          setMessages(p => [...p, { role: 'assistant', content: "⚠️ Yanıt boş geldi." }]);
      } else {
          setMessages(p => [...p, { role: 'assistant', content: data.message }]);
      }

    } catch (e) {
      console.error("Chat Hatası:", e);
      setMessages(p => [...p, { role: 'assistant', content: `❌ BİR HATA OLUŞTU:\n${e.message}` }]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0c0c0e] relative border-l border-[#27272a]">
      
      {/* HEADER */}
      <div className="h-14 shrink-0 border-b border-[#27272a] bg-[#0c0c0e]/95 backdrop-blur flex items-center justify-between px-5 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Bot size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-100 tracking-wide">AI ASİSTAN</h2>
            <p className="text-[10px] text-emerald-500 flex items-center gap-1 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> V12 Active
            </p>
          </div>
        </div>
        <button onClick={() => setMessages([])} className="p-2 hover:bg-[#27272a] rounded-lg transition-colors text-gray-500 hover:text-white" title="Sohbeti Temizle">
           <Terminal size={16} />
        </button>
      </div>

      {/* MESAJ ALANI */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent pb-32">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
             <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border border-white/5 ${msg.role === 'assistant' ? 'bg-[#18181b]' : 'bg-indigo-600'}`}>
               {msg.role === 'assistant' ? <Sparkles size={16} className="text-indigo-400"/> : <User size={16} className="text-white"/>}
             </div>

             <div className={`flex-1 max-w-[90%] space-y-2`}>
                <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-sm' 
                    : 'bg-[#18181b] text-gray-300 border border-[#27272a] rounded-tl-sm'
                }`}>
                  {msg.content.startsWith('❌') ? (
                      <div className="flex items-start gap-2 text-red-400">
                          <AlertTriangle size={18} className="shrink-0 mt-0.5"/>
                          <div className="whitespace-pre-wrap font-mono text-xs">{msg.content}</div>
                      </div>
                  ) : (
                    parseMessage(msg.content).map((part, idx) => (
                        <div key={idx} className="mb-2 last:mb-0">
                        {part.type === 'text' ? (
                            <div className="whitespace-pre-wrap">{part.content}</div>
                        ) : (
                            <div className="my-3 rounded-lg overflow-hidden border border-[#27272a] bg-[#09090b]">
                            <div className="flex justify-between items-center px-3 py-2 bg-[#121214] border-b border-[#27272a]">
                                <span className="text-xs text-indigo-400 font-mono flex items-center gap-1.5">
                                {/* İŞTE HATANIN SEBEBİ BURADAYDI, ARTIK TANIMLI 👇 */}
                                <FileCode size={12}/> {part.fileName || 'snippet'}
                                </span>
                                <button 
                                onClick={() => handleApplyCode(part.fileName, part.code)} 
                                className="text-[10px] bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 hover:text-indigo-200 px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 border border-indigo-500/20"
                                >
                                <Play size={10} /> Uygula
                                </button>
                            </div>
                            <div className="p-3 overflow-x-auto bg-[#050505]">
                                <pre className="text-xs text-gray-300 font-mono leading-5"><code>{part.code}</code></pre>
                            </div>
                            </div>
                        )}
                        </div>
                    ))
                  )}
                </div>
                {msg.role === 'assistant' && msg.content.includes('[FILE:') && (
                   <button onClick={() => handleApplyAll(msg.content)} className="ml-1 px-4 py-2 bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/10"><CheckCheck size={14}/> TÜMÜNÜ UYGULA</button>
                )}
             </div>
          </div>
        ))}
        
        {isGenerating && (
          <div className="flex gap-3 pl-2 opacity-70">
             <div className="w-8 h-8 rounded-full bg-[#18181b] flex items-center justify-center"><Loader2 size={16} className="animate-spin text-indigo-400"/></div>
             <div className="text-xs text-gray-500 flex items-center">V12 Düşünüyor...</div>
          </div>
        )}
        <div ref={messagesEndRef}/>
      </div>

      {/* INPUT ALANI */}
      <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-[#0c0c0e] via-[#0c0c0e] to-transparent z-20">
        <div className="relative flex items-end gap-2 bg-[#18181b] p-2 rounded-xl border border-[#27272a] focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all shadow-2xl">
          <textarea 
            value={input} 
            onChange={e=>setInput(e.target.value)} 
            onKeyDown={e=>{if(e.key==='Enter' && !e.shiftKey) {e.preventDefault(); handleSend();}}} 
            className="w-full bg-transparent text-sm text-white placeholder-gray-500 px-3 py-2.5 max-h-32 min-h-[44px] focus:outline-none resize-none scrollbar-hide font-sans" 
            placeholder="Bir uygulama hayal et..."
            disabled={isGenerating}
            rows={1}
          />
          <button onClick={handleSend} disabled={isGenerating || !input.trim()} className="mb-1 p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-[#27272a] disabled:text-gray-600 rounded-lg text-white transition-all shadow-lg shadow-indigo-500/20 shrink-0">
            {isGenerating ? <Loader2 size={18} className="animate-spin"/> : <Send size={18}/>}
          </button>
        </div>
      </div>
    </div>
  );
}