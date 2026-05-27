require("dotenv").config();
const express = require('express');
const cors = require('cors');
const fs = require("fs");
const path = require("path");
const { createClient } = require('@supabase/supabase-js');
const Groq = require("groq-sdk");

const app = express();
app.use(cors());
app.use(express.json());

// Serve os arquivos do frontend da pasta dist
app.use(express.static(path.join(__dirname, 'dist')));

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "CHAVE_RESERVA",
});

function searchKnowledge(question) {
  const knowledgePath = path.join(__dirname, "knowledge");
  if (!fs.existsSync(knowledgePath)) return "";
  const files = fs.readdirSync(knowledgePath);
  let relevantContent = "";
  const keywords = question.toLowerCase().split(" ");
  files.forEach((file) => {
    if (file.endsWith(".txt")) {
      const content = fs.readFileSync(path.join(knowledgePath, file), "utf-8");
      const lowerContent = content.toLowerCase();
      const hasKeyword = keywords.some((word) => lowerContent.includes(word));
      if (hasKeyword) relevantContent += "\n\n" + content;
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
          content: `Você é o CLINIC-AI 24H. Use a base de conhecimento:\n${knowledgeBase}`
        },
        ...(history || []),
        { role: "user", content: message }
      ],
      model: "llama3-8b-8192",
      temperature: 0.5,
      max_tokens: 500,
    });
    res.json({
      reply: completion.choices[0].message.content,
      response: completion.choices[0].message.content
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro servidor" });
  }
});

app.post('/kiwify-webhook', async (req, res) => {
  try {
    // Inicialização sob demanda apenas quando o webhook for chamado
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;
    
    if (!supabaseUrl || !supabaseKey) return res.status(500).send('Erro de configuração');
    const supabase = createClient(supabaseUrl, supabaseKey);

    const data = req.body;
    const email = data.Customer?.email;
    if (!email) return res.status(400).send('Email não encontrado');
    await supabase.from('subscribers').upsert([{ email, active: true, plan: 'premium' }]);
    res.sendStatus(200);
  } catch (error) {
    res.sendStatus(500);
  }
});

// Entrega o HTML do chat direto
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
