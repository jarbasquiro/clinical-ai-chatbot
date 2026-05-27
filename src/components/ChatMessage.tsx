import { Bot, User, Star } from 'lucide-react';

interface ChatMessageProps {
  message: string;
  isBot: boolean;
  timestamp?: Date;
  onFavorite?: (message: string) => void;
}

export default function ChatMessage({
  message,
  isBot,
  timestamp,
  onFavorite,
}: ChatMessageProps) {
  return (
    <div
      className={`flex gap-3 ${
        isBot ? 'justify-start' : 'justify-end'
      }`}
    >
      {isBot && (
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-accent-700 flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
      )}

      <div
        className={`max-w-[85%] px-4 py-3 rounded-2xl ${
          isBot
            ? 'bg-dark-700 text-white rounded-tl-sm'
            : 'bg-accent-700 text-white rounded-tr-sm'
        }`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {message}
        </p>

        <div className="flex items-center justify-between mt-3">

          {timestamp && (
            <p className="text-xs opacity-50">
              {new Date(timestamp).toLocaleTimeString(
                'pt-BR',
                {
                  hour: '2-digit',
                  minute: '2-digit',
                }
              )}
            </p>
          )}

          {isBot && onFavorite && (
            <button
              onClick={() => onFavorite(message)}
              className="ml-3 opacity-70 hover:opacity-100 transition"
            >
              <Star className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {!isBot && (
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-dark-700 flex items-center justify-center">
          <User className="w-5 h-5 text-white" />
        </div>
      )}
    </div>
  );
}