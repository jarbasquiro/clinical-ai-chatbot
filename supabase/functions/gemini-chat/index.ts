import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.21.0";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ChatMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

interface RequestBody {
  message: string;
  history?: ChatMessage[];
}

const SYSTEM_PROMPT = `Você é o CLINIC-AI 24H, um assistente clínico especializado e experiente para massoterapeutas, quiropratas e acupunturistas.

Sua função é fornecer suporte clínico rápido, preciso e profissional para profissionais de terapia manual.

Diretrizes de resposta:
1. Seja conciso mas completo - respostas estruturadas são preferidas
2. Use formatação com bullets e negrito quando apropriado
3. Sempre mencione contraindicações quando relevante
4. Forneça informações anatômicas precisas
5. Sugira protocolos práticos baseados em evidências
6. Use linguagem técnica apropriada mas acessível
7. Indique quando um paciente deve ser encaminhado a um médico

Áreas de especialização:
- Massoterapia: técnicas, indicações, contraindicações
- Quiropraxia: ajustes, técnicas, protocolos
- Acupuntura: pontos, meridianos, tratamentos
- Anatomia aplicada: músculos, nervos, biomecânica
- Contraindicações e segurança no atendimento

Sempre priorize a segurança do paciente e a prática ética.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY not configured");
      return new Response(
        JSON.stringify({
          error: "API key not configured. Please add GEMINI_API_KEY to your secrets."
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const body: RequestBody = await req.json();
    const { message, history = [] } = body;

    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: SYSTEM_PROMPT,
    });

    const chat = model.startChat({
      history: history.map((msg) => ({
        role: msg.role,
        parts: msg.parts,
      })),
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
      },
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    return new Response(
      JSON.stringify({
        message: text,
        model: "gemini-1.5-flash",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in gemini-chat function:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error.message || "Unknown error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
