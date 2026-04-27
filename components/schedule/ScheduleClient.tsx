"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { GlassCard } from "@/components/ui/GlassCard";
import type { Application } from "@/lib/types";
import type { ResumeVersion } from "@/lib/types";
import { loadApplications, loadMaterials, saveApplications } from "@/lib/storage";
import type { ScheduleEvent, ScheduleEventKind } from "@/lib/schedule";
import { buildScheduleEvents } from "@/lib/schedule";
import { ApplicationForm } from "@/components/dashboard/ApplicationForm";

function startOfWeekMonday(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = x.getDay(); // 0..6 (Sun..Sat)
  const offset = (dow + 6) % 7; // Mon=0, Sun=6
  x.setDate(x.getDate() - offset);
  return x;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function ymdLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function timeHm(d: Date): string {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

const KIND_LABEL: Record<ScheduleEventKind, string> = {
  deadline: "DDL",
  written: "笔试",
  assessment: "测评",
  interview: "面试",
};

const KIND_CLASS: Record<ScheduleEventKind, string> = {
  deadline: "border-amber-300/50 bg-amber-400/15 text-amber-950",
  written: "border-violet-300/50 bg-violet-400/12 text-violet-950",
  assessment: "border-sky-300/50 bg-sky-400/12 text-sky-950",
  interview: "border-emerald-300/50 bg-emerald-400/12 text-emerald-950",
};

export function ScheduleClient() {
  const [apps, setApps] = useState<Application[]>([]);
  const [materials, setMaterials] = useState<ResumeVersion[]>([]);
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeekMonday(new Date()));
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Application | null>(null);

  useEffect(() => {
    setApps(loadApplications());
    setMaterials(loadMaterials());
  }, []);

  const events = useMemo(() => buildScheduleEvents(apps), [apps]);

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const dayBuckets = useMemo(() => {
    const map: Record<string, ScheduleEvent[]> = Object.fromEntries(
      days.map((d) => [ymdLocal(d), [] as ScheduleEvent[]]),
    );
    const startMs = weekStart.getTime();
    const endMs = addDays(weekStart, 7).getTime();
    for (const e of events) {
      const t = e.start.getTime();
      if (t < startMs || t >= endMs) continue;
      const key = ymdLocal(e.start);
      if (!map[key]) map[key] = [];
      map[key].push(e);
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => a.start.getTime() - b.start.getTime());
    }
    return map;
  }, [days, events, weekStart]);

  const jumpWeek = (delta: number) => {
    setWeekStart((prev) => addDays(prev, delta * 7));
  };

  const resetThisWeek = () => setWeekStart(startOfWeekMonday(new Date()));

  return (
    <AppShell title="日程">
      <div className="mx-auto max-w-[1600px] space-y-4 px-1 sm:px-0">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-600">
              Schedule
            </p>
            <h1 className="text-xl font-semibold text-slate-900">日程（周视图）</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-xl border border-white/30 bg-white/10 px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-white/20"
              onClick={() => jumpWeek(-1)}
            >
              上一周
            </button>
            <button
              type="button"
              className="rounded-xl border border-white/30 bg-white/10 px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-white/20"
              onClick={resetThisWeek}
            >
              本周
            </button>
            <button
              type="button"
              className="rounded-xl border border-white/30 bg-white/10 px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-white/20"
              onClick={() => jumpWeek(1)}
            >
              下一周
            </button>
          </div>
        </div>

        <GlassCard className="border-white/30 p-4 shadow-lg">
          <div className="grid gap-3 md:grid-cols-7">
            {days.map((d) => {
              const key = ymdLocal(d);
              const list = dayBuckets[key] ?? [];
              const isToday = key === ymdLocal(new Date());
              return (
                <section key={key} className="min-w-0">
                  <div className="mb-2 flex items-baseline justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {key}
                      </p>
                      <p className="text-[11px] text-slate-600">
                        {["周一", "周二", "周三", "周四", "周五", "周六", "周日"][listDayIndex(d)]}
                        {isToday ? " · 今天" : ""}
                      </p>
                    </div>
                    <span
                      aria-hidden
                      className={`h-2 w-2 shrink-0 rounded-full ${
                        isToday ? "bg-indigo-500" : "bg-slate-300/70"
                      }`}
                    />
                  </div>

                  {list.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/25 bg-white/5 p-3 text-xs text-slate-600">
                      无事件
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {list.map((e) => (
                        <li key={e.id}>
                          <button
                            type="button"
                            className={`w-full rounded-xl border px-3 py-2 text-left text-sm shadow-sm backdrop-blur-md transition hover:shadow-md ${KIND_CLASS[e.kind]}`}
                            onClick={() => {
                              const found = apps.find((a) => a.id === e.applicationId);
                              if (!found) return;
                              setEditing(found);
                              setFormOpen(true);
                            }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="truncate font-semibold">
                                  {e.allDay ? "全天" : timeHm(e.start)} ·{" "}
                                  {KIND_LABEL[e.kind]}
                                </p>
                                <p className="mt-0.5 line-clamp-2 text-xs text-slate-700">
                                  {e.title}
                                </p>
                              </div>
                              <span className="shrink-0 rounded-lg border border-white/30 bg-white/10 px-2 py-0.5 text-[11px] font-medium text-slate-800">
                                {e.stage}
                              </span>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              );
            })}
          </div>
        </GlassCard>
      </div>

      <ApplicationForm
        open={formOpen}
        application={editing}
        materials={materials}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSave={(app) => {
          setApps((prev) => {
            const i = prev.findIndex((a) => a.id === app.id);
            const next = i === -1 ? [...prev, app] : prev.map((a) => (a.id === app.id ? app : a));
            saveApplications(next);
            return next;
          });
          setFormOpen(false);
          setEditing(null);
        }}
        onDelete={(id) => {
          setApps((prev) => {
            const next = prev.filter((a) => a.id !== id);
            saveApplications(next);
            return next;
          });
          setFormOpen(false);
          setEditing(null);
        }}
      />
    </AppShell>
  );
}

function listDayIndex(d: Date): number {
  const dow = d.getDay(); // 0..6
  return (dow + 6) % 7; // Mon=0..Sun=6
}

