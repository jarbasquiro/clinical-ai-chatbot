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

// Identifica a raiz do projeto no Render de forma dinâmica
const baseDir = process.cwd();

// Tenta localizar a pasta 'dist' mapeando as variações físicas do servidor
const caminhosDist = [
  path.join(baseDir, "dist"),
  path.join(baseDir, "project", "dist"),
  path.join(__dirname, "dist"),
  path.join(__dirname, "..", "dist")
];

let pastaDistEfetiva = "";
for (const caminho of caminhosDist) {
  if (fs.existsSync(caminho) && fs.existsSync(path.join(caminho, "index.html"))) {
    pastaDistEfetiva = caminho;
    break;
  }
}

// Se encontrou a pasta dist válida, serve os arquivos estáticos
if (pastaDistEfetiva) {
  app.use(express.static(pastaDistEfetiva));
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

// Responde a todas as requisições com o index.html correto, eliminando o 404 do navegador
app.get("*", (req, res) => {
  if (pastaDistEfetiva) {
    res.sendFile(path.join(pastaDistEfetiva, "index.html"));
  } else {
    // Busca de emergência caso os mapeamentos falhem
    const buscaDireta = path.resolve("project/dist/index.html");
    if (fs.existsSync(buscaDireta)) {
      res.sendFile(buscaDireta);
    } else {
      res.status(200).send(`
        <html>
          <head><title>CLINIC-AI 24H</title></head>
          <body style="background:#111;color:#fff;font-family:sans-serif;padding:40px;text-align:center;">
            <h2>Servidor Conectado com Sucesso!</h2>
            <p>O motor do sistema está ativo, mas a interface visual ainda está se posicionando no servidor.</p>
            <script>setTimeout(() => { location.reload(); }, 5000);</script>
          </body>
        </html>
      `);
    }
  }
});

app.listen(port, () => {
  console.log(`🚀 Servidor rodando na porta ${port}`);
});
