// 1. Inicia o dotenv antes de tudo para o Render ler as chaves
require("dotenv").config();

const express = require('express');
const cors = require('cors');
const fs = require("fs");
const path = require("path");
const { createClient } = require('@supabase/supabase-js');
const Groq = require("groq-sdk");

// 2. Configuração do Supabase usando as variáveis do Environment
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
// Rota principal para o Render validar o serviço
app.get('/', (req, res) => {
  res.send('🚀 Clinical AI Chatbot - Servidor Backend Ativo e Rodando na Web!');
});

// Configuração de Porta e Host conforme a documentação do Render
const port = process.env.PORT || 10000;

app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor público rodando perfeitamente na porta ${port}`);
});

app.use(cors());
app.use(express.json());

// 3. Configuração do Groq
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// 4. Sistema de busca na base de conhecimento local
function searchKnowledge(question) {
  const knowledgePath = path.join(__dirname, "knowledge");
  
  if (!fs.existsSync(knowledgePath)) {
    return "";
  }

  const files = fs.readdirSync(knowledgePath);
  let relevantContent = "";
  const keywords = question.toLowerCase().split(" ");

  files.forEach((file) => {
    if (file.endsWith(".txt")) {
      const content = fs.readFileSync(path.join(knowledgePath, file), "utf-8");
      const lowerContent = content.toLowerCase();
      const hasKeyword = keywords.some((word) => lowerContent.includes(word));

      if (hasKeyword) {
        relevantContent += "\n\n" + content;
      }
    }
  });

  return relevantContent;
}

// 5. Rota do Chatbot Clínico
app.post("/chat", async (req, res) => {
  try {
    const { message, history } = req.body;
    const knowledgeBase = searchKnowledge(message);
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `
Você é o CLINIC-AI 24H.

Um assistente clínico de consulta rápida para:
- massoterapia
- quiropraxia
- acupuntura
- anatomia
- fisiologia
- biomecânica
- dor musculoesquelética
- trigger points
- terapias manuais
- avaliação funcional

Use a base de conhecimento abaixo para responder:
${knowledgeBase}

REGRAS IMPORTANTES:
- Responda de forma prática.
- Seja rápido e objective.
- Organize em tópicos.
- Foque em aplicação clínica.
- Evite textos longos.
- Não explique teoria excessive.
- Nunca invente diagnósticos.
- Nunca substitua médicos.
- Nunca prescreva medicamentos.
- Oriente encaminhamento quando houver risco.

Sempre use emojis clínicos nos títulos:
📌 Avaliação
📌 Técnicas úteis
📌 Contraindicações
📌 Encaminhamento
📌 Observações

As respostas devem parecer um guia rápido clínico.
`,
        },
        ...(history || []),
        {
          role: "user",
          content: message,
        },
      ],
      model: "llama3-8b-8192",
      temperature: 0.5,
      max_tokens: 500,
    });

    res.json({
      reply: completion.choices[0].message.content,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro servidor" });
  }
});

// 6. Rota do Webhook da Kiwify
app.post('/kiwify-webhook', async (req, res) => {
  try {
    const data = req.body;
    console.log('Webhook recebido da Kiwify');

    const email = data.Customer?.email;

    if (!email) {
      return res.status(400).send('Email não encontrado no payload');
    }

    await supabase
      .from('subscribers')
      .upsert([
        {
          email,
          active: true,
          plan: 'premium',
        },
      ]);

    console.log('Acesso liberado para o aluno:', email);
    res.sendStatus(200);
  } catch (error) {
    console.error('Erro no webhook:', error);
    res.sendStatus(500);
  }
});

// 7. Inicialização do Servidor na Porta Dinâmica do Render
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});