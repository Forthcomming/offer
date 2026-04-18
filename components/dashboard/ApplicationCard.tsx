"use client";

import type { Application, Stage } from "@/lib/types";
import { STAGES } from "@/lib/types";
import { GlassCard } from "@/components/ui/GlassCard";

type ApplicationCardProps = {
  app: Application;
  resumeName: string | null;
  onEdit: () => void;
  onStageChange: (stage: Stage) => void;
};

export function ApplicationCard({
  app,
  resumeName,
  onEdit,
  onStageChange,
}: ApplicationCardProps) {
  const updated = new Date(app.updatedAt).toLocaleString("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <GlassCard className="border-white/30 bg-white/20 p-3 shadow-md transition hover:bg-white/30 hover:shadow-lg">
      <button type="button" onClick={onEdit} className="w-full text-left">
        <h4 className="text-sm font-semibold leading-snug text-slate-900">
          {app.company}
        </h4>
        <p className="mt-0.5 text-xs text-slate-600">{app.position}</p>
      </button>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className="rounded-md border border-white/25 bg-white/25 px-2 py-0.5 text-[11px] font-medium text-slate-800 backdrop-blur-sm">
          {app.channel}
        </span>
        {resumeName ? (
          <span className="rounded-md border border-indigo-200/50 bg-indigo-500/15 px-2 py-0.5 text-[11px] font-medium text-indigo-950">
            简历 · {resumeName}
          </span>
        ) : null}
        {app.deadline ? (
          <span className="rounded-md border border-white/25 bg-sky-500/15 px-2 py-0.5 text-[11px] font-medium text-sky-950">
            DDL {app.deadline}
          </span>
        ) : null}
        {app.jobUrl ? (
          <a
            href={app.jobUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-white/30 bg-white/20 px-2 py-0.5 text-[11px] font-medium text-indigo-700 backdrop-blur-sm hover:bg-white/35"
            onClick={(e) => e.stopPropagation()}
          >
            链接
          </a>
        ) : null}
      </div>
      <label className="mt-2 flex items-center gap-2 text-[11px] text-slate-600">
        <span className="shrink-0">阶段</span>
        <select
          value={app.stage}
          onChange={(e) => onStageChange(e.target.value as Stage)}
          className="glass-select w-full py-1 text-xs font-medium"
        >
          {STAGES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
      <p className="mt-2 text-[10px] text-slate-500">更新 {updated}</p>
    </GlassCard>
  );
}
