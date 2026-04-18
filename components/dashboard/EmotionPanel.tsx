import type { Application } from "@/lib/types";
import { GlassCard } from "@/components/ui/GlassCard";

type EmotionPanelProps = {
  apps: Application[];
  todayYmd: string;
};

function formatYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function messageByProgress(count: number): string {
  if (count === 0) return "今天先完成一个小动作，进度就会开始滚动。";
  if (count <= 2) return "你在稳步推进，保持这个节奏就很好。";
  return "今天推进很扎实，继续保持这股状态。";
}

function toneByProgress(count: number): { ring: string; badge: string } {
  if (count === 0) {
    return {
      ring: "border-fuchsia-300/60",
      badge: "bg-fuchsia-500/20 text-fuchsia-800",
    };
  }
  if (count <= 2) {
    return {
      ring: "border-violet-300/65",
      badge: "bg-violet-500/20 text-violet-800",
    };
  }
  return {
    ring: "border-emerald-300/70",
    badge: "bg-emerald-500/20 text-emerald-900",
  };
}

export function EmotionPanel({ apps, todayYmd }: EmotionPanelProps) {
  const progressCount = apps.filter((app) => {
    const date = new Date(app.updatedAt);
    if (Number.isNaN(date.getTime())) return false;
    return formatYmd(date) === todayYmd;
  }).length;
  const tone = toneByProgress(progressCount);

  return (
    <GlassCard
      className={`relative overflow-hidden border p-4 shadow-lg ${tone.ring} bg-gradient-to-br from-fuchsia-200/35 via-violet-200/30 to-sky-200/20`}
    >
      <div className="pointer-events-none absolute -right-5 -top-5 h-20 w-20 rounded-full bg-white/25 blur-xl" />
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold tracking-wide text-slate-700">情绪模块</p>
        <span
          className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${tone.badge}`}
          aria-hidden
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 3l1.9 4.7L19 9.6l-3.7 3.1L16.5 18 12 15.2 7.5 18l1.2-5.3L5 9.6l5.1-1.9z" />
          </svg>
        </span>
      </div>
      <p className="mt-1 text-sm font-semibold text-slate-900">
        今日已推进 {progressCount} 条申请
      </p>
      <p className="mt-2 text-xs leading-5 text-slate-700">
        {messageByProgress(progressCount)}
      </p>
    </GlassCard>
  );
}
