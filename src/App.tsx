import { useState, useRef, useEffect } from 'react';
import {
  Stethoscope,
  Sparkles,
} from 'lucide-react';

import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import { supabase } from './lib/supabase';
import { checkSubscription } from './lib/checkSubscription';
import Auth from './components/Auth';
import jsPDF from 'jspdf';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

function App() {
  const [session, setSession] = useState<any>(null);
  const [authorized, setAuthorized] = useState(false);
  const [fontSize, setFontSize] = useState<number>(16); // Controla o tamanho da fonte das mensagens
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Olá! Sou o CLINIC-AI 24H, seu assistente clínico especializado.',
      isBot: true,
      timestamp: new Date(),
    },
  ]);

  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(async ({ data: { session } }) => {
        setSession(session);

        if (session?.user?.email) {
          const allowed = await checkSubscription(session.user.email);
          setAuthorized(allowed);
        }
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);

        if (session?.user?.email) {
          const allowed = await checkSubscription(session.user.email);
          setAuthorized(allowed);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  }, [messages]);

  const handleFavorite = (message: string) => {
    setFavorites((prev) => [...prev, message]);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('CLINIC-AI 24H', 20, 20);
    doc.setFontSize(12);
    let y = 40;

    favorites.forEach((item) => {
      const lines = doc.splitTextToSize(item, 170);
      doc.text(lines, 20, y);
      y += lines.length * 7 + 10;

      if (y > 260) {
        doc.addPage();
        y = 20;
      }
    });

    doc.save('protocolos-clinicos.pdf');
  };

  const handleSendMessage = async (text: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const chatHistory = messages.map((msg) => ({
        role: msg.isBot ? 'assistant' : 'user',
        content: msg.text,
      }));

      const response = await fetch('https://clinical-ai-chatbot.onrender.com/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          history: chatHistory,
        }),
      });

      if (!response.ok) {
        throw new Error('Falha na resposta do servidor.');
      }

      const data = await response.json();
      const botResponseText = data.response || data.text || 'Sem resposta cadastrada.';

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponseText,
        isBot: true,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Erro ao processar mensagem. Verifique a conexão com o servidor.',
        isBot: true,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!session) {
    return <Auth />;
  }

  if (!authorized) {
    return (
      <div className="h-screen flex items-center justify-center bg-dark-900 text-white">
        <div className="bg-dark-800 p-8 rounded-2xl border border-dark-700 text-center">
          <h1 className="text-2xl font-bold mb-4">Acesso não liberado</h1>
          <p className="text-gray-400 mb-6">Sua assinatura ainda não está ativa.</p>
          <button onClick={() => supabase.auth.signOut()} className="px-5 py-3 rounded-xl bg-accent-700">
            Sair
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-dark-900 flex flex-col">
      {/* HEADER LIMPO E COMPATÍVEL COM CELULAR */}
      <header className="flex items-center justify-between px-4 py-3 bg-dark-800 border-b border-dark-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-700 flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-sm sm:text-base">CLINIC-AI 24H</h1>
            <p className="text-[10px] text-gray-400">@jarbasquiro - Massoterapeuta e Quiropraxista</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={exportPDF} className="px-3 py-1.5 rounded-xl bg-accent-700 text-white text-xs font-medium">
            PDF
          </button>
          <button onClick={() => supabase.auth.signOut()} className="px-3 py-1.5 rounded-xl bg-dark-700 text-white text-xs font-medium">
            Sair
          </button>
        </div>
      </header>

      {/* FAVORITOS */}
      {favorites.length > 0 && (
        <div className="bg-dark-800 border-b border-dark-700 p-3 overflow-x-auto">
          <div className="flex gap-2">
            {favorites.map((fav, index) => (
              <div key={index} className="min-w-[250px] bg-dark-700 p-3 rounded-xl text-xs text-gray-300">
                {fav.substring(0, 150)}...
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CHAT COM TAMANHO DE FONTE DINÂMICO */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4" style={{ fontSize: `${fontSize}px` }}>
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            message={msg.text}
            isBot={msg.isBot}
            timestamp={msg.timestamp}
            onFavorite={handleFavorite}
          />
        ))}

        {isLoading && (
          <div className="flex gap-2 items-center text-gray-400">
            <Sparkles className="w-4 h-4 animate-pulse" />
            Pensando...
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* PAINEL FIXO DOS BOTÕES DE TAMANHO DE FONTE (Logo acima do campo de texto) */}
      <div className="px-4 py-2 bg-dark-800 border-t border-dark-700 flex items-center justify-center gap-4">
        <span className="text-xs text-gray-400 font-medium">Tamanho da Letra:</span>
        <div className="flex bg-dark-700 rounded-xl border border-dark-600 overflow-hidden shadow-md">
          <button
            onClick={() => setFontSize(prev => Math.max(prev - 2, 12))}
            className="px-4 py-2 text-white text-sm font-bold hover:bg-dark-600 active:bg-dark-500 transition-colors"
          >
            A -
          </button>
          <div className="w-[1px] bg-dark-600" />
          <button
            onClick={() => setFontSize(prev => Math.min(prev + 2, 26))}
            className="px-4 py-2 text-white text-sm font-bold hover:bg-dark-600 active:bg-dark-500 transition-colors"
          >
            A +
          </button>
        </div>
      </div>

      {/* INPUT */}
      <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
    </div>
  );
}

export default App;
