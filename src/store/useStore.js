import { create } from 'zustand';

// TypeScript kullanmıyorsan şu interface satırlarını silebilirsin
export interface File {
  id: string;
  name: string;
  language: string;
  content: string;
}

interface Store {
  files: File[];
  activeFile: File | null;
  addFile: (file: File) => void;
  updateFileContent: (fileId: string, content: string) => void;
  deleteFile: (fileId: string) => void;
  setActiveFile: (file: File | null) => void;
  resetWorkspace: () => void;
}

export const useStore = create<Store>((set) => ({
  files: [],
  activeFile: null,

  addFile: (file) => set((state) => {
    // Dosya zaten varsa güncelle, yoksa ekle
    const exists = state.files.find(f => f.name === file.name);
    if (exists) {
      return {
        files: state.files.map(f => f.name === file.name ? { ...f, content: file.content } : f),
        activeFile: exists 
      };
    }
    return { 
      files: [...state.files, file],
      activeFile: file 
    };
  }),

  updateFileContent: (fileId, content) => set((state) => ({
    files: state.files.map(f => f.id === fileId ? { ...f, content } : f),
    activeFile: state.activeFile?.id === fileId ? { ...state.activeFile!, content } : state.activeFile
  })),

  deleteFile: (fileId) => set((state) => ({
    files: state.files.filter(f => f.id !== fileId),
    activeFile: state.activeFile?.id === fileId ? null : state.activeFile
  })),

  setActiveFile: (file) => set({ activeFile: file }),
  
  resetWorkspace: () => set({ files: [], activeFile: null })
}));