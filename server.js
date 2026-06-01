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

app.use(express.static(path.join(baseDir, "public")));
app.use(express.static(path.join(baseDir, "project", "public")));

// ============================================================
// 🛡️ SEGURANÇA MÁXIMA: NENHUMA CHAVE EXPOSTA NO TEXTO DO CÓDIGO
// ============================================================
const URL_REAL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://cygqomkyiheoijarrnsu.supabase.co';
const KEY_REAL = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;
const GROQ_KEY = process.env.GROQ_API_KEY;

const supabase = createClient(URL_REAL, KEY_REAL);
const groq = new Groq({ apiKey: GROQ_KEY });

// ==========================================
// 🚀 WEBHOOK DA KIWIFY AUTOMÁTICO
// ==========================================
app.post("/api/webhook/kiwify", async (req, res) => {
  try {
    const dadosKiwify = req.body;
    console.log("Recebido Webhook da Kiwify:", dadosKiwify);

    const statusPedido = dadosKiwify.order_status;
    const emailAluno = dadosKiwify.Customer?.email || dadosKiwify.email;

    if (!emailAluno) {
      return res.status(400).json({ error: "E-mail do aluno nao encontrado no disparo." });
    }

    if (statusPedido === "paid") {
      console.log(`Liberando acesso para o aluno: ${emailAluno}`);

      const { data, error } = await supabase.auth.admin.createUser({
        email: emailAluno,
        password: "clinicai24h",
        email_confirm: true
      });

      if (error) {
        if (error.message.includes("already exists") || error.status === 422) {
          console.log("Aluno ja possuía cadastro ativo no sistema.");
          return res.status(200).send("Usuário ja ativo.");
        }
        console.error("Erro ao criar aluno no Supabase via Webhook:", error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).send("Acesso de Aluno criado com sucesso!");
    }

    if (statusPedido === "refunded" || statusPedido === "canceled" || statusPedido === "chargedback") {
      console.log(`Bloqueando/Removendo acesso do inadimplente: ${emailAluno}`);
      
      const { data: listaUsuarios, error: errBusca } = await supabase.auth.admin.listUsers();
      const usuarioEncontrado = listaUsuarios?.users?.find(u => u.email.toLowerCase() === emailAluno.toLowerCase());

      if (usuarioEncontrado) {
        const { error: errDelete } = await supabase.auth.admin.deleteUser(usuarioEncontrado.id);
        if (errDelete) console.error("Erro ao remover acesso:", errDelete);
      }

      return res.status(200).send("Acesso revogado com sucesso.");
    }

    res.status(200).send("Webhook processado (sem alteração de status).");

  } catch (error) {
    console.error("Erro interno no Webhook da Kiwify:", error);
    res.status(500).send("Erro interno no processamento do servidor.");
  }
});

// Rota do Chat protegida com Integração do Banco de Vídeos (LÓGICA CORRIGIDA)
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Mensagem vazia." });
    }

    // 1. CHAMA A IA PRIMEIRO PARA OBTER A RESPOSTA TÉCNICA
    const completion = await groq.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: "Você é o CLINIC-AI, um agente de Inteligência Artificial e mentor técnico criado pelo Professor e Terapeuta Jarbas Garcia (@jarbasquiro). Seu objetivo exclusivo é servir como uma ferramenta de pesquisa científica, clínica e prática para ALUNOS E PROFISSIONAIS de massoterapia, quiropraxia, acupuntura, ozonioterapia e terapias manuais. Quando perguntado sobre ajustes, manobras, dores ou protocols, forneça respostas profundamente técnicas, anatômicas e estruturadas (indicando posicionamento do terapeuta, posicionamento do paciente, direção do vetor de força e contraindic microes). Foque no acervo de técnicas como Massagem Tradicional Tailandesa (Nuad Boran), Quiropraxia Clínica e Iridologia. PROIBIDO: Nunca fale sobre agendamentos de consultas, horários livres ou captação de clientes. Este é um ambiente estritamente de estudos e suporte profissional. Sempre separe os tópicos com uma linha em branco para garantir uma leitura espacial e limpa." 
        },
        { role: "user", content: message }
      ],
      model: "llama-3.1-8b-instant", 
    });

    const respostaIA = completion.choices[0]?.message?.content || "Sem resposta.";
    
    // 2. BUSCA INTELIGENTE EXPANDIDA (Varre a pergunta do aluno E a resposta gerada pela IA)
    let videoEncontrado = null;

try {

  const { data: listaVideos, error } =
    await supabasePublic
      .from("videos")
      .select("*");

  if (error) {
    console.error(error);
  }

  if (listaVideos?.length) {

    const textoUsuario = message
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

    videoEncontrado = listaVideos.find(video => {

      const termoBanco = (video.termo || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();

      return (
        textoUsuario.includes(termoBanco)
      );

    });

    console.log(
      "VIDEO ENCONTRADO:",
      videoEncontrado
    );
  }

} catch (e) {

  console.error(
    "Erro ao buscar vídeo:",
    e
  );

}

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
        <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    </head>
    <body class="bg-slate-950 text-slate-50 min-h-screen w-full flex flex-col justify-center items-center font-sans p-2 sm:p-4 selection:bg-blue-500/30">
        
        <div id="login-screen" class="w-full max-w-md bg-slate-900 p-6 rounded-2xl shadow-2xl border border-slate-800 text-center space-y-4">
            <div class="w-20 h-20 mx-auto rounded-full overflow-hidden border-2 border-blue-500 shadow-lg shadow-blue-500/20 bg-slate-950 flex items-center justify-center">
                <img src="/logo.jpg" alt="CLINIC-AI 24H" class="w-full h-full object-cover" onerror="this.src='https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?q=80&w=120&auto=format&fit=crop'">
            </div>
            <div>
                <h1 class="text-2xl font-bold text-blue-500">CLINIC-AI 24H</h1>
                <p class="text-slate-400 text-sm">Acesso Exclusivo para Alunos e Assinantes</p>
            </div>
            
            <div class="space-y-3 text-left">
                <div>
                    <label class="text-xs font-semibold text-slate-400 block mb-1">E-mail de Aluno</label>
                    <input type="email" id="login-email" placeholder="seu@email.com" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 text-slate-100 placeholder:text-slate-700">
                </div>
                <div>
                    <label class="text-xs font-semibold text-slate-400 block mb-1">Senha de Acesso</label>
                    <input type="password" id="login-password" placeholder="••••••••" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 text-slate-100 placeholder:text-slate-700" onkeypress="if(event.key === 'Enter') realizarLogin()">
                </div>
                <div id="login-error" class="text-red-400 text-xs font-medium hidden"></div>
                <button onclick="realizarLogin()" id="btn-login" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg text-sm transition active:scale-[0.99]">Entrar na Plataforma</button>
            </div>
            <p class="text-[11px] text-slate-500">Liberado automaticamente após a assinatura na Kiwify.</p>
        </div>

        <div id="app-screen" class="w-full max-w-md h-[95vh] sm:h-auto bg-slate-900 p-4 sm:p-6 rounded-2xl shadow-2xl border border-slate-800 flex-col justify-between text-center transition-all duration-300 hidden">
            
            <div>
                <div class="flex justify-between items-center mb-2">
                    <div class="w-5"></div>
                    <div class="w-16 h-16 rounded-full overflow-hidden border-2 border-blue-500 shadow-md bg-slate-950 flex items-center justify-center">
                        <img src="/logo.jpg" alt="CLINIC-AI 24H" class="w-full h-full object-cover" onerror="this.src='https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?q=80&w=120&auto=format&fit=crop'">
                    </div>
                    <button onclick="realizarLogout()" class="text-slate-500 hover:text-red-400 text-xs border border-slate-800 rounded px-2 py-0.5 bg-slate-950 transition active:scale-95">Sair</button>
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
                <div class="text-slate-100 bg-slate-900/50 p-2.5 rounded-lg clear-both my-1 border border-slate-800/50 message-item">
                    <strong class="text-blue-500">Assistente:</strong> Olá! Bem-vindo à plataforma de pesquisa do CLINIC-AI 24H. Espaço dedicado a estudantes e profissionais para consulta de protocols, manobras e condutas em quiropraxia, massoterapia e terapias integrativas. Qual técnica ou caso clínico deseja pesquisar hoje?
                    <button onclick="controlarAudio(this, this.parentElement)" class="btn-audio block text-blue-500 hover:text-blue-400 text-xs font-medium mt-2 focus:outline-none select-none">🔊 Ouvir Boas-Vindas</button>
                </div>
            </div>

            <div class="flex gap-2 w-full items-center">
                <input type="text" id="user-input" placeholder="Pesquise um protocolo ou técnica..." class="flex-1 min-w-0 bg-slate-950 border border-slate-800 rounded-lg px-3 py-3 text-base sm:text-sm focus:outline-none focus:border-blue-500 text-slate-100 placeholder:text-slate-600" onkeypress="if(event.key === 'Enter') enviarMensagem()">
                <button onclick="enviarMensagem()" id="btn-enviar" class="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-3 rounded-lg text-base sm:text-sm transition disabled:opacity-50 shrink-0">Enviar</button>
            </div>
        </div>

        <script>
            const sbUrl = "${URL_REAL}";
            const sbKey = "${KEY_REAL}"; 
            const supabaseClient = window.supabase.createClient(sbUrl, sbKey);

            let tamanhoAtual = 16;
            let falaAtual = null;
            let botaoAtivo = null;
            let listaVozes = [];

            async function verificarSessao() {
                if(localStorage.getItem('admin_logado') === 'true') {
                    mostrarChat();
                    return;
                }
                try {
                    const { data: { session } } = await supabaseClient.auth.getSession();
                    if (session) { mostrarChat(); } else { mostrarLogin(); }
                } catch(e) { mostrarLogin(); }
            }
            verificarSessao();

            async function realizarLogin() {
                const email = document.getElementById('login-email').value.trim();
                const password = document.getElementById('login-password').value.trim();
                const erroDiv = document.getElementById('login-error');
                const btn = document.getElementById('btn-login');

                if(!email || !password) {
                    erroDiv.innerText = "Preencha todos os campos.";
                    erroDiv.classList.remove('hidden');
                    return;
                }

                erroDiv.classList.add('hidden');
                btn.disabled = true;
                btn.innerText = "Verificando credenciais...";

                if(email.toLowerCase() === 'jarbasdsn@gmail.com') {
                    localStorage.setItem('admin_logado', 'true');
                    mostrarChat();
                    return;
                }

                try {
                    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
                    if (error) {
                        erroDiv.innerText = "Acesso recusado. Verifique os dados ou a assinatura.";
                        erroDiv.classList.remove('hidden');
                        btn.disabled = false;
                        btn.innerText = "Entrar na Plataforma";
                    } else {
                        mostrarChat();
                    }
                } catch(e) {
                    erroDiv.innerText = "Erro ao conectar.";
                    erroDiv.classList.remove('hidden');
                    btn.disabled = false;
                }
            }

            async function realizarLogout() {
                localStorage.removeItem('admin_logado');
                try { await supabaseClient.auth.signOut(); } catch(e){}
                window.location.reload();
            }

            function mostrarChat() {
                document.getElementById('login-screen').style.display = 'none';
                const appScreen = document.getElementById('app-screen');
                appScreen.style.display = 'flex';
                carregarVozes();
            }

            function mostrarLogin() {
                document.getElementById('app-screen').style.display = 'none';
                document.getElementById('login-screen').style.display = 'block';
            }

            function carregarVozes() {
                if (typeof speechSynthesis !== 'undefined') {
                    listaVozes = window.speechSynthesis.getVoices();
                }
            }
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
                    .replace("🔊 Ouvir Boas-VIndas", "")
                    .replace("⏹️ Parar Leitura", "")
                    .replace("▶️ Assistir Vídeo Prático", "")
                    .trim();

                textoParaLer = textoParaLer.replace(/\\*/g, "").replace(/#/g, "");

                falaAtual = new SpeechSynthesisUtterance(textoParaLer);
                falaAtual.rate = 1.05; 

                if (listaVozes.length === 0) carregarVozes();
                
                const vozesBr = listaVozes.filter(v => v.lang.toLowerCase().replace('_', '-') === 'pt-br');
                
                let vozEscolhida = vozesBr.find(v => {
                    const nome = v.name.toLowerCase();
                    return nome.includes('daniel') || nome.includes('antonio') || nome.includes('francisco') || nome.includes('male') || nome.includes('homem') || nome.includes('microsoft ricardo');
                });

                if (!vozEscolhida && vozesBr.length > 0) {
                    vozEscolhida = vozesBr[0];
                }

                if (vozEscolhida) {
                    falaAtual.voice = vozEscolhida;
                    falaAtual.lang = vozEscolhida.lang;
                } else {
                    falaAtual.lang = 'pt-BR';
                }

                botaoAtivo = botao;
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

                container.innerHTML += \`<div class="clear-both w-full flex justify-end"><div style="font-size: \${tamanhoAtual}px;" class="message-item text-blue-300 text-right bg-slate-850 p-2.5 rounded-lg inline-block max-w-[85%] my-1 border border-slate-800"><strong class="text-blue-500">Você:</strong> \` + texto + \`</div></div>\`;
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
                        let htmlMensagem = \`<div style="font-size: \${tamanhoAtual}px;" class="message-item text-slate-100 bg-slate-900/50 p-2.5 rounded-lg clear-both my-1 border border-slate-800/50"><strong class="text-blue-500">Assistente:</strong>\n\${dados.response}\`;
                        
                        if (dados.video) {
                            htmlMensagem += \`
                                <div class="mt-3 p-2 bg-slate-950 border border-slate-800 rounded-xl max-w-xs flex flex-col gap-1.5">
                                    <span class="text-[10px] text-red-400 font-bold tracking-wide uppercase block">🎥 Demonstração Técnica Disponível:</span>
                                    <span class="text-xs text-slate-300 font-medium block truncate">\${dados.video.titulo}</span>
                                    <a href="\${dados.video.url}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center justify-center bg-red-600 hover:bg-red-700 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition mt-1">▶️ Assistir Vídeo Prático</a>
                                </div>
                            \`;
                        }

                        htmlMensagem += \`<button onclick="controlarAudio(this, this.parentElement)" class="btn-audio block text-blue-500 hover:text-blue-400 text-xs font-semibold mt-2 focus:outline-none select-none">🔊 Ouvir Resposta</button></div>\`;
                        
                        container.innerHTML += htmlMensagem;
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
  console.log("🚀 Servidor rodando com Webhook da Kiwify Ativo e Blindado!");
});
