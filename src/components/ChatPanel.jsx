'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Play, CheckCheck, Loader2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { parseMessage } from '@/lib/messageParser';

export default function ChatPanel() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<any[]>([
    { role: 'assistant', content: 'Merhaba! Hangi uygulamayı kodlayalım?' }
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { files, addFile, updateFileContent, setActiveFile } = useStore();

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isGenerating]);

  // Dosya Ekleme/Güncelleme
  const handleApplyCode = (fileName: string, code: string) => {
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

  // Hepsini Uygula
  const handleApplyAll = (content: string) => {
    const parts = parseMessage(content);
    let count = 0;
    parts.forEach(part => {
      if (part.type === 'code' && part.fileName && part.code) {
        handleApplyCode(part.fileName, part.code);
        count++;
      }
    });
    if (count > 0) alert(`${count} dosya güncellendi!`);
  };

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;
    const userMessage = input;
    setInput('');
    setMessages(p => [...p, { role: 'user', content: userMessage }]);
    setIsGenerating(true);

    // Mevcut dosyaları bağlam olarak gönder (Sadece isim ve dil, içerik çok uzunsa kısabilirsin)
    let context = "";
    if (files.length > 0) {
      context = "\n\n=== MEVCUT DOSYALAR ===\n";
      files.forEach(f => { context += `[FILE: ${f.name}]\n\`\`\`${f.language}\n${f.content}\n\`\`\`\n`; });
    }

    try {
      // BURAYA DİKKAT: Kendi Render.com adresini yapıştır 👇
      const res = await fetch(' https://ai-coder-backend-9ou7.onrender.com/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `${userMessage}\n${context}` })
      });
      
      const data = await res.json();
      setMessages(p => [...p, { role: 'assistant', content: data.message }]);
    } catch (e) {
      setMessages(p => [...p, { role: 'assistant', content: 'Sunucuya bağlanılamadı. Backend çalışıyor mu?' }]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] text-white">
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-700">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
             <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'assistant' ? 'bg-blue-600' : 'bg-green-600'}`}>
               {msg.role === 'assistant' ? <Bot size={16}/> : <User size={16}/>}
             </div>
             <div className={`flex-1 max-w-[90%] p-3 rounded-lg text-sm ${msg.role === 'user' ? 'bg-green-900/30' : 'bg-[#27272a]'}`}>
                {parseMessage(msg.content).map((part, idx) => (
                  <div key={idx} className="mb-2">
                    {part.type === 'text' ? <div className="whitespace-pre-wrap">{part.content}</div> : (
                      <div className="mt-2 border border-gray-700 rounded bg-black">
                        <div className="flex justify-between px-2 py-1 bg-[#18181b] border-b border-gray-700 items-center">
                          <span className="text-xs text-blue-400 font-mono">{part.fileName}</span>
                          <button onClick={() => handleApplyCode(part.fileName!, part.code!)} className="text-[10px] bg-green-700 px-2 py-0.5 rounded text-white hover:bg-green-600"><Play size={10} /> Kaydet</button>
                        </div>
                        <pre className="p-2 text-xs overflow-x-auto text-gray-300 font-mono"><code>{part.code}</code></pre>
                      </div>
                    )}
                  </div>
                ))}
                {msg.role === 'assistant' && msg.content.includes('[FILE:') && (
                   <button onClick={() => handleApplyAll(msg.content)} className="mt-2 w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded flex items-center justify-center gap-2"><CheckCheck size={14}/> TÜMÜNÜ KAYDET</button>
                )}
             </div>
          </div>
        ))}
        {isGenerating && <div className="flex gap-2 items-center text-gray-500 text-xs pl-12"><Loader2 size={14} className="animate-spin text-blue-500"/><span>Düşünüyor...</span></div>}
        <div ref={messagesEndRef}/>
      </div>
      <div className="p-3 bg-[#18181b] border-t border-gray-800 flex gap-2">
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter') handleSend()}} className="flex-1 bg-[#27272a] rounded px-3 text-sm focus:outline-none text-white" placeholder="Ne yapalım?"/>
        <button onClick={handleSend} disabled={isGenerating} className="p-2 bg-blue-600 rounded text-white disabled:opacity-50"><Send size={16}/></button>
      </div>
    </div>
  );
}