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

// Chaves reais do ecossistema
const URL_REAL = 'https://cygqomkyiheoijarrnsu.supabase.co';
const KEY_REAL = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInN1YiI6ImN5Z3FvbWt5aWhlb2lqYXJybnN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTY4ODQwOTUsImV4cCI6MjAzMjQ2MDA5NX0.PB04DWKvLFMV1ffsrkJc6ktBo85w2HOnCzXJwRURmVU';

const supabase = createClient(URL_REAL, process.env.SUPABASE_SERVICE_KEY || KEY_REAL);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || 'gsk_ppeWEFnbjTBcoGSIe84WGdyb3FYqcakKIVamC0bOAcQXh1q91aI' });

// ROTA DA INTELIGÊNCIA ARTIFICIAL: Processa a conversa
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Mensagem vazia." });
    }

    // Chamada real para a API do Groq usando o modelo Llama 3
    const completion = await groq.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: "Você é o CLINIC-AI, um assistente virtual especialista em quiropraxia, massoterapia e recuperação de mobilidade. Ajude o profissional Jarbas de forma técnica, clara e prestativa." 
        },
        { role: "user", content: message }
      ],
      model: "llama3-8b-8192",
    });

    const respostaIA = completion.choices[0]?.message?.content || "Sem resposta.";

    // Opcional: Aqui você pode salvar no Supabase futuramente se desejar logs
    
    res.json({ response: respostaIA });
  } catch (error) {
    console.error("Erro na API:", error);
    res.status(500).json({ error: "Erro ao processar mensagem na IA." });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Entrega a interface com a lógica ativa de envio de mensagens
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
            <h1 class="text-2xl font-bold text-blue-500 mb-2">CLINIC-AI 24H</h1>
            <p class="text-slate-400 text-sm mb-6">Interface conectada diretamente ao servidor em nuvem.</p>
            
            <div id="chat-container" class="border border-slate-800 bg-slate-950 rounded-xl p-4 h-84 overflow-y-auto mb-4 text-left text-sm space-y-3 min-h-[260px] max-h-[300px]">
                <div class="text-blue-400 text-xs border-b border-slate-900 pb-1"><strong>Sistema:</strong> Conectado ao banco de dados Supabase com sucesso.</div>
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

                // Bloqueia interações enquanto espera a IA
                input.value = '';
                input.disabled = true;
                btn.disabled = true;

                // Adiciona a mensagem do usuário na tela
                container.innerHTML += \`<div class="text-slate-100 text-right"><strong>Você:</strong> \${texto}</div>\`;
                container.scrollTop = container.scrollHeight;

                // Adiciona indicador de digitando
                const digitandoId = 'typing-' + Date.now();
                container.innerHTML += \`<div id="\${digitandoId}" class="text-slate-400 italic animate-pulse"><strong>Assistente:</strong> Pensando...</div>\`;
                container.scrollTop = container.scrollHeight;

                try {
                    // Envia para a nossa API no backend
                    const resposta = await fetch('/api/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ message: texto })
                    });
                    
                    const dados = await respuesta.json();
                    
                    // Remove o indicador de digitando
                    document.getElementById(digitandoId).remove();

                    // Insere a resposta real da IA
                    if (dados.response) {
                        container.innerHTML += \`<div class="text-blue-300"><strong>Assistente:</strong> \${dados.response}</div>\`;
                    } else {
                        container.innerHTML += \`<div class="text-red-400"><strong>Assistente:</strong> Erro ao obter resposta.</div>\`;
                    }
                } catch (erro) {
                    document.getElementById(digitandoId).remove();
                    container.innerHTML += \`<div class="text-red-400"><strong>Assistente:</strong> Erro de conexão com o servidor.</div>\`;
                }

                // Libera os campos de volta
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

app.listen(port, () => {
  console.log(`🚀 Servidor rodando na porta ${port}`);
});
