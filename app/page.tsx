"use client";

import { useEffect, useRef, useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
  time: string;
  meta?: "greeting";
};

// Natural, human-like greetings (no robotic "Меня зовут ассистент...").
const GREETINGS: string[] = [
  "Здравствуйте 🙂 Чем могу помочь?",
  "Добрый день 🙂 Расскажите немного о вашей ситуации.",
  "Здравствуйте 🙂 Что вас интересует: финансирование, ипотека или коммерческая недвижимость?",
];

// Minimum delay before the assistant reply appears (human-like, WhatsApp feel).
const MIN_TYPING_MS = 3000;

function nowTime(): string {
  return new Date().toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("senim_session_id");
  if (!id) {
    id =
      "sess_" +
      Date.now().toString(36) +
      "_" +
      Math.random().toString(36).slice(2, 10);
    localStorage.setItem("senim_session_id", id);
  }
  return id;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Initialise session + a randomly chosen natural greeting on the client only
  // (avoids SSR hydration mismatch).
  useEffect(() => {
    setSessionId(getSessionId());
    const greeting = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
    setMessages([
      { role: "assistant", content: greeting, time: nowTime(), meta: "greeting" },
    ]);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const userMessage: Message = { role: "user", content: text, time: nowTime() };
    const newMessages: Message[] = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    const startedAt = Date.now();

    try {
      // Only send the real conversation (skip the static greeting bubble).
      const payloadMessages = newMessages
        .filter((m) => m.meta !== "greeting")
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, messages: payloadMessages }),
      });

      const data = await res.json();
      const reply =
        data.reply || "Извините, произошла ошибка. Попробуйте ещё раз.";

      // Keep the typing indicator visible for at least MIN_TYPING_MS so it
      // feels like a real manager is typing.
      const elapsed = Date.now() - startedAt;
      if (elapsed < MIN_TYPING_MS) {
        await sleep(MIN_TYPING_MS - elapsed);
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: reply, time: nowTime() },
      ]);
    } catch {
      const elapsed = Date.now() - startedAt;
      if (elapsed < MIN_TYPING_MS) {
        await sleep(MIN_TYPING_MS - elapsed);
      }
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Ошибка соединения. Попробуйте ещё раз.",
          time: nowTime(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <main className="mx-auto flex h-screen max-w-2xl flex-col bg-[#efeae2]">
      {/* WhatsApp-style header */}
      <header className="flex items-center gap-3 bg-[#075e54] px-4 py-3 text-white shadow">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#128c7e] text-sm font-bold">
          SC
        </div>
        <div className="flex-1">
          <div className="font-semibold leading-tight">Senim Consulting</div>
          <div className="text-xs text-green-100">
            {loading ? "печатает…" : "онлайн"}
          </div>
        </div>
        <a
          href="/admin"
          className="rounded bg-white/15 px-3 py-1 text-xs font-medium hover:bg-white/25"
        >
          Админка
        </a>
      </header>

      {/* Messages area */}
      <div className="chat-bg flex-1 space-y-2 overflow-y-auto px-3 py-4 sm:px-6">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${
              m.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm shadow-sm ${
                m.role === "user"
                  ? "rounded-br-none bg-[#dcf8c6] text-gray-900"
                  : "rounded-bl-none bg-white text-gray-900"
              }`}
            >
              <span>{m.content}</span>
              <span className="ml-2 inline-block align-bottom text-[10px] text-gray-500">
                {m.time}
              </span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-lg rounded-bl-none bg-white px-3 py-2 text-sm text-gray-500 shadow-sm">
              <span className="typing-dots" aria-hidden>
                <span />
                <span />
                <span />
              </span>
              <span>Ассистент печатает…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="flex items-center gap-2 bg-[#f0f0f0] px-3 py-3">
        <input
          className="flex-1 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#128c7e]"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Напишите сообщение…"
          disabled={loading}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#128c7e] text-white transition hover:bg-[#075e54] disabled:opacity-50"
          aria-label="Отправить"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
    </main>
  );
}
