import dotenv from 'dotenv';
dotenv.config();
import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });

// Pinecone'daki Index adınız (Pinecone dashboard'dan oluşturmalısınız, örn: "code-assistant")
const INDEX_NAME = 'code-assistant';

/**
 * 1. Metni (Kodu) Vektöre Çevirir
 */
export async function getEmbeddings(text: string) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.replace(/\n/g, ' '), // Satır sonlarını temizle
  });
  return response.data[0].embedding;
}

/**
 * 2. Dosyayı Vektör DB'ye Kaydeder/Günceller
 * @param fileId - SQL veritabanındaki ID
 * @param content - Dosya içeriği
 * @param metadata - Ek bilgiler (dosya adı, proje id)
 */
export async function indexFile(fileId: string, content: string, metadata: any) {
  const vector = await getEmbeddings(content);
  const index = pinecone.index(INDEX_NAME);

  await index.upsert([
    {
      id: fileId,
      values: vector,
      metadata: {
        ...metadata,
        content: content, // İçeriği de metadata'ya koyuyoruz ki arama yapınca kodu geri alabilelim
      },
    },
  ]);
  console.log(`Dosya vektörize edildi: ${metadata.fileName}`);
}

/**
 * 3. Soruya En Benzer Kod Dosyalarını Bulur
 */
export async function searchRelevantFiles(query: string, projectId: string) {
  const vector = await getEmbeddings(query);
  const index = pinecone.index(INDEX_NAME);

  const queryResponse = await index.query({
    vector: vector,
    topK: 3, // En alakalı 3 dosyayı getir (Context'i şişirmemek için)
    filter: { projectId: projectId }, // Sadece bu projeye ait dosyaları ara
    includeMetadata: true,
  });

  return queryResponse.matches.map((match) => match.metadata);
}