"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Sparkles, Copy, Check, ArrowLeft } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: { title: string; author: string; category: string; date: string; slug: string; type: string; relevance: number }[];
  createdAt: string;
}

export default function AssistantContent() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const suggestedQuestions: string[] = t("assistant.suggested_questions", { returnObjects: true }) as string[];

  const copyToClipboard = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {}
  }, []);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text.trim(),
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim(), conversationId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.answer,
        sources: data.sources,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setConversationId(data.conversationId);
    } catch (error) {
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: t("assistant.error_message"),
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-navy-950 via-[#061224] to-navy-950">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(8,145,178,0.06)_0%,transparent_50%)]" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24 relative z-10">
        {/* Back link */}
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-teal-400 transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          {t("assistant.back_home")}
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/10 border border-teal-400/20 mb-4">
            <Sparkles className="w-4 h-4 text-teal-400" />
            <span className="text-xs font-medium text-teal-400">{t("assistant.ai_powered")}</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3">{t("assistant.title")}</h1>
          <p className="text-slate-400 max-w-xl mx-auto">{t("assistant.subtitle")}</p>
        </div>

        {/* Chat Area */}
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
          <div className="h-[500px] overflow-y-auto p-6 space-y-4" id="chat-container">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-teal-500/10 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-teal-400" />
                </div>
                <p className="text-slate-400 mb-6">{t("assistant.no_conversation")}</p>
                <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
                  {suggestedQuestions.map((q: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(q)}
                      className="px-4 py-2 text-sm text-slate-300 bg-white/5 border border-white/10 rounded-full hover:bg-teal-500/10 hover:border-teal-400/20 hover:text-teal-400 transition-all"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                  msg.role === "user"
                    ? "bg-teal-500/20 border border-teal-400/20 text-white"
                    : "bg-white/5 border border-white/10 text-slate-300"
                }`}>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</div>

                  {msg.role === "assistant" && (
                    <button
                      onClick={() => copyToClipboard(msg.content, msg.id)}
                      className="mt-2 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-teal-400 transition-colors"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3" />
                          {t("assistant.copied")}
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          {t("assistant.copy")}
                        </>
                      )}
                    </button>
                  )}

                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-white/10">
                      <p className="text-xs font-semibold text-slate-400 mb-2">{t("assistant.sources")}:</p>
                      <div className="space-y-1.5">
                        {msg.sources.map((src, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="text-[10px] text-teal-400 mt-0.5">{i + 1}.</span>
                            <div className="text-xs text-slate-500">
                              <span className="text-slate-400">{src.title}</span>
                              {src.author && <span> — {src.author}</span>}
                              {src.date && <span> ({src.date})</span>}
                              {src.slug && (
                                <Link href={`/library/${src.slug}`} className="text-teal-400 hover:underline ml-1" target="_blank">
                                  [{t("common.view")}]
                                </Link>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    {t("assistant.thinking")}
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-white/10 p-4">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t("assistant.placeholder")}
                rows={1}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400/30 resize-none"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-5 py-3 bg-teal-500 hover:bg-teal-400 disabled:opacity-30 disabled:hover:bg-teal-500 text-white rounded-xl text-sm font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </form>
            <p className="text-[10px] text-slate-600 mt-2 text-center">
              {t("assistant.disclaimer")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
