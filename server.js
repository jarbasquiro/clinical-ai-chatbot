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
const baseDir = process.cwd();

// Mapeamento físico dos caminhos da pasta dist
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

// Configurações e chaves estáticas do Supabase para injeção forçada
const URL_REAL = 'https://cygqomkyiheoijarrnsu.supabase.co';
const KEY_REAL = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInN1YiI6ImN5Z3FvbWt5aWhlb2lqYXJybnN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTY4ODQwOTUsImV4cCI6MjAzMjQ2MDA5NX0.PB04DWKvLFMV1ffsrkJc6ktBo85w2HOnCzXJwRURmVU';

// Inicialização estável do Backend
const supabase = createClient(URL_REAL, process.env.SUPABASE_SERVICE_KEY || KEY_REAL);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || 'gsk_ppeWEFnbjTBcoGSIe84WGdyb3FYqcakKIVamC0bOAcQXh1q91aI' });

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Servidor CLINIC-AI operacional!" });
});

// INTERCEPTADOR CIRÚRGICO: Modifica o JavaScript problemático antes dele chegar ao navegador
app.get("*/assets/index-*.js", (req, res) => {
  const nomeArquivo = path.basename(req.path);
  const caminhoScript = path.join(pastaDistEfetiva, "assets", nomeArquivo);

  if (fs.existsSync(caminhoScript)) {
    let conteudoJs = fs.readFileSync(caminhoScript, "utf8");
    
    // Sobrescreve as chamadas de ambiente injetando a string real da URL e da KEY
    conteudoJs = conteudoJs.replace(/import\.meta\.env\.VITE_SUPABASE_URL/g, `'${URL_REAL}'`);
    conteudoJs = conteudoJs.replace(/import\.meta\.env\.VITE_SUPABASE_ANON_KEY/g, `'${KEY_REAL}'`);
    conteudoJs = conteudoJs.replace(/process\.env\.VITE_SUPABASE_URL/g, `'${URL_REAL}'`);
    conteudoJs = conteudoJs.replace(/process\.env\.VITE_SUPABASE_ANON_KEY/g, `'${KEY_REAL}'`);
    
    // Injeção global forçada na primeira linha do script externo
    const scriptRemendado = `window.process={env:{VITE_SUPABASE_URL:"${URL_REAL}",VITE_SUPABASE_ANON_KEY:"${KEY_REAL}"}};${conteudoJs}`;
    
    res.setHeader("Content-Type", "application/javascript");
    return res.send(scriptRemendado);
  }
  res.status(404).end();
});

// Entrega os demais arquivos estáticos normalmente
if (pastaDistEfetiva) {
  app.use(express.static(pastaDistEfetiva));
}

// Rota coringa que serve o HTML inicial
app.get("*", (req, res) => {
  if (pastaDistEfetiva) {
    const caminhoHtml = path.join(pastaDistEfetiva, "index.html");
    let html = fs.readFileSync(caminhoHtml, "utf8");
    
    // Injeta as variáveis direto no cabeçalho do HTML para blindagem total
    const injecaoScript = `
      <script>
        window.process = { env: { VITE_SUPABASE_URL: "${URL_REAL}", VITE_SUPABASE_ANON_KEY: "${KEY_REAL}" } };
        globalThis.VITE_SUPABASE_URL = "${URL_REAL}";
        globalThis.VITE_SUPABASE_ANON_KEY = "${KEY_REAL}";
      </script>
    `;
    html = html.replace("<head>", `<head>${injeçãoScript}`);
    
    res.setHeader("Content-Type", "text/html");
    return res.send(html);
  }
  
  res.status(200).send(`
    <html>
      <body style="background:#111;color:#fff;font-family:sans-serif;padding:40px;text-align:center;">
        <h2>Sincronizando Interface...</h2>
        <script>setTimeout(() => { location.reload(); }, 2000);</script>
      </body>
    </html>
  `);
});

app.listen(port, () => {
  console.log(`🚀 Servidor rodando na porta ${port}`);
});
