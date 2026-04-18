"use client";

import { AiAssistantAvatar } from "./AiAssistantAvatar";

type AiFabProps = {
  onClick: () => void;
};

export function AiFab({ onClick }: AiFabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="animate-soft-float animate-soft-pulse fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full border border-white/35 bg-gradient-to-br from-indigo-500/90 to-sky-500/85 backdrop-blur-md transition hover:scale-[1.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300/80"
      aria-label="打开 AI 助手"
      title="AI 助手"
    >
      <AiAssistantAvatar size={36} className="drop-shadow-sm" />
    </button>
  );
}
