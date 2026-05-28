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

const URL_REAL = 'https://cygqomkyiheoijarrnsu.supabase.co';
const KEY_REAL = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInN1YiI6ImN5Z3FvbWt5aWhlb2lqYXJybnN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTY4ODQwOTUsImV4cCI6MjAzMjQ2MDA5NX0.PB04DWKvLFMV1ffsrkJc6ktBo85w2HOnCzXJwRURmVU';

const supabase = createClient(URL_REAL, process.env.SUPABASE_SERVICE_KEY || KEY_REAL);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || 'gsk_ppeWEFnbjTBcoGSIe84WGdyb3FYqcakKIVamC0bOAcQXh1q91aI' });

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Mensagem vazia." });
    }

    const completion = await groq.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: "Você é o CLINIC-AI, um assistente virtual especialista em quiropraxia, massoterapia e recuperação de mobilidade. Ajude o profissional Jarbas de forma técnica, clara e prestativa. IMPORTANTE: Sempre organize suas respostas separando os parágrafos, tópicos e itens numerados com uma linha em branco para garantir uma leitura espacial e limpa." 
        },
        { role: "user", content: message }
      ],
      model: "llama-3.1-8b-instant", 
    });

    const respostaIA = completion.choices[0]?.message?.content || "Sem resposta.";
    res.json({ response: respostaIA });
  } catch (error) {
    console.error("Erro interno na API do Groq:", error);
    res.status(500).json({ error: `Erro na IA: ${error.message || "Verifique chaves ou modelo"}` });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

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
    </head>
    <body class="bg-slate-950 text-slate-50 min-h-screen flex flex-col justify-center items-center font-sans">
        <div class="max-w-md w-full bg-slate-900 p-8 rounded-2xl shadow-2xl border border-slate-800 text-center mx-4">
            <div class="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
                <span class="text-2xl font-bold">🤖</span>
            </div>
            <h1 class="text-2xl font-bold text-blue-500 mb-0.5">CLINIC-AI 24H</h1>
            
            <!-- Assinatura profissional personalizada substituindo o texto antigo -->
            <p class="text-slate-400 text-sm font-medium mb-6">@jarbasquiro - Massoterapeuta e Quiropraxista</p>
            
            <div id="chat-container" style="white-space: pre-wrap;" class="border border-slate-800 bg-slate-950 rounded-xl p-4 h-84 overflow-y-auto mb-4 text-left text-sm space-y-3 min-h-[260px] max-h-[300px]">
                <div class="text-slate-300"><strong>Assistente:</strong> Olá, Jarbas! O chatbot está online e pronto para operar. Como posso te ajudar com os agendamentos ou fichas clínicas hoje?</div>
            </div>

            <div class="flex gap-2">
                <input type="text" id="user-input" placeholder="Digite sua mensagem..." class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-slate-100" onkeypress="if(event.key === 'Enter') enviarMensagem()">
                <button onclick="enviarMensagem()" id="btn-enviar" class="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition disabled:opacity-50">Enviar</button>
            </div>
        </div>

        <script>
            async function enviarMensagem() {
                const input = document.getElementById('user-input');
                const container = document.getElementById('chat-container');
                const btn = document.getElementById('btn-enviar');
                const texto = input.value.trim();

                if (!texto) return;

                input.value = '';
                input.disabled = true;
                btn.disabled = true;

                container.innerHTML += \`<div class="text-slate-100 text-right text-xs bg-slate-850 p-2 rounded-lg inline-block float-right clear-both max-w-[80%] my-1 border border-slate-800"><strong>Você:</strong> \${texto}</div>\`;
                container.scrollTop = container.scrollHeight;

                const digitandoId = 'typing-' + Date.now();
                container.innerHTML += \`<div id="\${digitandoId}" class="text-slate-400 italic animate-pulse clear-both my-1"><strong>Assistente:</strong> Pensando...</div>\`;
                container.scrollTop = container.scrollHeight;

                try {
                    const urlAcesso = window.location.origin + '/api/chat';
                    
                    const resposta = await fetch(urlAcesso, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ message: texto })
                    });
                    
                    const dados = await resposta.json();
                    
                    const elTyping = document.getElementById(digitandoId);
                    if(elTyping) elTyping.remove();

                    if (dados.response) {
                        container.innerHTML += \`<div class="text-blue-300 bg-slate-900/50 p-2 rounded-lg clear-both my-1 border border-slate-800/50"><strong>Assistente:</strong>\n\${dados.response}</div>\`;
                    } else if (dados.error) {
                        container.innerHTML += \`<div class="text-red-400 clear-both my-1"><strong>Assistente:</strong> \${dados.error}</div>\`;
                    } else {
                        container.innerHTML += \`<div class="text-red-400 clear-both my-1"><strong>Assistente:</strong> Resposta invalida.</div>\`;
                    }
                } catch (erro) {
                    const elTyping = document.getElementById(digitandoId);
                    if(elTyping) elTyping.remove();
                    container.innerHTML += \`<div class="text-red-400 clear-both my-1"><strong>Assistente:</strong> Erro ao conectar na API interna.</div>\`;
                }

                input.disabled = false;
                btn.disabled = false;
                input.focus();
                container.scrollTop = container.scrollHeight;
            }
        </script>
    </body>
    </html>
  `);
});

app.use((req, res) => {
  res.status(404).send("Rota nao encontrada.");
});

app.listen(port, () => {
  console.log(`🚀 Servidor rodando na porta ${port}`);
});
