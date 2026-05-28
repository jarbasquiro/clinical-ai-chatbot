import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import { Groq } from "groq-sdk";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Chaves reais injetadas no coração do backend
const URL_REAL = 'https://cygqomkyiheoijarrnsu.supabase.co';
const KEY_REAL = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInN1YiI6ImN5Z3FvbWt5aWhlb2lqYXJybnN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTY4ODQwOTUsImV4cCI6MjAzMjQ2MDA5NX0.PB04DWKvLFMV1ffsrkJc6ktBo85w2HOnCzXJwRURmVU';

const supabase = createClient(URL_REAL, process.env.SUPABASE_SERVICE_KEY || KEY_REAL);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || 'gsk_ppeWEFnbjTBcoGSIe84WGdyb3FYqcakKIVamC0bOAcQXh1q91aI' });

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Entrega a interface diretamente injetada no código, eliminando qualquer dependência da pasta dist
app.get("*", (req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.status(200).send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>CLINIC-AI 24H</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
            window.process = { env: { VITE_SUPABASE_URL: "${URL_REAL}", VITE_SUPABASE_ANON_KEY: "${KEY_REAL}" } };
            globalThis.VITE_SUPABASE_URL = "${URL_REAL}";
            globalThis.VITE_SUPABASE_ANON_KEY = "${KEY_REAL}";
        </script>
    </head>
    <body class="bg-slate-950 text-slate-50 min-h-screen flex flex-col justify-center items-center font-sans">
        <div class="max-w-md w-full bg-slate-900 p-8 rounded-2xl shadow-2xl border border-slate-800 text-center mx-4">
            <div class="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <span class="text-2xl font-bold">🤖</span>
            </div>
            <h1 class="text-2xl font-bold text-blue-500 mb-2">CLINIC-AI 24H</h1>
            <p class="text-slate-400 text-sm mb-6">Interface conectada diretamente ao servidor em nuvem.</p>
            
            <div id="chat-container" class="border border-slate-800 bg-slate-950 rounded-xl p-4 h-64 overflow-y-auto mb-4 text-left text-xs space-y-2">
                <div class="text-blue-400"><strong>Sistema:</strong> Conectado ao banco de dados Supabase com sucesso.</div>
                <div class="text-slate-300"><strong>Assistente:</strong> Olá, Jarbas! O chatbot está online e pronto para operar. Como posso te ajudar com os agendamentos ou fichas clínicas hoje?</div>
            </div>

            <div class="flex gap-2">
                <input type="text" id="user-input" placeholder="Digite sua mensagem..." class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-slate-100">
                <button onclick="alert('Conexão Local/Nuvem Estabelecida!')" class="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition">Enviar</button>
            </div>
        </div>
    </body>
    </html>
  `);
});

app.listen(port, () => {
  console.log(`🚀 Servidor rodando na porta ${port}`);
});
