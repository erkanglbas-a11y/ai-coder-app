import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import { generateCodeRoutes } from './routes/generate';
import { projectRoutes } from './routes/projects';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Dinleme fonksiyonu:
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Middleware
app.use(cors()); // Frontend (Next.js) buradan veri çekebilsin
app.use(express.json());

// Routes
// 1. Proje ve Dosya Yönetimi (CRUD)
app.use('/api/projects', projectRoutes);

// 2. AI Kod Üretimi (Streaming)
app.use('/api/generate', generateCodeRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Backend (AI Brain) çalışıyor: http://localhost:${PORT}`);
});