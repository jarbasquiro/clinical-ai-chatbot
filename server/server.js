const { createClient } = require('@supabase/supabase-js');
const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
require("dotenv").config();

const Groq = require("groq-sdk");
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);
const app = express();

app.use(cors());
app.use(express.json());

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});
function searchKnowledge(question) {
  const knowledgePath = path.join(__dirname, "knowledge");

  const files = fs.readdirSync(knowledgePath);

  let relevantContent = "";

  const keywords = question
    .toLowerCase()
    .split(" ");

  files.forEach((file) => {
    if (file.endsWith(".txt")) {
      const content = fs.readFileSync(
        path.join(knowledgePath, file),
        "utf-8"
      );

      const lowerContent = content.toLowerCase();

      const hasKeyword = keywords.some((word) =>
        lowerContent.includes(word)
      );

      if (hasKeyword) {
        relevantContent += "\n\n" + content;
      }
    }
  });

  return relevantContent;
}
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
- Seja rápido e objetivo.
- Organize em tópicos.
- Foque em aplicação clínica.
- Evite textos longos.
- Não explique teoria excessiva.
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

    res.status(500).json({
      error: "Erro servidor",
    });
  }
});
app.post('/kiwify-webhook', async (req, res) => {
  try {
    const data = req.body;

    console.log('Webhook recebido');

    const email =
      data.Customer.email;

    await supabase
      .from('subscribers')
      .upsert([
        {
          email,
          active: true,
          plan: 'premium',
        },
      ]);

    console.log(
      'Aluno liberado:',
      email
    );

    res.sendStatus(200);

  } catch (error) {
    console.error(error);

    res.sendStatus(500);
  }
});

// O Render define a porta automaticamente através de process.env.PORT
const PORT = process.env.PORT || 3001;

// É OBRIGATÓRIO incluir o '0.0.0.0' para o Render funcionar no plano gratuito
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});