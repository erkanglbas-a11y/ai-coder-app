import express from 'express';
import cors from 'cors'; // <--- 1. EKLEME
import dotenv from 'dotenv';
import { OpenAI } from 'openai';

dotenv.config();

const app = express();

// 2. EKLEME: CORS İZNİ (Bu satır çok önemli!)
app.use(cors()); 

app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ... Kodun geri kalanı aynı ...

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});