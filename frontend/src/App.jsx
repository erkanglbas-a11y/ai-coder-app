import React, { useState } from 'react';
import { useStore } from './store/useStore';
import ChatPanel from './components/ChatPanel';
import { FileCode, Menu, Box, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import Editor from '@monaco-editor/react';

function App() {
  const { files, activeFile, setActiveFile, updateFileContent } = useStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Sidebar durumu

  return (
    <div className="flex h-screen w-full bg-[#09090b] text-white font-sans overflow-hidden">
      
      {/* 1. SOL PANEL: DOSYA GEZGİNİ (Açılıp Kapanabilir) */}
      {isSidebarOpen && (
        <div className="w-64 bg-[#121214] border-r border-[#27272a] flex flex-col shrink-0 transition-all duration-300">
          <div className="h-14 flex items-center justify-between px-4 border-b border-[#27272a] bg-[#121214]">
             <div className="flex items-center gap-2">
                <Box className="text-indigo-500" size={20} />
                <span className="font-bold text-xs tracking-wider text-gray-300">PROJE</span>
             </div>
             <button onClick={() => setIsSidebarOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                <PanelLeftClose size={18} />
             </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {files.length === 0 && (
              <div className="text-center text-xs text-gray-600 mt-10">Dosya yok</div>
            )}
            {files.map(file => (
              <div 
                key={file.id}
                onClick={() => setActiveFile(file)}
                className={`group flex items-center px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 border border-transparent
                  ${activeFile?.id === file.id 
                    ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' 
                    : 'text-gray-400 hover:bg-[#27272a] hover:text-gray-200'}
                `}
              >
                <FileCode size={16} className={`mr-2.5 shrink-0 ${activeFile?.id === file.id ? 'text-indigo-400' : 'text-gray-500 group-hover:text-gray-300'}`} />
                <span className="text-sm font-medium truncate">{file.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sidebar Kapalıyken Açma Butonu */}
      {!isSidebarOpen && (
        <div className="w-12 border-r border-[#27272a] bg-[#121214] flex flex-col items-center py-4 shrink-0">
           <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-[#27272a] rounded-lg text-gray-400 hover:text-white hover:bg-indigo-600 transition-all mb-4">
              <PanelLeftOpen size={20} />
           </button>
           <div className="flex-1 w-full flex justify-center">
              <div className="writing-vertical-lr text-xs text-gray-600 font-bold tracking-widest rotate-180">PROJE DOSYALARI</div>
           </div>
        </div>
      )}

      {/* 2. ORTA PANEL: SOHBET (Genişletildi: 500px) */}
      <div className="w-[500px] flex flex-col border-r border-[#27272a] bg-[#0c0c0e] shadow-2xl z-10 shrink-0">
        <ChatPanel />
      </div>

      {/* 3. SAĞ PANEL: KOD EDİTÖRÜ */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#09090b]">
        {activeFile ? (
          <>
            <div className="h-14 flex items-center justify-between px-6 border-b border-[#27272a] bg-[#09090b]">
              <div className="flex items-center gap-2">
                <FileCode size={16} className="text-indigo-400"/>
                <span className="text-sm font-medium text-gray-300">{activeFile.name}</span>
              </div>
              <span className="text-xs text-gray-600 flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                 Düzenleme Modu
              </span>
            </div>
            
            <div className="flex-1 relative overflow-hidden">
              <Editor
                height="100%"
                defaultLanguage={activeFile.language || 'javascript'}
                language={activeFile.language || 'javascript'}
                value={activeFile.content || ''}
                theme="vs-dark"
                onChange={(value) => updateFileContent(activeFile.id, value || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineHeight: 24,
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  padding: { top: 20 },
                  scrollBeyondLastLine: false,
                  automaticLayout: true, // Sidebar açılıp kapanınca editör bozulmasın diye
                }}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 bg-[#09090b]">
            <div className="w-24 h-24 bg-[#18181b] rounded-3xl flex items-center justify-center mb-6 shadow-xl border border-[#27272a]">
               <FileCode size={48} className="text-gray-600 opacity-50"/>
            </div>
            <h3 className="text-lg font-semibold text-gray-400 mb-2">Dosya Seçilmedi</h3>
            <p className="text-sm text-gray-600">AI ile bir dosya oluşturun veya soldan seçin.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;