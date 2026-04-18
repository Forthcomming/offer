"use client";

import type { Application } from "@/lib/types";
import type {
  ReminderActionType,
  ReminderItem,
  ReminderTaskStateMap,
} from "@/lib/reminders";
import {
  statsDueSoonCount,
  statsOverdueCount,
} from "@/lib/reminders";
import { GlassCard } from "@/components/ui/GlassCard";
import { EmotionPanel } from "./EmotionPanel";
import { StageDistributionCharts } from "./StageDistributionCharts";

type StatsBarProps = {
  apps: Application[];
  todayYmd: string;
  taskStates: ReminderTaskStateMap;
  onOpenApplication: (id: string) => void;
  onTaskAction: (item: ReminderItem, actionType: ReminderActionType) => void;
};

export function StatsBar({
  apps,
  todayYmd,
  taskStates,
  onOpenApplication,
  onTaskAction,
}: StatsBarProps) {
  const dueSoon = statsDueSoonCount(apps, todayYmd);
  const overdue = statsOverdueCount(apps, todayYmd);

  return (
    <section className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <GlassCard className="border-white/30 p-4 shadow-lg">
          <p className="text-xs font-medium text-slate-600">今日日期</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{todayYmd}</p>
        </GlassCard>
        <GlassCard className="border-amber-200/40 bg-amber-400/15 p-4 shadow-lg">
          <p className="text-xs font-medium text-amber-950/80">DDL 已到期</p>
          <p className="mt-1 text-lg font-semibold text-amber-950">{overdue}</p>
        </GlassCard>
        <GlassCard className="border-indigo-200/45 bg-indigo-400/12 p-4 shadow-lg">
          <p className="text-xs font-medium text-indigo-950/80">7 天内将到期</p>
          <p className="mt-1 text-lg font-semibold text-indigo-950">{dueSoon}</p>
        </GlassCard>
        <GlassCard className="border-white/30 p-4 shadow-lg">
          <p className="text-xs font-medium text-slate-600">总申请数</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{apps.length}</p>
        </GlassCard>
        <EmotionPanel apps={apps} todayYmd={todayYmd} />
      </div>
      <StageDistributionCharts
        apps={apps}
        todayYmd={todayYmd}
        taskStates={taskStates}
        onOpenApplication={onOpenApplication}
        onTaskAction={onTaskAction}
      />
    </section>
  );
}
