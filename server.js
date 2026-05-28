import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import { Groq } from "groq-sdk";

// Inicializa as variáveis de ambiente
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Configuração do CORS e JSON
app.use(cors());
app.use(express.json());

// Validação das variáveis de ambiente obrigatórias
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const groqApiKey = process.env.GROQ_API_KEY;

if (!supabaseUrl || !supabaseServiceKey || !groqApiKey) {
  console.error("❌ ERRO CRÍTICO: Variáveis de ambiente faltando no servidor!");
  process.exit(1);
}

// Inicialização dos clientes de serviços
const supabase = createClient(supabaseUrl, supabaseServiceKey);
const groq = new Groq({ apiKey: groqApiKey });

// Servir os arquivos estáticos do frontend (pasta dist)
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "dist")));

// Rota básica da API para testar se o servidor responde
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Servidor CLINIC-AI rodando perfeitamente!" });
});

// Qualquer outra rota entrega o index.html do React
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// Inicialização do servidor
app.listen(port, () => {
  console.log(`🚀 Servidor ativo e operando na porta ${port}`);
});
