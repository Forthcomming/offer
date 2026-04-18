"use client";

import { useEffect, useMemo, useState } from "react";
import type { Application } from "@/lib/types";
import type {
  ReminderActionType,
  ReminderItem,
  ReminderTaskStateMap,
} from "@/lib/reminders";
import { STAGES } from "@/lib/types";
import { GlassCard } from "@/components/ui/GlassCard";
import { ReminderPanel } from "./ReminderPanel";

/** 与看板列风格一致的图表用色（近似 Tailwind 调色） */
const STAGE_COLOR: Record<string, string> = {
  todo: "#94a3b8",
  applied: "#6366f1",
  written: "#8b5cf6",
  interview: "#0ea5e9",
  offer: "#10b981",
  rejected: "#78716c",
};

type StageDistributionChartsProps = {
  apps: Application[];
  todayYmd: string;
  taskStates: ReminderTaskStateMap;
  onOpenApplication: (id: string) => void;
  onTaskAction: (item: ReminderItem, actionType: ReminderActionType) => void;
};

const CHART_VIEW_STORAGE_KEY = "job-dashboard:stage-chart-view:v1";

export function StageDistributionCharts({
  apps,
  todayYmd,
  taskStates,
  onOpenApplication,
  onTaskAction,
}: StageDistributionChartsProps) {
  const [view, setView] = useState<"donut" | "stacked">("donut");
  const [animated, setAnimated] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);

  useEffect(() => {
    const saved = window.localStorage.getItem(CHART_VIEW_STORAGE_KEY);
    if (saved === "donut" || saved === "stacked") {
      setView(saved);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(CHART_VIEW_STORAGE_KEY, view);
  }, [view]);

  useEffect(() => {
    setAnimated(false);
    const id = window.requestAnimationFrame(() => setAnimated(true));
    return () => window.cancelAnimationFrame(id);
  }, [view, apps]);

  const segments = useMemo(
    () =>
      STAGES.map((s) => ({
        id: s.id,
        label: s.label,
        color: STAGE_COLOR[s.id] ?? "#64748b",
        count: apps.filter((a) => a.stage === s.id).length,
      })),
    [apps],
  );

  const total = segments.reduce((n, s) => n + s.count, 0);
  const active = segments
    .filter((s) => s.count > 0)
    .sort((a, b) => b.count - a.count);
  const motionKey = `${view}-${total}-${active.length}`;
  const activeStage = active[carouselIndex % Math.max(active.length, 1)] ?? null;

  useEffect(() => {
    setCarouselIndex(0);
  }, [active.length, total]);

  useEffect(() => {
    if (active.length <= 1) return;
    const id = window.setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % active.length);
    }, 2600);
    return () => window.clearInterval(id);
  }, [active.length]);

  const conic = useMemo(() => {
    if (total <= 0) return "";
    let acc = 0;
    const stops: string[] = [];
    for (const s of segments) {
      if (s.count === 0) continue;
      const pct = (s.count / total) * 100;
      const start = acc;
      acc += pct;
      stops.push(`${s.color} ${start}% ${acc}%`);
    }
    return stops.join(", ");
  }, [segments, total]);

  return (
    <div className="mt-3 grid items-stretch gap-3 lg:grid-cols-2">
      <GlassCard className="animate-glass-enter flex h-full flex-col border-white/35 bg-white/20 p-4 shadow-[0_12px_36px_rgba(15,23,42,0.12)] backdrop-blur-xl">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-slate-600">投递分布</p>
          <div className="inline-flex rounded-xl border border-white/40 bg-white/35 p-0.5 backdrop-blur-md">
            <button
              type="button"
              className={`rounded-lg px-2.5 py-1 text-[11px] transition ${
                view === "donut"
                  ? "bg-white/80 font-semibold text-slate-800 shadow-sm"
                  : "text-slate-600 hover:bg-white/45"
              }`}
              onClick={() => setView("donut")}
            >
              环形图
            </button>
            <button
              type="button"
              className={`rounded-lg px-2.5 py-1 text-[11px] transition ${
                view === "stacked"
                  ? "bg-white/80 font-semibold text-slate-800 shadow-sm"
                  : "text-slate-600 hover:bg-white/45"
              }`}
              onClick={() => setView("stacked")}
            >
              堆叠图
            </button>
          </div>
        </div>
        {total === 0 ? (
          <p className="mt-6 text-center text-sm text-slate-500">
            暂无申请，添加后可查看各阶段分布
          </p>
        ) : view === "donut" ? (
          <div key={motionKey} className="mt-3 flex flex-1 items-start gap-4">
            <div className="relative mt-1 h-20 w-20 shrink-0">
              <div
                className="animate-chart-sweep absolute inset-0 rounded-full shadow-[inset_0_2px_8px_rgba(15,23,42,0.08)] transition-transform duration-700 ease-out"
                style={{ background: `conic-gradient(${conic})` }}
              />
              <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_28%_20%,rgba(255,255,255,0.75),transparent_42%)]" />
              <div className="animate-chart-shimmer pointer-events-none absolute inset-0 rounded-full" />
              <div className="animate-soft-float absolute inset-[20%] flex items-center justify-center rounded-full border border-white/40 bg-white/85 backdrop-blur-sm">
                <span className="text-lg font-bold tabular-nums text-slate-800">
                  {total}
                </span>
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <ul className="min-w-0 space-y-2">
              {active.map((s, idx) => (
                <li
                  key={s.id}
                  className={`animate-glass-enter flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-1.5 text-xs backdrop-blur-sm transition ${
                    idx === carouselIndex % Math.max(active.length, 1)
                      ? "border-white/60 bg-white/70 shadow-sm"
                      : "border-white/30 bg-white/30"
                  }`}
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <span className="flex min-w-0 items-center gap-1.5 text-slate-700">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="truncate">{s.label}</span>
                  </span>
                  <span className="shrink-0 tabular-nums font-semibold text-slate-900">
                    {s.count}
                  </span>
                </li>
              ))}
              </ul>
              {activeStage ? (
                <div className="mt-2 w-full rounded-xl border border-white/50 bg-white/55 px-3 py-2 text-xs text-slate-700 shadow-sm backdrop-blur-sm">
                  <p className="font-semibold text-slate-900">阶段详情</p>
                  <p className="mt-1">
                    当前关注：{activeStage.label}（{activeStage.count}，占比{" "}
                    {Math.round((activeStage.count / total) * 100)}%）
                  </p>
                  <p className="mt-1 text-slate-600">
                    示例岗位：
                    {apps
                      .filter((a) => a.stage === activeStage.id)
                      .slice(0, 3)
                      .map((a) => `${a.company}·${a.position}`)
                      .join("、") || "暂无"}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <div key={motionKey} className="mt-4 flex-1">
            <div className="animate-chart-shimmer h-4 overflow-hidden rounded-full border border-white/40 bg-white/35 shadow-[inset_0_1px_3px_rgba(255,255,255,0.5)]">
              <div className="flex h-full w-full">
                {segments.map((s, idx) => {
                  const pct = total > 0 ? (s.count / total) * 100 : 0;
                  if (pct <= 0) return null;
                  return (
                    <div
                      key={s.id}
                      className="bar-spring"
                      style={{
                        width: animated ? `${pct}%` : "0%",
                        opacity: 0.92,
                        backgroundColor: s.color,
                        transitionDelay: `${idx * 45}ms`,
                      }}
                      title={`${s.label}: ${s.count}`}
                    />
                  );
                })}
              </div>
            </div>
            <ul className="mt-3 min-w-0 grid grid-cols-1 gap-2">
              {active.map((s, idx) => (
                <li
                  key={s.id}
                  className={`animate-glass-enter animate-chart-shimmer flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-1.5 text-xs backdrop-blur-sm transition ${
                    idx === carouselIndex % Math.max(active.length, 1)
                      ? "border-white/60 bg-white/70 shadow-sm"
                      : "border-white/35 bg-white/30"
                  }`}
                  style={{ animationDelay: `${idx * 45}ms` }}
                >
                  <span className="flex min-w-0 items-center gap-1.5 text-slate-700">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="truncate">{s.label}</span>
                  </span>
                  <span className="shrink-0 tabular-nums text-slate-800">
                    {s.count} · {Math.round((s.count / total) * 100)}%
                  </span>
                </li>
              ))}
            </ul>
            {activeStage ? (
              <div className="mt-2 rounded-xl border border-white/50 bg-white/55 px-3 py-2 text-xs text-slate-700 shadow-sm backdrop-blur-sm">
                <p className="font-semibold text-slate-900">阶段详情</p>
                <p className="mt-1">
                  当前关注：{activeStage.label}（{activeStage.count}，占比{" "}
                  {Math.round((activeStage.count / total) * 100)}%）
                </p>
                <p className="mt-1 truncate text-slate-600">
                  示例岗位：
                  {apps
                    .filter((a) => a.stage === activeStage.id)
                    .slice(0, 2)
                    .map((a) => `${a.company}·${a.position}`)
                    .join("、") || "暂无"}
                </p>
              </div>
            ) : null}
          </div>
        )}
      </GlassCard>

      <ReminderPanel
        embedded
        apps={apps}
        todayYmd={todayYmd}
        taskStates={taskStates}
        onOpenApplication={onOpenApplication}
        onTaskAction={onTaskAction}
      />
    </div>
  );
}
