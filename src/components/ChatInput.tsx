import { useState, FormEvent } from 'react';
import { Send, Mic } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
}

export default function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-3xl mx-auto px-4 mb-4"
    >
      <div className="relative flex items-center bg-gradient-to-r from-dark-700 to-dark-800 rounded-2xl border border-dark-500/50 shadow-2xl focus-within:border-accent-600/50 transition-all duration-300">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Digite sua mensagem clínica..."
          disabled={isLoading}
          className="flex-1 bg-transparent text-white placeholder-gray-500 px-5 py-4 pr-24 outline-none text-sm md:text-base disabled:opacity-50"
        />

        <div className="absolute right-2 flex items-center gap-2">
          <button
            type="button"
            className="p-2 text-gray-500 hover:text-accent-500 transition-colors duration-200 md:block hidden"
            title="Entrada de voz (em breve)"
          >
            <Mic className="w-5 h-5" />
          </button>

          <button
            type="submit"
            disabled={!message.trim() || isLoading}
            className="p-3 bg-gradient-to-r from-accent-700 to-accent-800 rounded-xl text-white hover:from-accent-600 hover:to-accent-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-accent-600/25 active:scale-95"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      <p className="text-center text-xs text-gray-600 mt-3">
        CLINIC-AI 24H pode cometer erros. Verifique sempre as informações importantes.
      </p>
    </form>
  );
}
