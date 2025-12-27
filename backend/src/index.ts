import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { AIOrchestrator } from "./core/ai-orchestrator";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

/* ------------------------------------------------------------------ */
/* MIDDLEWARE */
/* ------------------------------------------------------------------ */

app.use(cors());
app.use(express.json({ limit: "50mb" }));

/* ------------------------------------------------------------------ */
/* HEALTH CHECK */
/* ------------------------------------------------------------------ */

app.get("/", (_req, res) => {
  res.send("AI Backend is running (AIOrchestrator active)");
});

/* ------------------------------------------------------------------ */
/* AI ENDPOINT */
/* ------------------------------------------------------------------ */

app.post("/api/generate", async (req: Request, res: Response) => {
  try {
    const { prompt, messages } = req.body;

    if (!prompt && !Array.isArray(messages)) {
      return res.status(400).json({
        error: "Geçersiz istek. prompt veya messages gereklidir.",
      });
    }

    const result = await AIOrchestrator.generate({
      prompt,
      messages,
    });

    return res.json({
      message: result.content,
      meta: result.meta,
    });
  } catch (error: any) {
    console.error("AI ENDPOINT ERROR:", error);

    return res.status(500).json({
      error: "AI işlem hatası",
      details: error.message,
    });
  }
});

/* ------------------------------------------------------------------ */
/* SERVER */
/* ------------------------------------------------------------------ */

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
