import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import { Groq } from "groq-sdk";
import path from "path";
import { fileURLToPath } from "url";

// Inicializa as variáveis de ambiente
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Configuração do CORS e JSON
app.use(cors());
app.use(express.json());

// Configuração dos caminhos de pastas (ES Modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Garante o caminho correto para a pasta dist, estando ela na raiz ou na pasta acima
const rootDir = path.resolve(__dirname);
const distPath = path.join(rootDir, "dist");

// Servir os arquivos estáticos do frontend (pasta dist)
app.use(express.static(distPath));

// Validação das variáveis de ambiente obrigatórias para a API
const supabaseUrl = process.env.SUPABASE_URL || 'https://cygqomkyiheoijarrnsu.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const groqApiKey = process.env.GROQ_API_KEY;

// Inicialização dos clientes de serviços
const supabase = createClient(supabaseUrl, supabaseServiceKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInN1YiI6ImN5Z3FvbWt5aWhlb2lqYXJybnN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNjg4NDA5NSwiZXhwIjoyMDMyNDYwMDk1fQ.eyJhY2Nlc3NfVG9rZW4iOi...'); // O Node usará a variável do Render prioritariamente
const groq = new Groq({ apiKey: groqApiKey || 'gsk_ppeWEFnbjTBcoGSIe84WGdyb3FYqcakKIVamC0bOAcQXh1q91aI' });

// Rota básica da API para testar se o servidor responde
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Servidor CLINIC-AI rodando perfeitamente!" });
});

// Qualquer outra rota entrega o index.html do React (corrige o Not Found)
app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"), (err) => {
    if (err) {
      // Se não achar na pasta atual, tenta buscar uma pasta acima (garantia de diretório do Render)
      res.sendFile(path.resolve(__dirname, "..", "dist", "index.html"));
    }
  });
});

// Inicialização do servidor
app.listen(port, () => {
  console.log(`🚀 Servidor ativo e operando na porta ${port}`);
});
