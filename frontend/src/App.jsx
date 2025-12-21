import React, { useState } from 'react';
import ChatPanel from './components/ChatPanel';
import CodeEditor from './components/CodeEditor';
import { useStore } from './store/useStore';
import { FileCode, Trash2, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

export default function App() {
  const store = useStore();
  const [showEditor, setShowEditor] = useState(true);

  return (
    <main className="h-screen w-full bg-[#09090b] text-white flex overflow-hidden font-sans">
      
      {/* 1. SOL MENÜ (Dosya Listesi) */}
      <div className="w-[240px] border-r border-gray-800 flex flex-col bg-[#18181b] shrink-0">
        <div className="p-3 border-b border-gray-800 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-400 tracking-wider">DOSYALAR</span>
          <button 
            onClick={() => { if(confirm('Tüm dosyalar silinecek, emin misin?')) store.resetWorkspace(); }}
            className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
          >
            <Trash2 size={12}/> Temizle
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {store.files.map((file) => (
            <div 
              key={file.id} 
              onClick={() => { store.setActiveFile(file); setShowEditor(true); }}
              className={`flex items-center justify-between px-3 py-2 cursor-pointer rounded transition-all text-xs group ${
                store.activeFile?.id === file.id 
                  ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30' 
                  : 'text-gray-400 hover:bg-[#27272a] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <FileCode size={14} className="shrink-0" />
                <span className="truncate">{file.name}</span>
              </div>
              <button 
                onClick={(e)=>{e.stopPropagation(); if(confirm('Silinsin mi?')) store.deleteFile(file.id)}} 
                className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity"
              >
                <Trash2 size={12}/>
              </button>
            </div>
          ))}
          {store.files.length === 0 && (
            <div className="text-center mt-10 text-gray-600 text-xs px-4">
              Henüz dosya yok.<br/>Yapay zekadan bir şeyler iste!
            </div>
          )}
        </div>
      </div>

      {/* 2. ORTA ALAN (Chat) */}
      <div className={`flex flex-col bg-[#1e1e1e] border-r border-gray-800 transition-all duration-300 h-full ${showEditor ? 'w-[400px] shrink-0' : 'flex-1'}`}>
        <div className="h-10 border-b border-gray-800 px-4 flex justify-between items-center bg-[#1e1e1e] shrink-0">
          <span className="font-bold text-gray-300 text-xs">AI ASİSTAN</span>
          <button onClick={() => setShowEditor(!showEditor)} className="text-gray-400 hover:text-white transition-colors">
            {showEditor ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
          </button>
        </div>
        <div className="flex-1 overflow-hidden relative">
          <ChatPanel />
        </div>
      </div>

      {/* 3. SAĞ ALAN (Kod Editörü) */}
      {showEditor && (
        <div className="flex-1 bg-[#1e1e1e] flex flex-col min-w-0 h-full">
           <div className="h-10 bg-[#1e1e1e] border-b border-gray-800 flex items-center px-4 text-xs text-blue-400 font-mono">
              {store.activeFile ? store.activeFile.name : 'Dosya Seçilmedi'}
           </div>
           <div className="flex-1 overflow-hidden relative">
             <CodeEditor />
           </div>
        </div>
      )}

    </main>
  );
}