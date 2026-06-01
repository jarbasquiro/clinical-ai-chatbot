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

// RESOLVENDO A BAGUNÇA DE PASTAS: Encontra onde está o index.html de verdade
let caminhosPossiveis = [
  path.join(__dirname, "public"),
  path.join(__dirname, "dist"),
  __dirname
];

let pastaPublica = __dirname;
for (const caminho of caminhosPossiveis) {
  if (fs.existsSync(path.join(caminho, "index.html"))) {
    pastaPublica = caminho;
    break;
  }
}

app.use(express.static(pastaPublica));

// Conexão com o Supabase usando as variáveis do ambiente do Render
const URL_REAL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const GROQ_KEY = process.env.GROQ_API_KEY;
const KEY_ANON = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;

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
  console.error("Erro na inicializacao das chaves:", err.message);
}

// Rota da API do Chat com busca ultra flexível de termos de vídeo
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Mensagem vazia." });
    if (!groq || !supabasePublic) return res.status(500).json({ error: "Configuracoes ausentes no Render." });

    let videoEncontrado = null;
    try {
      // Puxa os dados da tabela de vídeos do Supabase
      const { data: listaVideos } = await supabasePublic.from("videos").select("termo, youtube_url, titulo");
      
      if (listaVideos && listaVideos.length > 0) {
        // Limpa acentos, traços e espaços do texto digitado pelo usuário
        const textoUsuario = message.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/-/g, " ").trim();
        
        for (const vid of listaVideos) {
          if (!vid.termo) continue;
          
          // Limpa o termo cadastrado no banco (ex: transforma "auriculoterapia-acne" em "auriculoterapia acne")
          const termoBanco = vid.termo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/-/g, " ").trim();
          
          // Se o usuário digitou o termo completo ou palavras-chave dele
          if (textoUsuario.includes(termoBanco) || termoBanco.includes(textoUsuario)) {
            videoEncontrado = vid;
            break;
          }
          
          // Busca secundária por palavras separadas (ignora conectores curtos)
          const palavrasChave = termoBanco.split(" ").filter(p => p.length > 3);
          if (palavrasChave.some(palavra => textoUsuario.includes(palavra))) {
            videoEncontrado = vid;
            break;
          }
        }
      }
    } catch (e) {
      console.log("Erro ao acessar tabela de vídeos:", e.message);
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

// Rota coringa que entrega o index.html correto encontrado pelo servidor
app.get("*", (req, res) => {
  res.sendFile(path.join(pastaPublica, "index.html"));
});

app.listen(port, () => console.log(`🚀 Servidor rodando na porta ${port}`));
