import { create } from 'zustand';

export const useStore = create((set) => ({
  files: [],
  activeFile: null,

  // Dosya Ekleme
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

  // Dosya İçeriği Güncelleme
  updateFileContent: (fileId, content) => set((state) => ({
    files: state.files.map(f => f.id === fileId ? { ...f, content } : f),
    activeFile: state.activeFile?.id === fileId ? { ...state.activeFile, content } : state.activeFile
  })),

  // Dosya Silme
  deleteFile: (fileId) => set((state) => ({
    files: state.files.filter(f => f.id !== fileId),
    activeFile: state.activeFile?.id === fileId ? null : state.activeFile
  })),

  // Aktif Dosyayı Seçme
  setActiveFile: (file) => set({ activeFile: file }),
  
  // Çalışma Alanını Temizleme
  resetWorkspace: () => set({ files: [], activeFile: null })
}));