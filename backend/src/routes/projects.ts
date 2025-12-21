import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { indexFile } from '../lib/vectorStore'; // Yeni yazdığımız fonksiyon

const router = Router();
const prisma = new PrismaClient();

// Dosya Ekleme/Güncelleme Endpoint'i
router.post('/file', async (req, res) => {
  const { projectId, name, content } = req.body;

  try {
    // 1. PostgreSQL'e kaydet (Kalıcı veri)
    const file = await prisma.file.create({
      data: {
        name,
        content,
        projectId
      }
    });

    // 2. Pinecone'a kaydet (Vektör veri - Arka planda çalışabilir)
    // await beklemeyebiliriz ama tutarlılık için bekliyoruz.
    // await indexFile(file.id, content, {
    //  fileName: name,
    //  projectId: projectId
    //});

    res.json({ success: true, file });
  } catch (error) {
    res.status(500).json({ error: 'Dosya kaydedilemedi' });
  }
});

export const projectRoutes = router;