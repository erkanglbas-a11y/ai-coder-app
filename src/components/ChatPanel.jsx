import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Play, CheckCheck, Loader2 } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function ChatPanel() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Merhaba! Ben DevAI. Uygulamanı geliştirmek için buradayım.' }
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef(null);
  const { files, addFile, updateFileContent, setActiveFile } = useStore();

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Basit mesaj parser (Regex yerine basit split)
  const extractCode = (content) => {
    if (content.includes('```')) return 'code-block';
    return 'text';
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsGenerating(true);

    // Backend'e istek (NOT: Bu kısım Netlify'da çalışmayacak, localhost lazım)
    try {
      // Geçici olarak mock cevap verelim ki arayüzü test et
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Şu an demo modundayız. Backend bağlantısı için sunucunun aktif olması gerek.' }]);
        setIsGenerating(false);
      }, 1000);
      
      /* GERÇEK KOD BU OLACAKTI:
      const res = await fetch('http://localhost:3001/api/generate', { ... });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
      */
    } catch (e) {
      console.error(e);
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] text-white">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
             <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'assistant' ? 'bg-blue-600' : 'bg-green-600'}`}>
               {msg.role === 'assistant' ? <Bot size={16}/> : <User size={16}/>}
             </div>
             <div className={`flex-1 max-w-[90%] p-3 rounded-lg text-sm ${msg.role === 'user' ? 'bg-green-900/30' : 'bg-gray-800'}`}>
                {msg.content}
             </div>
          </div>
        ))}
        {isGenerating && <div className="text-gray-500 text-xs pl-12">Yazıyor...</div>}
        <div ref={messagesEndRef}/>
      </div>
      <div className="p-3 bg-[#18181b] border-t border-gray-800 flex gap-2">
        <input 
          value={input} 
          onChange={e=>setInput(e.target.value)} 
          onKeyDown={e=>{if(e.key==='Enter') handleSend()}}
          className="flex-1 bg-[#27272a] rounded px-3 py-2 text-sm outline-none text-white" 
          placeholder="Bir şeyler yaz..."
        />
        <button onClick={handleSend} className="p-2 bg-blue-600 rounded text-white"><Send size={16}/></button>
      </div>
    </div>
  );
}