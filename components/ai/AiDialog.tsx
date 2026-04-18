"use client";

import { useEffect, useRef, useState } from "react";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { cn } from "@/lib/cn";
import type { AiQuickAction } from "@/lib/ai/stub";
import { stubReply, stubReplyFreeform } from "@/lib/ai/stub";
import { AiAssistantAvatar } from "./AiAssistantAvatar";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type AiDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function AiDialog({ open, onClose }: AiDialogProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content:
          "你好！我是求职助手（占位版）。可先选快捷场景，或直接输入问题。真实模型接入前，回复为固定模版。",
      },
    ]);
    setInput("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, open]);

  if (!open) return null;

  const pushAssistant = (content: string) => {
    setMessages((m) => [
      ...m,
      { id: crypto.randomUUID(), role: "assistant", content },
    ]);
  };

  const pushUser = (content: string) => {
    setMessages((m) => [...m, { id: crypto.randomUUID(), role: "user", content }]);
  };

  const onQuick = (action: AiQuickAction, label: string) => {
    pushUser(`【快捷】${label}`);
    pushAssistant(stubReply(action, input));
  };

  const onSend = (e: React.FormEvent) => {
    e.preventDefault();
    const t = input.trim();
    if (!t) return;
    pushUser(t);
    pushAssistant(stubReplyFreeform(t));
    setInput("");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 sm:items-center sm:p-6"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <GlassCard
        className="animate-appear-scale flex max-h-[min(640px,92vh)] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border-white/30 sm:rounded-3xl"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-dialog-title"
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/20 px-4 py-3">
          <div className="flex items-start gap-3">
            <AiAssistantAvatar
              size={44}
              className="animate-soft-float mt-0.5 drop-shadow-sm"
            />
            <div>
              <h2
                id="ai-dialog-title"
                className="text-base font-semibold text-slate-900"
              >
                AI 求职助手
              </h2>
              <p className="text-xs text-slate-600">占位版 · 流程可演示</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-600 transition hover:bg-white/25 hover:text-slate-900"
            aria-label="关闭"
          >
            <span className="text-lg leading-none">×</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-white/15 px-4 py-2">
          <GlassButton
            type="button"
            variant="secondary"
            className="!py-1.5 !text-xs"
            onClick={() => onQuick("jd_resume", "根据 JD 优化简历")}
          >
            JD 优化简历
          </GlassButton>
          <GlassButton
            type="button"
            variant="secondary"
            className="!py-1.5 !text-xs"
            onClick={() => onQuick("email", "生成跟进邮件")}
          >
            跟进邮件
          </GlassButton>
          <GlassButton
            type="button"
            variant="secondary"
            className="!py-1.5 !text-xs"
            onClick={() => onQuick("interview", "模拟面试")}
          >
            模拟面试
          </GlassButton>
        </div>

        <div
          ref={listRef}
          className="custom-scrollbar flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-3"
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "animate-appear-up flex max-w-[92%] gap-2",
                msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto",
              )}
            >
              {msg.role === "assistant" ? (
                <AiAssistantAvatar size={30} className="mt-1 shrink-0" />
              ) : (
                <span className="w-[30px] shrink-0" aria-hidden />
              )}
              <div
                className={cn(
                  "min-w-0 flex-1 rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm",
                  msg.role === "user"
                    ? "border border-white/25 bg-indigo-500/25 text-slate-900"
                    : "border border-white/25 bg-white/30 text-slate-800",
                )}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
        </div>

        <form
          onSubmit={onSend}
          className="flex gap-2 border-t border-white/20 p-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="glass-field min-w-0 flex-1"
            placeholder="输入问题…"
 aria-label="输入消息"
          />
          <GlassButton type="submit" variant="primary" className="shrink-0">
            发送
          </GlassButton>
        </form>
      </GlassCard>
    </div>
  );
}
