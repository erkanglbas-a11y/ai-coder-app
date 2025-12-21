'use client';

import { useEffect, useState } from 'react';
import { WebContainer } from '@webcontainer/api';
import { useStore } from '@/store/useStore';
import { Loader2, Terminal, RefreshCw } from 'lucide-react';

let webContainerInstance: WebContainer | null = null;

// BU KISIM EKSİKSİZ OLMALI:
const baseFiles = {
  'package.json': {
    file: {
      contents: JSON.stringify({
        name: 'vite-react-app',
        type: 'module',
        dependencies: {
          'react': '^18.2.0',
          'react-dom': '^18.2.0',
          'lucide-react': '^0.300.0',
          'clsx': '^2.0.0',
          'tailwind-merge': '^2.0.0'
        },
        devDependencies: {
          '@vitejs/plugin-react': '^4.2.1',
          'vite': '^5.0.0',
          'autoprefixer': '^10.4.16',
          'postcss': '^8.4.32',
          'tailwindcss': '^3.4.0'
        },
        scripts: {
          'dev': 'vite',
          'build': 'vite build',
          'preview': 'vite preview'
        }
      }, null, 2),
    },
  },
  'index.html': {
    file: {
      contents: `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>AI App</title>
          </head>
          <body>
            <div id="root"></div>
            <script type="module" src="/src/main.jsx"></script>
          </body>
        </html>
      `,
    },
  },
  'vite.config.js': {
    file: {
      contents: `
        import { defineConfig } from 'vite'
        import react from '@vitejs/plugin-react'

        export default defineConfig({
          plugins: [react()],
          server: {
            host: '0.0.0.0',
          },
        })
      `,
    },
  },
  'postcss.config.js': {
    file: {
      contents: `
        export default {
          plugins: {
            tailwindcss: {},
            autoprefixer: {},
          },
        }
      `,
    },
  },
  'tailwind.config.js': {
    file: {
      contents: `
        /** @type {import('tailwindcss').Config} */
        export default {
          content: [
            "./index.html",
            "./src/**/*.{js,ts,jsx,tsx}",
          ],
          theme: {
            extend: {},
          },
          plugins: [],
        }
      `,
    },
  },
  'src/index.css': {
    file: {
      contents: `
        @tailwind base;
        @tailwind components;
        @tailwind utilities;
      `,
    },
  },
  'src/main.jsx': {
    file: {
      contents: `
        import React from 'react'
        import ReactDOM from 'react-dom/client'
        import App from './App.jsx'
        import './index.css'

        ReactDOM.createRoot(document.getElementById('root')).render(
          <React.StrictMode>
            <App />
          </React.StrictMode>,
        )
      `,
    },
  },
  'src/App.jsx': {
    file: {
      contents: `
        import React from 'react';
        export default function App() {
          return (
            <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
              <h1 className="text-3xl font-bold">Uygulama Yükleniyor...</h1>
            </div>
          );
        }
      `,
    },
  }
};

export default function PreviewPanel() {
  const { files, addLog, terminalLogs } = useStore();
  const [url, setUrl] = useState<string>('');
  const [status, setStatus] = useState<'loading' | 'installing' | 'running' | 'error'>('loading');
  const [iframeKey, setIframeKey] = useState(0);
  const [showTerminal, setShowTerminal] = useState(false);

  useEffect(() => {
    async function bootAndSync() {
      if (webContainerInstance) {
        if (status !== 'running') setStatus('running');
        return;
      }

      try {
        setStatus('loading');
        addLog('⚡ WebContainer Boot ediliyor...');
        
        webContainerInstance = await WebContainer.boot();
        const wc = webContainerInstance;

        // Base files + User files birleştirme
        const initialFiles = { ...baseFiles };
        
        // Store'daki dosyaları WebContainer formatına çevir
        files.forEach(f => {
          if (f.name && f.content) {
            // Dosya yolunu klasörlere ayır (src/components/Header.jsx gibi)
            const parts = f.name.split('/');
            let current: any = initialFiles;
            
            // Son parça hariç klasörleri gez/oluştur
            for (let i = 0; i < parts.length - 1; i++) {
                const folder = parts[i];
                if (!current[folder]) {
                    current[folder] = { directory: {} };
                }
                current = current[folder].directory;
            }
            
            // Dosyayı ekle
            const fileName = parts[parts.length - 1];
            current[fileName] = { file: { contents: f.content } };
          }
        });

        addLog('📂 Dosyalar yazılıyor...');
        await wc.mount(initialFiles);

        setStatus('installing');
        addLog('📦 Paketler yükleniyor (npm install)...');
        
        const installProcess = await wc.spawn('npm', ['install']);
        installProcess.output.pipeTo(new WritableStream({
          write(data) { addLog(`[npm] ${data}`); }
        }));

        if ((await installProcess.exit) !== 0) {
          addLog('❌ NPM Install Başarısız!');
          throw new Error('NPM Install başarısız oldu');
        }

        addLog('🚀 Sunucu başlatılıyor (npm run dev)...');
        const devProcess = await wc.spawn('npm', ['run', 'dev']);
        devProcess.output.pipeTo(new WritableStream({
          write(data) { addLog(`[server] ${data}`); }
        }));

        wc.on('server-ready', (port, url) => {
          addLog(`✅ Sunucu hazır: ${url}`);
          setUrl(url);
          setStatus('running');
        });

      } catch (error) {
        console.error('Boot Error:', error);
        addLog(`❌ KRİTİK HATA: ${error}`);
        setStatus('error');
      }
    }
    bootAndSync();
  }, []);

  // Dosya Güncelleme (Canlı)
  useEffect(() => {
    async function updateFiles() {
      if (!webContainerInstance || status !== 'running') return;
      
      for (const file of files) {
        if (file.name && file.content) {
          try {
            await webContainerInstance.fs.writeFile(file.name, file.content);
          } catch (e) { console.error(e); }
        }
      }
    }
    updateFiles();
  }, [files, status]);

  const handleRefresh = () => setIframeKey(p => p + 1);

  return (
    <div className="h-full flex flex-col bg-gray-900">
      <div className="h-10 border-b border-gray-800 flex items-center px-4 justify-between bg-gray-950 shrink-0">
        <div className="flex items-center gap-2 text-gray-400">
          <Terminal size={14} />
          <span className="text-xs font-medium">PREVIEW</span>
        </div>
        
        <div className="flex items-center gap-2">
           <span className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 ${
             status === 'running' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'
           }`}>
             <div className={`w-1.5 h-1.5 rounded-full ${status === 'running' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
             {status === 'running' ? 'Ready' : status}
           </span>

           <button onClick={() => setShowTerminal(!showTerminal)} className={`p-1 rounded ${showTerminal ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>
             <Terminal size={14} />
           </button>
           <button onClick={handleRefresh} className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded">
             <RefreshCw size={14} />
           </button>
        </div>
      </div>

      <div className="flex-1 relative bg-white flex flex-col overflow-hidden">
        {status !== 'running' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white z-20">
            <Loader2 className="w-6 h-6 animate-spin mb-3 text-blue-500" />
            <p className="text-xs text-gray-400">{status === 'installing' ? 'Paketler yükleniyor...' : 'Başlatılıyor...'}</p>
          </div>
        )}
        
        {url && (
          <div className="flex-1 relative">
            <iframe key={iframeKey} src={url} className="w-full h-full border-none" allow="cross-origin-isolated" />
          </div>
        )}

        {showTerminal && (
          <div className="h-40 bg-[#0d1117] border-t border-gray-800 overflow-y-auto p-2 font-mono text-[10px] text-gray-300 z-10 shrink-0 shadow-xl">
            {terminalLogs.map((log, i) => (
              <div key={i} className="whitespace-pre-wrap border-b border-gray-800/50 pb-0.5 mb-0.5">{log}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}