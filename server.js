import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import { Groq } from "groq-sdk";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mapeia todos os locais possíveis onde a pasta 'dist' pode estar no Render
const caminhosPossiveis = [
  path.join(__dirname, "dist"),
  path.join(__dirname, "..", "dist"),
  path.resolve("dist"),
  path.resolve("project", "dist"),
  "/opt/render/project/src/dist",
  "/opt/render/project/dist"
];

let distPath = "";

// Procura visualmente qual pasta existe de verdade no servidor
for (const caminho of caminhosPossiveis) {
  if (fs.existsSync(caminho)) {
    distPath = caminho;
    console.log(`✅ Pasta dist encontrada em: ${caminho}`);
    break;
  }
}

// Se encontrar a pasta, serve os arquivos; se não, avisa no log
if (distPath) {
  app.use(express.static(distPath));
} else {
  console.error("❌ ALERTA CRÍTICO: Pasta 'dist' não foi encontrada em nenhum diretório!");
}

// Inicialização dos serviços (Supabase e Groq)
const supabaseUrl = process.env.SUPABASE_URL || 'https://cygqomkyiheoijarrnsu.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const groqApiKey = process.env.GROQ_API_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInN1YiI6ImN5Z3FvbWt5aWhlb2lqYXJybnN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNjg4NDA5NSwiZXhwIjoyMDMyNDYwMDk1fQ.eyJhY2Nlc3NfVG9rZW4iOi...');
const groq = new Groq({ apiKey: groqApiKey || 'gsk_ppeWEFnbjTBcoGSIe84WGdyb3FYqcakKIVamC0bOAcQXh1q91aI' });

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Servidor CLINIC-AI operacional!" });
});

// Entrega o index.html principal independente de onde a pasta dist foi parar
app.get("*", (req, res) => {
  if (distPath) {
    res.sendFile(path.join(distPath, "index.html"));
  } else {
    res.status(404).send("Erro: Pasta de interface 'dist' nao foi encontrada no deploy. Rode o build local e envie pelo Git.");
  }
});

app.listen(port, () => {
  console.log(`🚀 Servidor rodando na porta ${port}`);
});
