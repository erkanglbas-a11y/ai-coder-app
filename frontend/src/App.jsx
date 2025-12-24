import React, { useState } from 'react';
import { useStore } from './store/useStore';
import ChatPanel from './components/ChatPanel';
import { FileCode, Box, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import Editor from '@monaco-editor/react';

function App() {
  const { files, activeFile, setActiveFile, updateFileContent } = useStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen w-full bg-[#09090b] text-white font-sans overflow-hidden">
      
      {/* 1. SOL PANEL: DOSYA GEZGİNİ (SABİT GENİŞLİK) */}
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
          
          <div className="flex-1 overflow-y-auto py-2">
            {files.map(file => (
              <div 
                key={file.id}
                onClick={() => setActiveFile(file)}
                className={`flex items-center gap-2 px-4 py-2 text-sm cursor-pointer transition-colors ${activeFile?.id === file.id ? 'bg-[#27272a] text-white border-l-2 border-indigo-500' : 'text-gray-400 hover:bg-[#18181b] hover:text-gray-200'}`}
              >
                <FileCode size={16} className={activeFile?.id === file.id ? 'text-indigo-400' : 'text-gray-500'} />
                <span className="truncate">{file.name}</span>
              </div>
            ))}
             {files.length === 0 && (
                <div className="text-center py-10 px-4 text-xs text-gray-600">
                    Dosya yok.<br/>Klasör yükleyin veya oluşturun.
                </div>
            )}
          </div>
        </div>
      )}

      {/* ANA İÇERİK ALANI (EDİTÖR + SOHBET) */}
      {/* Bu alan, sidebar hariç kalan tüm genişliği kaplar ve içindekileri eşit böler */}
      <div className="flex-1 flex overflow-hidden">

          {/* 2. ORTA PANEL: EDİTÖR (%50 GENİŞLİK) */}
          <div className="w-1/2 flex flex-col min-w-0 bg-[#1e1e1e] border-r border-[#27272a]">
            
            {/* EDİTÖR HEADER */}
            <div className="h-14 bg-[#1e1e1e] border-b border-[#27272a] flex items-center px-4 justify-between shrink-0">
                <div className="flex items-center gap-3">
                  {!isSidebarOpen && (
                    <button onClick={() => setIsSidebarOpen(true)} className="text-gray-500 hover:text-white mr-2">
                        <PanelLeftOpen size={18} />
                    </button>
                  )}
                  {activeFile ? (
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                       <FileCode size={16} className="text-indigo-400" />
                       <span className="font-medium">{activeFile.name}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500 italic">Dosya seçilmedi</span>
                  )}
                </div>
            </div>
            
            {/* MONACO EDITOR ALANI */}
            {activeFile ? (
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
                    automaticLayout: true,
                  }}
                />
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500 bg-[#1e1e1e]">
                <div className="w-24 h-24 bg-[#252526] rounded-3xl flex items-center justify-center mb-6 shadow-xl border border-[#2d2d2d]">
                   <FileCode size={48} className="text-gray-600 opacity-50"/>
                </div>
                <h3 className="text-lg font-semibold text-gray-400 mb-2">Editör Boş</h3>
                <p className="text-sm text-gray-600">Sol menüden bir dosya seçin.</p>
              </div>
            )}
          </div>

          {/* 3. SAĞ PANEL: SOHBET (%50 GENİŞLİK) */}
          {/* Burası artık sabit 400px değil, ekranın yarısını kaplıyor */}
          <div className="w-1/2 bg-[#0c0c0e] shrink-0">
            <ChatPanel />
          </div>

      </div>
      
    </div>
  );
}

export default App;