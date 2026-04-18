"use client";

import type { Application, Stage } from "@/lib/types";
import { GlassCard } from "@/components/ui/GlassCard";
import { ApplicationCard } from "./ApplicationCard";

type StageColumnProps = {
  label: string;
  columnClass: string;
  apps: Application[];
  resumeNameById: Record<string, string>;
  onEdit: (id: string) => void;
  onStageChange: (id: string, stage: Stage) => void;
};

export function StageColumn({
  label,
  columnClass,
  apps,
  resumeNameById,
  onEdit,
  onStageChange,
}: StageColumnProps) {
  return (
    <GlassCard
      className={`flex w-72 shrink-0 flex-col overflow-hidden border-white/30 shadow-lg ${columnClass}`}
    >
      <div className="flex items-center justify-between border-b border-white/20 px-3 py-2.5">
        <h3 className="text-sm font-semibold text-slate-900">{label}</h3>
        <span className="rounded-full border border-white/25 bg-white/30 px-2 py-0.5 text-xs font-medium text-slate-600 tabular-nums shadow-sm backdrop-blur-sm">
          {apps.length}
        </span>
      </div>
      <div className="custom-scrollbar flex max-h-[calc(100vh-15rem)] flex-col gap-2 overflow-y-auto p-2.5">
        {apps.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/35 bg-white/20 px-3 py-8 text-center text-xs leading-relaxed text-slate-600 backdrop-blur-sm">
            暂无申请
            <span className="mt-2 block text-[11px]">
              新建申请或调整阶段以移入本列
            </span>
          </p>
        ) : (
          apps.map((a) => (
            <ApplicationCard
              key={a.id}
              app={a}
              resumeName={
                a.resumeVersionId
                  ? (resumeNameById[a.resumeVersionId] ?? "（材料已缺失）")
                  : null
              }
              onEdit={() => onEdit(a.id)}
              onStageChange={(s) => onStageChange(a.id, s)}
            />
          ))
        )}
      </div>
    </GlassCard>
  );
}
