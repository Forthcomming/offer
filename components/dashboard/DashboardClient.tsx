"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AiDialog } from "@/components/ai/AiDialog";
import { AiFab } from "@/components/ai/AiFab";
import type {
  Application,
  EmailDraft,
  FollowUpActionType,
  ResumeVersion,
  Stage,
} from "@/lib/types";
import { formatTodayYmd } from "@/lib/date";
import { APPLICATION_PREFILL_SESSION_KEY } from "@/lib/email/prefill";
import {
  loadApplications,
  loadEmailDrafts,
  loadMaterials,
  loadReminderTaskStateMap,
  saveApplications,
  saveEmailDrafts,
  saveReminderTaskStateMap,
} from "@/lib/storage";
import { NewsPanel } from "@/components/news/NewsPanel";
import { AppShell } from "@/components/layout/AppShell";
import {
  buildFollowUpDraft,
  buildFollowUpQueue,
  type ReminderActionType,
  type ReminderItem,
  type ReminderTaskStateMap,
} from "@/lib/reminders";
import { ApplicationForm } from "./ApplicationForm";
import { HeaderBar } from "./HeaderBar";
import { KanbanBoard } from "./KanbanBoard";
import { StatsBar } from "./StatsBar";

function formatYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function shiftYmd(baseYmd: string, days: number): string {
  const [y, m, d] = baseYmd.split("-").map(Number);
  const x = new Date(y, m - 1, d);
  x.setDate(x.getDate() + days);
  return formatYmd(x);
}

function buildDemoApplications(todayYmd: string): Application[] {
  const now = new Date().toISOString();
  return [
    {
      id: "demo-todo-1",
      company: "字节跳动",
      position: "前端开发实习生",
      channel: "官网",
      stage: "todo",
      deadline: shiftYmd(todayYmd, 3),
      followUpDate: null,
      notes: "目标部门：基础架构方向",
      jobUrl: "https://jobs.bytedance.com/",
      resumeVersionId: null,
      updatedAt: now,
    },
    {
      id: "demo-applied-1",
      company: "腾讯",
      position: "客户端开发实习生",
      channel: "内推",
      stage: "applied",
      deadline: shiftYmd(todayYmd, -1),
      followUpDate: todayYmd,
      notes: "已投递，今日需跟进内推人",
      jobUrl: "https://careers.tencent.com/",
      resumeVersionId: null,
      updatedAt: now,
    },
    {
      id: "demo-written-1",
      company: "阿里巴巴",
      position: "后端开发实习生",
      channel: "邮箱",
      stage: "written",
      deadline: shiftYmd(todayYmd, 6),
      followUpDate: null,
      notes: "已收到在线笔试通知",
      jobUrl: "https://talent.alibaba.com/",
      resumeVersionId: null,
      updatedAt: now,
    },
    {
      id: "demo-interview-1",
      company: "美团",
      position: "数据开发实习生",
      channel: "官网",
      stage: "interview",
      deadline: null,
      followUpDate: shiftYmd(todayYmd, 2),
      notes: "一面通过，等待二面安排",
      jobUrl: "https://zhaopin.meituan.com/",
      resumeVersionId: null,
      updatedAt: now,
    },
    {
      id: "demo-offer-1",
      company: "小米",
      position: "算法工程实习生",
      channel: "官网",
      stage: "offer",
      deadline: null,
      followUpDate: null,
      notes: "Offer 待确认",
      jobUrl: "https://hr.xiaomi.com/",
      resumeVersionId: null,
      updatedAt: now,
    },
    {
      id: "demo-rejected-1",
      company: "哔哩哔哩",
      position: "测试开发实习生",
      channel: "邮箱",
      stage: "rejected",
      deadline: null,
      followUpDate: null,
      notes: "流程结束，保留记录用于复盘",
      jobUrl: "https://jobs.bilibili.com/",
      resumeVersionId: null,
      updatedAt: now,
    },
  ];
}

export function DashboardClient() {
  const router = useRouter();
  const [apps, setApps] = useState<Application[]>([]);
  const [materials, setMaterials] = useState<ResumeVersion[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [todayYmd, setTodayYmd] = useState(() => formatTodayYmd());
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Application | null>(null);
  const [createPrefill, setCreatePrefill] = useState<Partial<Application> | null>(
    null,
  );
  const [aiOpen, setAiOpen] = useState(false);
  const [taskStates, setTaskStates] = useState<ReminderTaskStateMap>({});

  useEffect(() => {
    const loadedApps = loadApplications();
    setApps(
      loadedApps.length > 0 ? loadedApps : buildDemoApplications(formatTodayYmd()),
    );
    setMaterials(loadMaterials());
    setTaskStates(loadReminderTaskStateMap());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveApplications(apps);
  }, [apps, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    saveReminderTaskStateMap(taskStates);
  }, [taskStates, hydrated]);

  useEffect(() => {
    const id = window.setInterval(() => setTodayYmd(formatTodayYmd()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const onFocus = () => setMaterials(loadMaterials());
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      const raw = sessionStorage.getItem(APPLICATION_PREFILL_SESSION_KEY);
      if (!raw) return;
      sessionStorage.removeItem(APPLICATION_PREFILL_SESSION_KEY);
      const p = JSON.parse(raw) as Partial<Application>;
      setCreatePrefill(p);
      setEditing(null);
      setFormOpen(true);
    } catch {
      sessionStorage.removeItem(APPLICATION_PREFILL_SESSION_KEY);
    }
  }, [hydrated]);

  const resumeNameById = useMemo(
    () => Object.fromEntries(materials.map((m) => [m.id, m.name])),
    [materials],
  );

  const openCreate = () => {
    setCreatePrefill(null);
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (id: string) => {
    setCreatePrefill(null);
    const found = apps.find((a) => a.id === id);
    if (found) {
      setEditing(found);
      setFormOpen(true);
    }
  };

  const handleSave = (app: Application) => {
    setApps((prev) => {
      const i = prev.findIndex((a) => a.id === app.id);
      if (i === -1) return [...prev, app];
      const next = [...prev];
      next[i] = app;
      return next;
    });
    setFormOpen(false);
    setEditing(null);
  };

  const handleDelete = (id: string) => {
    setApps((prev) => prev.filter((a) => a.id !== id));
    setFormOpen(false);
    setEditing(null);
  };

  const handleStageChange = (id: string, stage: Stage) => {
    setApps((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, stage, updatedAt: new Date().toISOString() }
          : a,
      ),
    );
  };

  const handleGenerateFollowUpDraft = (id: string) => {
    const target = apps.find((a) => a.id === id);
    if (!target) return;
    const queue = buildFollowUpQueue([target], todayYmd);
    const item = queue[0];
    let actionType: FollowUpActionType;
    let subject: string;
    let body: string;

    if (item) {
      actionType = item.actionType;
      subject = item.suggestedSubject;
      body = item.suggestedBody;
    } else {
      if (target.stage === "applied") actionType = "followup_status_check";
      else if (target.stage === "written") actionType = "followup_written_result";
      else if (target.stage === "interview")
        actionType = "followup_interview_next_step";
      else {
        window.alert("当前岗位阶段不支持生成跟进草稿。");
        return;
      }
      const draftSeed = buildFollowUpDraft(target, actionType);
      subject = draftSeed.suggestedSubject;
      body = draftSeed.suggestedBody;
    }

    const now = new Date().toISOString();
    const draft: EmailDraft = {
      id: crypto.randomUUID(),
      applicationId: target.id,
      company: target.company,
      position: target.position,
      actionType,
      toEmail: "",
      subject,
      body,
      status: "draft",
      sentAt: null,
      createdAt: now,
      updatedAt: now,
    };
    const drafts = loadEmailDrafts();
    saveEmailDrafts([draft, ...drafts]);
    router.push("/email");
  };

  const upsertTaskState = (
    taskKey: string,
    status: "done" | "snoozed",
    snoozedUntil: string | null,
  ) => {
    setTaskStates((prev) => ({
      ...prev,
      [taskKey]: {
        status,
        snoozedUntil,
        updatedAt: new Date().toISOString(),
      },
    }));
  };

  const tomorrowMorningNineIso = (): string => {
    const x = new Date();
    x.setDate(x.getDate() + 1);
    x.setHours(9, 0, 0, 0);
    return x.toISOString();
  };

  const handleTaskAction = (
    item: ReminderItem,
    actionType: ReminderActionType,
  ) => {
    if (actionType === "continue_application") {
      openEdit(item.applicationId);
      return;
    }
    if (actionType === "compose_followup_email") {
      handleGenerateFollowUpDraft(item.applicationId);
      return;
    }
    if (actionType === "open_job_url") {
      if (item.actionPayload.jobUrl) {
        window.open(item.actionPayload.jobUrl, "_blank", "noopener,noreferrer");
      }
      return;
    }
    if (actionType === "mark_done") {
      upsertTaskState(item.taskKey, "done", null);
      return;
    }
    if (actionType === "snooze_2h") {
      const twoHoursLater = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
      upsertTaskState(item.taskKey, "snoozed", twoHoursLater);
      return;
    }
    if (actionType === "snooze_tomorrow") {
      upsertTaskState(item.taskKey, "snoozed", tomorrowMorningNineIso());
    }
  };

  return (
    <AppShell title="看板">
      <div className="space-y-4">
        <HeaderBar onNew={openCreate} />
        <StatsBar
          apps={apps}
          todayYmd={todayYmd}
          taskStates={taskStates}
          onOpenApplication={openEdit}
          onTaskAction={handleTaskAction}
        />
        {apps.length === 0 ? (
          <div className="mx-auto max-w-[1600px] px-4 pb-4 sm:px-6">
            <div className="rounded-2xl border border-dashed border-white/35 bg-[var(--glass-bg)] px-5 py-6 text-center shadow-[var(--glass-shadow)] backdrop-blur-2xl">
              <p className="text-sm font-medium text-slate-900">
                还没有申请记录
              </p>
              <p className="mt-1 text-xs text-slate-600">
                点击「添加申请」开始；可在「材料中心」先维护简历版本。
              </p>
              <button
                type="button"
                onClick={openCreate}
                className="mt-4 inline-flex rounded-xl border border-white/30 bg-indigo-500/80 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-600/90"
              >
                添加第一个申请
              </button>
            </div>
          </div>
        ) : null}
        <KanbanBoard
          apps={apps}
          resumeNameById={resumeNameById}
          onEdit={openEdit}
          onStageChange={handleStageChange}
        />
        <NewsPanel />
      </div>

      <ApplicationForm
        open={formOpen}
        application={editing}
        createPrefill={editing ? null : createPrefill}
        materials={materials}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
          setCreatePrefill(null);
        }}
        onSave={handleSave}
        onDelete={handleDelete}
      />
      <AiFab onClick={() => setAiOpen(true)} />
      <AiDialog open={aiOpen} onClose={() => setAiOpen(false)} />
    </AppShell>
  );
}
