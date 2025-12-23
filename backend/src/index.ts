import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
// Route'ları import ediyoruz
import { generateCode } from './controllers/aiController'; 

dotenv.config();

const app = express();
app.use(cors());

// Kapasite ayarları
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true, limit: '500mb' }));

// --- ROUTES ---

// Tek ve Ana Endpoint: Artık bütün zeka aiController üzerinden akıyor.
app.post('/api/generate', generateCode);

// Health Check
app.get('/', (_, res) => {
  res.send('AI Coder V12 - Smart Orchestrator Active 🧠🚀');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});