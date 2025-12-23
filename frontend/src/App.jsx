import React, { useEffect } from 'react';
import { useStore } from './store/useStore';
import ChatPanel from './components/ChatPanel';
import { FileCode, Menu, Box } from 'lucide-react';
import Editor from '@monaco-editor/react';

function App() {
  const { files, activeFile, setActiveFile, updateFileContent } = useStore();

  return (
    <div className="flex h-screen w-full bg-[#09090b] text-white font-sans overflow-hidden">
      
      {/* 1. SOL PANEL: DOSYA GEZGİNİ (Daha şık ve belirgin) */}
      <div className="w-64 bg-[#121214] border-r border-[#27272a] flex flex-col">
        <div className="h-14 flex items-center px-4 border-b border-[#27272a] bg-[#121214]">
           <Box className="text-indigo-500 mr-2" size={20} />
           <span className="font-bold text-sm tracking-wide text-gray-200">PROJE DOSYALARI</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {files.map(file => (
            <div 
              key={file.id}
              onClick={() => setActiveFile(file)}
              className={`group flex items-center px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 border border-transparent
                ${activeFile?.id === file.id 
                  ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' 
                  : 'text-gray-400 hover:bg-[#27272a] hover:text-gray-200'}
              `}
            >
              <FileCode size={16} className={`mr-2.5 ${activeFile?.id === file.id ? 'text-indigo-400' : 'text-gray-500 group-hover:text-gray-300'}`} />
              <span className="text-sm font-medium truncate">{file.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. ORTA PANEL: SOHBET (Genişletildi: w-96 yerine w-[450px] veya flex) */}
      <div className="w-[450px] flex flex-col border-r border-[#27272a] bg-[#0c0c0e] shadow-2xl z-10">
        <ChatPanel />
      </div>

      {/* 3. SAĞ PANEL: KOD EDİTÖRÜ */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#09090b]">
        {activeFile ? (
          <>
            {/* Editör Başlığı */}
            <div className="h-14 flex items-center justify-between px-6 border-b border-[#27272a] bg-[#09090b]">
              <div className="flex items-center gap-2">
                <FileCode size={16} className="text-indigo-400"/>
                <span className="text-sm font-medium text-gray-300">{activeFile.name}</span>
              </div>
              <span className="text-xs text-gray-600 flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                Canlı Düzenleme
              </span>
            </div>
            
            {/* Monaco Editör */}
            <div className="flex-1 relative">
              <Editor
                height="100%"
                defaultLanguage={activeFile.language || 'javascript'}
                language={activeFile.language || 'javascript'}
                value={activeFile.content}
                theme="vs-dark"
                onChange={(value) => updateFileContent(activeFile.id, value)}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineHeight: 24,
                  padding: { top: 20 },
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  scrollBeyondLastLine: false,
                  smoothScrolling: true,
                }}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <div className="w-20 h-20 bg-[#18181b] rounded-2xl flex items-center justify-center mb-4 rotate-12">
               <FileCode size={40} className="text-gray-600"/>
            </div>
            <p className="text-lg font-medium">Bir dosya seçin veya AI ile oluşturun</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;