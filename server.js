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

// MAPEAMENTO BLINDADO: Procura a pasta public onde quer que ela esteja para não sumir com o login
let publicPath = path.join(baseDir, "public");

if (!fs.existsSync(publicPath)) {
  publicPath = path.join(__dirname, "public");
}
if (!fs.existsSync(publicPath)) {
  publicPath = baseDir; // Último recurso: usa a raiz se a pasta sumiu
}

app.use(express.static(publicPath));

// Conexão dinâmica com as variáveis do Render
const URL_REAL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const GROQ_KEY = process.env.GROQ_API_KEY;
const KEY_ANON = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;
const KEY_SERVICE = process.env.SUPABASE_SERVICE_KEY || KEY_ANON;

let supabasePublic = null;
let groq = null;

try {
  if (URL_REAL && KEY_ANON) {
    supabasePublic = createClient(URL_REAL, KEY_ANON);
  }
  if (GROQ_KEY) {
    groq = new Groq({ apiKey: GROQ_KEY });
  }
} catch (err) {
  console.error("Erro critico nas chaves:", err.message);
}

// API do Chat com buscador de vídeos tolerante a erros e acentos
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Mensagem vazia." });
    if (!groq || !supabasePublic) return res.status(500).json({ error: "Chaves nao configuradas no Render." });

    let videoEncontrado = null;
    try {
      const { data: listaVideos } = await supabasePublic.from("videos").select("termo, youtube_url, titulo");
      
      if (listaVideos && listaVideos.length > 0) {
        // Limpa o texto que o aluno digitou
        const alunoTextoLimpo = message.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/-/g, " ").trim();
        
        for (const vid of listaVideos) {
          if (!vid.termo) continue;
          
          // Limpa o termo do banco de dados
          const termoLimpo = vid.termo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/-/g, " ").trim();
          
          // Busca por aproximação direta
          if (alunoTextoLimpo.includes(termoLimpo) || termoLimpo.includes(alunoTextoLimpo)) {
            videoEncontrado = vid;
            break;
          }
          
          // Busca quebrando por palavras significativas
          const palavrasChave = termoLimpo.split(" ").filter(p => p.length > 3);
          const deuMatch = palavrasChave.some(p => alunoTextoLimpo.includes(p));
          
          if (deuMatch) {
            videoEncontrado = vid;
            break;
          }
        }
      }
    } catch (e) {
      console.log("Erro ao ler tabela de vídeos:", e.message);
    }

    const completion = await groq.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: "Você é o CLINIC-AI, um agente de Inteligência Artificial e mentor técnico criado pelo Professor e Terapeuta Jarbas Garcia (@jarbasquiro). Seu objetivo exclusivo é servir como uma ferramenta de pesquisa científica, clínica e prática para ALUNOS E PROFISSIONAIS de massoterapia, quiropraxia, acupuntura, ozonioterapia e terapias manuais. Quando perguntado sobre ajustes, manobras, dores ou protocolos, fornece respostas profundamente técnicas e estruturadas. Sempre separe os tópicos com uma linha em branco." 
        },
        { role: "user", content: message }
      ],
      model: "llama-3.1-8b-instant", 
    });

    res.json({ 
      response: completion.choices[0]?.message?.content || "Sem resposta.",
      video: videoEncontrado ? { url: videoEncontrado.youtube_url, titulo: videoEncontrado.titulo } : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// Entrega o index.html procurando na pasta pública ou na raiz
app.get("*", (req, res) => {
  const caminhoIndex = fs.existsSync(path.join(publicPath, "index.html"))
    ? path.join(publicPath, "index.html")
    : path.join(__dirname, "index.html");
    
  res.sendFile(caminhoIndex);
});

app.listen(port, () => console.log("🚀 Servidor totalmente online e corrigido!"));
