import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Play, CheckCheck, Loader2, Sparkles, Terminal, FileCode, Paperclip, X, FileText, FolderUp, Folder, AlertCircle, Plus, MessageSquare, Trash2, Layout, Menu } from 'lucide-react';
import { useStore } from '../store/useStore';

// 🛡️ Mesaj Ayrıştırıcı (Aynı Kalıyor)
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
        const fileMatch = line.match(/\[FILE:\s*(.*?)\]/);
        if (fileMatch) {
            if (currentText) { parts.push({ type: 'text', content: currentText }); currentText = ''; }
            fileName = fileMatch[1].trim();
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

// --- YENİ BİLEŞEN: SOHBET GEÇMİŞİ SIDEBAR ---
const Sidebar = ({ sessions, activeId, onSelect, onNew, onDelete }) => (
    <div className="w-64 bg-[#09090b] border-r border-[#27272a] flex flex-col h-full shrink-0">
        <div className="p-4 border-b border-[#27272a]">
            <button 
                onClick={onNew}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-900/20"
            >
                <Plus size={16} /> YENİ SOHBET
            </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-zinc-800">
            <h3 className="text-[10px] font-bold text-gray-500 px-2 py-2">GEÇMİŞ SOHBETLER</h3>
            {sessions.map(session => (
                <div 
                    key={session.id}
                    className={`group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border ${activeId === session.id ? 'bg-[#18181b] border-indigo-500/30 text-white' : 'text-gray-400 border-transparent hover:bg-[#18181b] hover:text-gray-200'}`}
                    onClick={() => onSelect(session.id)}
                >
                    <MessageSquare size={14} className={activeId === session.id ? 'text-indigo-400' : 'text-gray-600'} />
                    <div className="flex-1 truncate text-xs font-medium">
                        {session.title || "Yeni Sohbet"}
                    </div>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(session.id); }}
                        className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 p-1"
                    >
                        <Trash2 size={12} />
                    </button>
                </div>
            ))}
            {sessions.length === 0 && (
                <div className="text-center py-10 opacity-30 text-xs">Henüz sohbet yok.</div>
            )}
        </div>
    </div>
);

export default function ChatPanel() {
    // STATE YÖNETİMİ
    const [sessions, setSessions] = useState(() => {
        // LocalStorage'dan geçmişi çek
        const saved = localStorage.getItem('chat_sessions');
        return saved ? JSON.parse(saved) : [{ id: 1, title: 'Yeni Sohbet', messages: [] }];
    });
    
    const [activeSessionId, setActiveSessionId] = useState(() => {
        const savedId = localStorage.getItem('active_session_id');
        return savedId ? parseInt(savedId) : 1;
    });

    // Aktif oturumun mesajlarını bul
    const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
    const messages = activeSession?.messages || [];

    const [input, setInput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isReadingFiles, setIsReadingFiles] = useState(false);
    const [warningMsg, setWarningMsg] = useState(null);
    const [attachment, setAttachment] = useState(null);
    const [showSidebar, setShowSidebar] = useState(true); // Mobilde sidebar aç/kapa

    const fileInputRef = useRef(null);
    const folderInputRef = useRef(null);
    const messagesEndRef = useRef(null);
    const { files, addFile, updateFileContent, setActiveFile } = useStore();

    // SESSIONS DEĞİŞİNCE KAYDET
    useEffect(() => {
        localStorage.setItem('chat_sessions', JSON.stringify(sessions));
        localStorage.setItem('active_session_id', activeSessionId.toString());
    }, [sessions, activeSessionId]);

    // Scroll ayarı
    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isGenerating]);

    // --- YENİ SOHBET FONKSİYONLARI ---
    const createNewSession = () => {
        const newId = Date.now();
        const newSession = { 
            id: newId, 
            title: 'Yeni Sohbet', 
            messages: [{ role: 'assistant', content: 'Merhaba! Ben AI Coder. 🧠\nYeni bir sayfa açtım. Nasıl yardımcı olabilirim? 🚀' }] 
        };
        setSessions(prev => [newSession, ...prev]);
        setActiveSessionId(newId);
    };

    const deleteSession = (id) => {
        const filtered = sessions.filter(s => s.id !== id);
        if (filtered.length === 0) {
            // Hepsi silindiyse varsayılan oluştur
            createNewSession();
        } else {
            setSessions(filtered);
            if (activeSessionId === id) setActiveSessionId(filtered[0].id);
        }
    };

    const updateActiveSessionMessages = (newMessages) => {
        setSessions(prev => prev.map(s => {
            if (s.id === activeSessionId) {
                // Başlık güncelleme mantığı (İlk kullanıcı mesajını başlık yap)
                let newTitle = s.title;
                const firstUserMsg = newMessages.find(m => m.role === 'user');
                if (firstUserMsg && s.title === 'Yeni Sohbet') {
                    newTitle = firstUserMsg.content.slice(0, 30) + (firstUserMsg.content.length > 30 ? '...' : '');
                }
                return { ...s, messages: newMessages, title: newTitle };
            }
            return s;
        }));
    };

    // --- DOSYA İŞLEMLERİ (AYNI) ---
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            setAttachment({ type: 'single', name: file.name, content: event.target.result, size: file.size });
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleFolderSelect = async (e) => {
        setIsReadingFiles(true);
        const selectedFiles = Array.from(e.target.files);
        if (selectedFiles.length === 0) { setIsReadingFiles(false); return; }

        let folderContent = "";
        let fileCount = 0;
        let totalChars = 0;
        const MAX_CHARS = 500000;
        
        // Basitleştirilmiş okuma mantığı
        const ignoreList = ['node_modules', '.git', 'dist', 'build', 'package-lock.json', '.ico', '.png', '.jpg'];
        
        for (const file of selectedFiles) {
             if (totalChars > MAX_CHARS) break;
             const relPath = file.webkitRelativePath;
             if (ignoreList.some(ig => relPath.includes(ig))) continue;
             if (!file.name.match(/\.(js|jsx|ts|tsx|css|html|json|md|txt)$/i)) continue;

             const text = await file.text();
             folderContent += `\n[FILE: ${relPath}]\n\`\`\`\n${text}\n\`\`\`\n`;
             fileCount++;
             totalChars += text.length;
        }

        setAttachment({ type: 'folder', name: "Proje Klasörü", stats: `${fileCount} dosya`, content: folderContent });
        setWarningMsg(`✅ ${fileCount} dosya analize hazır.`);
        setIsReadingFiles(false);
        e.target.value = '';
    };

    const handleApplyCode = (fileName, code) => { /* ...Eski mantıkla aynı... */ };
    const handleApplyAll = (content) => { /* ...Eski mantıkla aynı... */ };

    // --- API İLETİŞİMİ (GÜNCELLENDİ: SESSİON STATE KULLANIYOR) ---
    const handleSend = async () => {
        if ((!input.trim() && !attachment) || isGenerating) return;

        let userMessageContent = input;
        if (attachment) {
            const prefix = attachment.type === 'folder' ? 'PROJE ANALİZİ' : 'DOSYA';
            userMessageContent += `\n\n--- ${prefix}: ${attachment.name} ---\n${attachment.content}\n`;
        }

        const newUserMessage = { 
            role: 'user', 
            content: userMessageContent, 
            display: attachment ? `${input}\n📂 [${attachment.name}] eklendi.` : input 
        };

        // 1. Kullanıcı mesajını ekle
        const updatedMessages = [...messages, newUserMessage];
        updateActiveSessionMessages(updatedMessages);

        setInput('');
        setAttachment(null);
        setIsGenerating(true);

        // API İsteği
        try {
            // Mesaj geçmişini hazırla
            const apiMessages = updatedMessages.map(m => ({ role: m.role, content: m.content }));
            
            // Backend URL
            const BACKEND_URL = import.meta.env.VITE_API_URL || "[https://ai-coder-backend-9ou7.onrender.com](https://ai-coder-backend-9ou7.onrender.com)";

            const response = await fetch(`${BACKEND_URL}/api/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: apiMessages })
            });

            if (!response.ok) throw new Error("Sunucu hatası");
            const data = await response.json();

            // 2. AI Yanıtını Ekle
            updateActiveSessionMessages([...updatedMessages, { role: 'assistant', content: data.message }]);

        } catch (e) {
            updateActiveSessionMessages([...updatedMessages, { role: 'assistant', content: `❌ Hata: ${e.message}` }]);
        } finally {
            setIsGenerating(false);
        }
    };

    // --- RENDER ---
    return (
        <div className="flex h-full bg-[#0c0c0e] text-gray-100 font-sans overflow-hidden">
            
            {/* SIDEBAR (GEÇMİŞ) */}
            {showSidebar && (
                <Sidebar 
                    sessions={sessions} 
                    activeId={activeSessionId} 
                    onSelect={setActiveSessionId} 
                    onNew={createNewSession}
                    onDelete={deleteSession}
                />
            )}

            {/* ANA SOHBET ALANI */}
            <div className="flex-1 flex flex-col relative min-w-0">
                
                {/* HEADER */}
                <div className="h-14 border-b border-[#27272a] bg-[#0c0c0e]/95 backdrop-blur flex items-center justify-between px-5 sticky top-0 z-20">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setShowSidebar(!showSidebar)} className="text-gray-400 hover:text-white mr-2">
                            {showSidebar ? <Layout size={18} /> : <Menu size={18} />}
                        </button>
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg">
                            <Bot size={18} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-gray-100 tracking-wide">AI CODER</h2>
                            <p className="text-[10px] text-emerald-500 font-medium flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                Online • {activeSession.title}
                            </p>
                        </div>
                    </div>
                </div>

                {/* MESAJ LİSTESİ */}
                <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800 pb-40">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full opacity-30 gap-4">
                            <Sparkles size={48} className="text-indigo-500" />
                            <p>Sohbete başlamak için bir şeyler yaz...</p>
                        </div>
                    )}
                    
                    {messages.map((msg, i) => (
                        <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2`}>
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border border-white/5 shadow-md ${msg.role === 'assistant' ? 'bg-[#18181b]' : 'bg-indigo-600'}`}>
                                {msg.role === 'assistant' ? <Sparkles size={16} className="text-indigo-400" /> : <User size={16} className="text-white" />}
                            </div>
                            <div className={`flex-1 max-w-[90%] space-y-2`}>
                                <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-[#18181b] text-gray-300 border border-[#27272a]'}`}>
                                    {parseMessage(msg.display || msg.content).map((part, idx) => (
                                        <div key={idx} className="mb-2 last:mb-0">
                                            {part.type === 'text' ? <div className="whitespace-pre-wrap">{part.content}</div> : (
                                                <div className="my-3 rounded-lg overflow-hidden border border-[#27272a] bg-[#09090b] shadow-inner">
                                                    <div className="flex justify-between items-center px-3 py-2 bg-[#121214] border-b border-[#27272a]">
                                                        <span className="text-xs text-indigo-400 font-mono flex items-center gap-1.5"><FileCode size={12} /> {part.fileName}</span>
                                                    </div>
                                                    <div className="p-3 overflow-x-auto bg-[#050505]"><pre className="text-xs text-gray-300 font-mono"><code>{part.code}</code></pre></div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                    {isReadingFiles && <div className="flex gap-3 pl-2 opacity-70"><Loader2 size={16} className="animate-spin text-yellow-500" /><span className="text-xs text-yellow-500">Dosyalar işleniyor...</span></div>}
                    {isGenerating && <div className="flex gap-3 pl-2 opacity-70"><Loader2 size={16} className="animate-spin text-indigo-400" /><span className="text-xs text-gray-500">Yazıyor...</span></div>}
                    <div ref={messagesEndRef} />
                </div>

                {/* INPUT ALANI */}
                <div className="absolute bottom-0 left-0 w-full p-5 bg-gradient-to-t from-[#0c0c0e] via-[#0c0c0e] to-transparent z-30">
                    {warningMsg && (
                        <div className="absolute -top-5 left-5 right-5 flex justify-center">
                            <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-medium backdrop-blur">
                                {warningMsg}
                            </div>
                        </div>
                    )}

                    <div className="relative flex flex-col gap-2 bg-[#18181b]/90 backdrop-blur p-3 rounded-2xl border border-[#27272a] focus-within:border-indigo-500/50 shadow-2xl transition-all">
                        {attachment && (
                            <div className="flex items-center gap-2 bg-[#27272a] self-start px-3 py-1.5 rounded-lg border border-indigo-500/30 mb-2">
                                {attachment.type === 'folder' ? <Folder size={14} className="text-yellow-400" /> : <FileText size={14} className="text-indigo-400" />}
                                <span className="text-xs text-gray-200 font-medium truncate max-w-[200px]">{attachment.name}</span>
                                <button onClick={() => setAttachment(null)} className="ml-1 text-gray-500 hover:text-red-400"><X size={14} /></button>
                            </div>
                        )}

                        <textarea
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                            className="w-full bg-transparent text-sm text-white placeholder-zinc-500 px-2 min-h-[50px] max-h-40 focus:outline-none resize-none font-medium"
                            placeholder="Bir şeyler sor veya kod iste..."
                            disabled={isGenerating}
                        />

                        <div className="flex justify-between items-center border-t border-[#27272a] pt-2">
                            <div className="flex items-center gap-1">
                                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
                                <button onClick={() => fileInputRef.current?.click()} className="p-2 text-zinc-400 hover:text-indigo-400 hover:bg-[#27272a] rounded-lg transition-colors"><Paperclip size={18} /></button>
                                
                                <input type="file" ref={folderInputRef} className="hidden" onChange={handleFolderSelect} webkitdirectory="" directory="" multiple />
                                <button onClick={() => folderInputRef.current?.click()} className="p-2 text-zinc-400 hover:text-yellow-400 hover:bg-[#27272a] rounded-lg transition-colors"><FolderUp size={18} /></button>
                            </div>

                            <button onClick={handleSend} disabled={isGenerating || (!input.trim() && !attachment)} className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2">
                                {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                GÖNDER
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}