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

if (pastaDistEfetiva) {
  app.use(express.static(pastaDistEfetiva));
}
app.use(express.static(path.join(baseDir, "public")));
app.use(express.static(path.join(baseDir, "project", "public")));

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
          content: "Você é o CLINIC-AI, um agente de Inteligência Artificial e mentor técnico criado pelo Professor e Terapeuta Jarbas Garcia (@jarbasquiro). Seu objetivo exclusivo é servir como uma ferramenta de pesquisa científica, clínica e prática para ALUNOS E PROFISSIONAIS de massoterapia, quiropraxia, acupuntura, ozonioterapia e terapias manuais. Quando perguntado sobre ajustes, manobras, dores ou protocols, forneça respostas profundamente técnicas, anatômicas e estruturadas (indicando posicionamento do terapeuta, posicionamento do paciente, direção do vetor de força e contraindicações). Foque no acervo de técnicas como Massagem Tradicional Tailandesa (Nuad Boran), Quiropraxia Clínica e Iridologia. PROIBIDO: Nunca fale sobre agendamentos de consultas, horários livres ou captação de clientes. Este é um ambiente estritamente de estudos e suporte profissional. Sempre separe os tópicos com uma linha em branco para garantir uma leitura espacial e limpa." 
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
    <body class="bg-slate-950 text-slate-50 min-h-screen w-full flex flex-col justify-center items-center font-sans p-2 sm:p-4 selection:bg-blue-500/30">
        
        <div class="w-full max-w-md h-[95vh] sm:h-auto bg-slate-900 p-4 sm:p-6 rounded-2xl shadow-2xl border border-slate-800 flex flex-col justify-between text-center transition-all duration-300">
            
            <div>
                <div class="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-3 rounded-full overflow-hidden border-2 border-blue-500 shadow-lg shadow-blue-500/20 bg-slate-950 flex items-center justify-center">
                    <img src="/logo.jpg" alt="CLINIC-AI 24H" class="w-full h-full object-cover" onerror="this.src='https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?q=80&w=120&auto=format&fit=crop'">
                </div>
                <h1 class="text-2xl font-bold text-blue-500 mb-0.5">CLINIC-AI 24H</h1>
                <p class="text-slate-400 text-sm font-medium mb-2">@jarbasquiro - Massoterapeuta e Quiropraxista</p>
                
                <div class="flex justify-center items-center gap-3 mb-4 text-xs text-slate-500 bg-slate-950/60 py-1 px-3 rounded-full w-fit mx-auto border border-slate-800/40">
                    <span>Tamanho do texto:</span>
                    <button onclick="alterarFonte(-1)" class="hover:text-blue-400 font-bold px-2 py-0.5 bg-slate-850 rounded border border-slate-800 active:scale-95 transition">A-</button>
                    <button onclick="alterarFonte(1)" class="hover:text-blue-400 font-bold px-2 py-0.5 bg-slate-850 rounded border border-slate-800 active:scale-95 transition">A+</button>
                </div>
            </div>
            
            <div id="chat-container" style="white-space: pre-wrap; font-size: 16px;" class="flex-1 border border-slate-800 bg-slate-950 rounded-xl p-3 sm:p-4 overflow-y-auto mb-4 text-left space-y-3 min-h-[180px] max-h-[55vh] sm:max-h-[350px]">
                <div class="text-slate-300 message-item">
                    <strong>Assistente:</strong> Olá! Bem-vindo à plataforma de pesquisa do CLINIC-AI 24H. Espaço dedicado a estudantes e profissionais para consulta de protocolos, manobras e condutas em quiropraxia, massoterapia e terapias integrativas. Qual técnica ou caso clínico deseja pesquisar hoje?
                    <button onclick="controlarAudio(this, this.parentElement)" class="btn-audio block text-blue-500 hover:text-blue-400 text-xs font-medium mt-2 focus:outline-none select-none">🔊 Ouvir Boas-Vindas</button>
                </div>
            </div>

            <div class="flex gap-2 w-full items-center">
                <input type="text" id="user-input" placeholder="Pesquise um protocolo ou técnica..." class="flex-1 min-w-0 bg-slate-950 border border-slate-800 rounded-lg px-3 py-3 text-base sm:text-sm focus:outline-none focus:border-blue-500 text-slate-100 placeholder:text-slate-600" onkeypress="if(event.key === 'Enter') enviarMensagem()">
                <button onclick="enviarMensagem()" id="btn-enviar" class="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-3 rounded-lg text-base sm:text-sm transition disabled:opacity-50 shrink-0">Enviar</button>
            </div>
        </div>

        <script>
            let tamanhoAtual = 16;
            let falaAtual = null;
            let botaoAtivo = null;
            let listaVozes = [];

            // Carrega e atualiza a lista de vozes de forma robusta no navegador
            function carregarVozes() {
                if (typeof speechSynthesis !== 'undefined') {
                    listaVozes = window.speechSynthesis.getVoices();
                }
            }
            carregarVozes();
            if (typeof speechSynthesis !== 'undefined' && speechSynthesis.onvoiceschanged !== undefined) {
                speechSynthesis.onvoiceschanged = carregarVozes;
            }

            function controlarAudio(botao, elementoPai) {
                if (window.speechSynthesis.speaking && botaoAtivo === botao) {
                    window.speechSynthesis.cancel();
                    resetarBotoesAudio();
                    return;
                }

                window.speechSynthesis.cancel();
                resetarBotoesAudio();

                let textoParaLer = elementoPai.innerText
                    .replace("🔊 Ouvir Resposta", "")
                    .replace("🔊 Ouvir Boas-Vindas", "")
                    .replace("⏹️ Parar Leitura", "")
                    .trim();

                falaAtual = new SpeechSynthesisUtterance(textoParaLer);
                falaAtual.rate = 1.05; // Ajustado sutilmente para um tom mais natural e firme

                // NOVO FILTRO AGRESSIVO DE VOZ MASCULINA BRASILEIRA
                if (listaVozes.length === 0) carregarVozes();
                
                // Filtra apenas as vozes que são estritamente do Brasil (pt-BR)
                const vozesBr = listaVozes.filter(v => v.lang.toLowerCase().replace('_', '-') === 'pt-br');
                
                // 1ª tentativa: Busca cirúrgica por nomes masculinos conhecidos no ecossistema mobile/desktop
                let vozEscolhida = vozesBr.find(v => {
                    const nome = v.name.toLowerCase();
                    return nome.includes('daniel') || 
                           nome.includes('antonio') || 
                           nome.includes('francisco') || 
                           nome.includes('male') || 
                           nome.includes('homem') || 
                           nome.includes('guy') || 
                           nome.includes('pablo') ||
                           nome.includes('microsoft ricardo');
                });

                // 2ª tentativa: Se não achou um nome masculino explícito na varredura, tenta a primeira voz pt-BR disponível
                if (!vozEscolhida && vozesBr.length > 0) {
                    vozEscolhida = vozesBr[0];
                }

                if (vozEscolhida) {
                    falaAtual.voice = vozEscolhida;
                    falaAtual.lang = vozEscolhida.lang;
                } else {
                    falaAtual.lang = 'pt-BR';
                }

                botaoAtivo = block = botao;
                botao.innerHTML = "⏹️ Parar Leitura";
                botao.classList.remove("text-blue-500");
                botao.classList.add("text-red-400", "font-bold");

                falaAtual.onend = function() {
                    resetarBotoesAudio();
                };

                window.speechSynthesis.speak(falaAtual);
            }

            function resetarBotoesAudio() {
                const botoes = document.querySelectorAll('.btn-audio');
                botoes.forEach(b => {
                    if (b.innerText.includes("Boas-Vindas")) {
                        b.innerHTML = "🔊 Ouvir Boas-Vindas";
                    } else {
                        b.innerHTML = "🔊 Ouvir Resposta";
                    }
                    b.classList.remove("text-red-400", "font-bold");
                    b.classList.add("text-blue-500");
                });
                falaAtual = null;
                botaoAtivo = null;
            }

            function alterarFonte(direcao) {
                tamanhoAtual += direcao;
                if (tamanhoAtual < 13) tamanhoAtual = 13;
                if (tamanhoAtual > 24) tamanhoAtual = 24;
                
                const container = document.getElementById('chat-container');
                container.style.fontSize = tamanhoAtual + 'px';
                
                const itens = container.querySelectorAll('.message-item');
                itens.forEach(item => {
                    item.style.fontSize = tamanhoAtual + 'px';
                });
            }

            async function enviarMensagem() {
                const input = document.getElementById('user-input');
                const container = document.getElementById('chat-container');
                const btn = document.getElementById('btn-enviar');
                const texto = input.value.trim();

                if (!texto) return;

                input.value = '';
                input.disabled = true;
                btn.disabled = true;

                container.innerHTML += \`<div class="clear-both w-full flex justify-end"><div style="font-size: \${tamanhoAtual}px;" class="message-item text-slate-100 text-right bg-slate-850 p-2.5 rounded-lg inline-block max-w-[85%] my-1 border border-slate-800"><strong>Você:</strong> \` + texto + \`</div></div>\`;
                container.scrollTop = container.scrollHeight;

                const digitandoId = 'typing-' + Date.now();
                container.innerHTML += \`<div id="\${digitandoId}" style="font-size: \${tamanhoAtual}px;" class="message-item text-slate-400 italic animate-pulse clear-both my-1"><strong>Assistente:</strong> Pesquisando acervo...</div>\`;
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
                        container.innerHTML += \`<div style="font-size: \${tamanhoAtual}px;" class="message-item text-blue-300 bg-slate-900/50 p-2.5 rounded-lg clear-both my-1 border border-slate-800/50"><strong>Assistente:</strong>\n\${dados.response}<button onclick="controlarAudio(this, this.parentElement)" class="btn-audio block text-blue-500 hover:text-blue-400 text-xs font-semibold mt-2 focus:outline-none select-none">🔊 Ouvir Resposta</button></div>\`;
                    } else if (dados.error) {
                        container.innerHTML += \`<div style="font-size: \${tamanhoAtual}px;" class="message-item text-red-400 clear-both my-1"><strong>Assistente:</strong> \${dados.error}</div>\`;
                    } else {
                        container.innerHTML += \`<div style="font-size: \${tamanhoAtual}px;" class="message-item text-red-400 clear-both my-1"><strong>Assistente:</strong> Resposta invalida.</div>\`;
                    }
                } catch (erro) {
                    const elTyping = document.getElementById(digitandoId);
                    if(elTyping) elTyping.remove();
                    container.innerHTML += \`<div style="font-size: \${tamanhoAtual}px;" class="message-item text-red-400 clear-both my-1"><strong>Assistente:</strong> Erro ao conectar na API interna.</div>\`;
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
  console.log("🚀 Servidor rodando com escaneamento aprimorado de vozes masculinas!");
});
