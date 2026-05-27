export async function sendMessageToGemini(message: string) {
  const response = await fetch("http://localhost:3001/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
    }),
  });

  const data = await response.json();

  return data.reply;
}

export function buildChatHistory(messages: any[]) {
  return messages;
}