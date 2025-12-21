'use client';

import { useState } from 'react';
import ChatPanel from '@/components/ChatPanel';
import CodeEditor from '@/components/CodeEditor';
import { useStore } from '@/store/useStore';
import { FileCode, Trash2, PanelRightClose, PanelRightOpen, Code2 } from 'lucide-react';

export default function Home() {
  const store = useStore();
  const [showEditor, setShowEditor] = useState(true);

  return (
    <main className="h-screen w-full bg-[#09090b] text-white flex overflow-hidden font-sans">
      
      {/* 1. SOL MENÜ (Dosya Listesi) */}
      <div className="w-[250px] border-r border-gray-800 flex flex-col bg-[#18181b] shrink-0">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-400 tracking-wider">PROJE DOSYALARI</span>
          <button 
            onClick={() => { if(confirm('Tüm dosyalar silinecek?')) store.resetWorkspace(); }}
            className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
          >
            <Trash2 size={12}/> TEMİZLE
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {store.files.length === 0 && (
            <div className="mt-10 px-4 text-center">
              <Code2 size={24} className="mx-auto text-gray-700 mb-2"/>
              <p className="text-gray-500 text-xs">Henüz dosya yok.</p>
              <p className="text-gray-600 text-[10px] mt-1">Chat'ten bir uygulama iste, kodları buraya gelsin.</p>
            </div>
          )}
          
          {store.files
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((file) => (
            <div 
              key={file.id} 
              onClick={() => { store.setActiveFile(file); setShowEditor(true); }}
              className={`flex items-center justify-between px-3 py-2 cursor-pointer rounded transition-all text-xs border-l-2 ${
                store.activeFile?.id === file.id 
                  ? 'bg-[#27272a] text-blue-400 border-blue-500' 
                  : 'border-transparent text-gray-400 hover:bg-[#27272a] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <FileCode size={14} className="shrink-0" />
                <span className="truncate font-mono">{file.name}</span>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); store.deleteFile(file.id); }}
                className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 2. ORTA ALAN (Chat) */}
      <div className={`flex flex-col bg-[#1e1e1e] border-r border-gray-800 transition-all duration-300 h-full ${showEditor ? 'w-[450px] shrink-0' : 'flex-1'}`}>
        <div className="h-12 border-b border-gray-800 px-4 flex justify-between items-center bg-[#1e1e1e] shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-300 text-xs tracking-wide">AI ASİSTAN</span>
          </div>
          <button 
            onClick={() => setShowEditor(!showEditor)} 
            className="text-gray-500 hover:text-white transition-colors"
            title={showEditor ? "Editörü Gizle" : "Editörü Göster"}
          >
            {showEditor ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
          </button>
        </div>
        
        <div className="flex-1 overflow-hidden relative">
          <ChatPanel />
        </div>
      </div>

      {/* 3. SAĞ ALAN (Sadece Kod Editörü) */}
      {showEditor && (
        <div className="flex-1 bg-[#1e1e1e] flex flex-col min-w-0 h-full animate-in fade-in duration-300">
           {/* Editör Başlığı */}
           <div className="h-12 bg-[#1e1e1e] border-b border-gray-800 flex items-center px-4 text-xs gap-3 shrink-0">
              {store.activeFile ? (
                <>
                  <FileCode size={14} className="text-blue-400" />
                  <span className="text-gray-300 font-medium">{store.activeFile.name}</span>
                  <div className="flex-1" />
                  <span className="text-[10px] text-gray-600 uppercase tracking-wider">{store.activeFile.language}</span>
                </>
              ) : (
                <span className="text-gray-600 italic">Dosya görüntülemek için soldan seçim yapın.</span>
              )}
           </div>
           
           <div className="flex-1 overflow-hidden relative">
             <CodeEditor />
           </div>
        </div>
      )}

    </main>
  );
}