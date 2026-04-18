"use client";

import type { Application } from "@/lib/types";
import {
  buildReminders,
  type ReminderActionType,
  type ReminderItem,
  type ReminderTaskStateMap,
} from "@/lib/reminders";
import { GlassCard } from "@/components/ui/GlassCard";

type ReminderPanelProps = {
  apps: Application[];
  todayYmd: string;
  taskStates: ReminderTaskStateMap;
  onOpenApplication: (id: string) => void;
  onTaskAction: (item: ReminderItem, actionType: ReminderActionType) => void;
  embedded?: boolean;
};

const typeStyles: Record<
  string,
  { dot: string; border: string; bg: string }
> = {
  overdue: {
    dot: "bg-amber-500",
    border: "border-amber-300/45",
    bg: "bg-amber-400/15",
  },
  due_soon: {
    dot: "bg-indigo-500",
    border: "border-indigo-300/45",
    bg: "bg-indigo-400/12",
  },
  follow_up: {
    dot: "bg-emerald-500",
    border: "border-emerald-300/45",
    bg: "bg-emerald-400/12",
  },
};

function actionBtnClass(actionType: ReminderActionType, isPrimary: boolean): string {
  if (isPrimary && actionType === "compose_followup_email") {
    return "border-emerald-400/60 bg-emerald-500/20 text-emerald-900 hover:bg-emerald-500/30";
  }
  if (isPrimary) {
    return "border-indigo-400/60 bg-indigo-500/20 text-indigo-900 hover:bg-indigo-500/30";
  }
  if (actionType === "open_job_url") {
    return "border-sky-300/60 bg-sky-400/20 text-sky-900 hover:bg-sky-400/30";
  }
  if (actionType === "mark_done") {
    return "border-emerald-300/60 bg-emerald-400/20 text-emerald-900 hover:bg-emerald-400/30";
  }
  return "border-amber-300/60 bg-amber-400/20 text-amber-900 hover:bg-amber-400/30";
}

export function ReminderPanel({
  apps,
  todayYmd,
  taskStates,
  onOpenApplication,
  onTaskAction,
  embedded = false,
}: ReminderPanelProps) {
  const items = buildReminders(apps, todayYmd, taskStates);
  const card = (
    <GlassCard className="border-white/30 p-5 shadow-lg">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-900">今日任务与提醒</h2>
        <span className="text-xs text-slate-600">由 DDL 与跟进日自动生成</span>
      </div>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-slate-600">
          暂无提醒。为申请设置截止日期或跟进日即可在此汇总。
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {items.map((item) => {
            const st = typeStyles[item.type];
            return (
              <li key={item.taskKey}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => onOpenApplication(item.applicationId)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onOpenApplication(item.applicationId);
                    }
                  }}
                  className={`flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left shadow-sm backdrop-blur-md transition hover:shadow-md ${st.border} ${st.bg}`}
                >
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${st.dot}`}
                    aria-hidden
                  />
                  <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="block text-sm font-medium text-slate-900">
                        {item.headline}
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-600">
                        {item.subline}
                      </span>
                    </div>
                    <div className="shrink-0">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onTaskAction(item, item.primaryAction.type);
                          }}
                          className={`rounded-lg border px-2 py-1 text-xs font-semibold transition ${actionBtnClass(item.primaryAction.type, true)}`}
                        >
                          {item.primaryAction.label}
                        </button>
                      </div>
                      <div className="mt-2 flex flex-wrap justify-end gap-1.5">
                        {item.secondaryActions.map((action) => (
                          <button
                            key={`${item.taskKey}-${action.type}`}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onTaskAction(item, action.type);
                            }}
                            className={`rounded-lg border px-2 py-1 text-xs font-medium transition ${actionBtnClass(action.type, false)}`}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </GlassCard>
  );

  if (embedded) return card;
  return (
    <section className="mx-auto max-w-[1600px] px-4 pb-6 sm:px-6">{card}</section>
  );
}
