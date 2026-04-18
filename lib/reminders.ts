import type { Application, FollowUpActionType, FollowUpQueueItem } from "./types";

export type ReminderType = "overdue" | "due_soon" | "follow_up";
export type ReminderActionType =
  | "continue_application"
  | "compose_followup_email"
  | "open_job_url"
  | "mark_done"
  | "snooze_2h"
  | "snooze_tomorrow";

export type ReminderTaskStatus = "done" | "snoozed";

export interface ReminderTaskState {
  status: ReminderTaskStatus;
  snoozedUntil: string | null;
  updatedAt: string;
}

export type ReminderTaskStateMap = Record<string, ReminderTaskState>;

export interface ReminderAction {
  type: ReminderActionType;
  label: string;
}

export interface ReminderItem {
  type: ReminderType;
  applicationId: string;
  company: string;
  position: string;
  taskKey: string;
  headline: string;
  subline: string;
  primaryAction: ReminderAction;
  secondaryActions: ReminderAction[];
  actionPayload: {
    jobUrl: string | null;
    followUpActionType?: FollowUpActionType;
  };
}

/** `referenceDate`: YYYY-MM-DD，按本地日历日比较 */
export function buildReminders(
  apps: Application[],
  referenceDate: string,
  taskStates: ReminderTaskStateMap = {},
  now: Date = new Date(),
): ReminderItem[] {
  const items: ReminderItem[] = [];
  const ref = parseYmd(referenceDate);
  const followUpAppIds = new Set<string>();
  const nowMs = now.getTime();

  for (const app of apps) {
    if (app.followUpDate) {
      const fu = parseYmd(app.followUpDate);
      if (sameDay(fu, ref)) {
        const taskKey = `followup_date:${app.id}:${app.followUpDate}`;
        const item: ReminderItem = {
          type: "follow_up",
          applicationId: app.id,
          company: app.company,
          position: app.position,
          taskKey,
          headline: "今日跟进",
          subline: `${app.company} · ${app.position}`,
          primaryAction: {
            type: "compose_followup_email",
            label: "一键生成草稿",
          },
          secondaryActions: buildSecondaryActions(app),
          actionPayload: {
            jobUrl: app.jobUrl,
            followUpActionType: recommendedActionByStage(app.stage) ?? undefined,
          },
        };
        if (shouldIncludeTask(taskStates[taskKey], nowMs)) {
          items.push(item);
        }
        followUpAppIds.add(app.id);
      }
    }

    if (app.deadline) {
      const d = parseYmd(app.deadline);
      if (d.getTime() <= ref.getTime()) {
        const taskKey = `deadline_overdue:${app.id}:${app.deadline}`;
        const item: ReminderItem = {
          type: "overdue",
          applicationId: app.id,
          company: app.company,
          position: app.position,
          taskKey,
          headline: "DDL 已到期",
          subline: `${app.company} · ${app.position} · ${app.deadline}`,
          primaryAction: {
            type: "continue_application",
            label: primaryActionLabelByStage(app.stage),
          },
          secondaryActions: buildSecondaryActions(app),
          actionPayload: { jobUrl: app.jobUrl },
        };
        if (shouldIncludeTask(taskStates[taskKey], nowMs)) {
          items.push(item);
        }
      } else if (withinNextSevenDaysAfterRef(d, ref)) {
        const taskKey = `deadline_due_soon:${app.id}:${app.deadline}`;
        const item: ReminderItem = {
          type: "due_soon",
          applicationId: app.id,
          company: app.company,
          position: app.position,
          taskKey,
          headline: "即将到期（7 天内）",
          subline: `${app.company} · ${app.position} · ${app.deadline}`,
          primaryAction: {
            type: "continue_application",
            label: primaryActionLabelByStage(app.stage),
          },
          secondaryActions: buildSecondaryActions(app),
          actionPayload: { jobUrl: app.jobUrl },
        };
        if (shouldIncludeTask(taskStates[taskKey], nowMs)) {
          items.push(item);
        }
      }
    }
  }

  const queue = buildFollowUpQueue(apps, referenceDate);
  for (const q of queue) {
    if (followUpAppIds.has(q.applicationId)) continue;
    const app = apps.find((x) => x.id === q.applicationId);
    if (!app) continue;
    const taskKey = `followup_queue:${q.applicationId}:${referenceDate}`;
    if (!shouldIncludeTask(taskStates[taskKey], nowMs)) continue;
    items.push({
      type: "follow_up",
      applicationId: q.applicationId,
      company: q.company,
      position: q.position,
      taskKey,
      headline: "建议跟进",
      subline: `${q.company} · ${q.position} · ${q.reason}`,
      primaryAction: {
        type: "compose_followup_email",
        label: "一键生成草稿",
      },
      secondaryActions: buildSecondaryActions(app),
      actionPayload: {
        jobUrl: app.jobUrl,
        followUpActionType: q.actionType,
      },
    });
  }

  const order: ReminderType[] = ["overdue", "due_soon", "follow_up"];
  return items.sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type));
}

export function buildFollowUpQueue(
  apps: Application[],
  referenceDate: string,
): FollowUpQueueItem[] {
  const ref = parseYmd(referenceDate);
  const result: FollowUpQueueItem[] = [];

  for (const app of apps) {
    const action = recommendedActionByStage(app.stage);
    if (!action) continue;
    const thresholdDays = action === "followup_status_check" ? 7 : 3;
    const staleDays = staleDaysSinceUpdated(app.updatedAt, ref);
    if (staleDays < thresholdDays) continue;
    const reason =
      action === "followup_status_check"
        ? `已投递后 ${staleDays} 天未更新`
        : `流程阶段 ${staleDays} 天未更新`;
    result.push({
      applicationId: app.id,
      company: app.company,
      position: app.position,
      actionType: action,
      reason,
      ...buildFollowUpDraft(app, action),
    });
  }

  return result;
}

export function buildFollowUpDraft(
  app: Pick<Application, "company" | "position">,
  actionType: FollowUpActionType,
): Pick<FollowUpQueueItem, "suggestedSubject" | "suggestedBody"> {
  const title = `${app.company} - ${app.position}`;
  if (actionType === "followup_status_check") {
    return {
      suggestedSubject: `跟进申请进度｜${title}`,
      suggestedBody:
        `您好，我是申请贵司「${app.position}」岗位的候选人。` +
        `想礼貌跟进一下当前流程进度，如需补充材料或进一步沟通，我可以及时配合。` +
        `感谢您的时间与帮助。`,
    };
  }
  if (actionType === "followup_written_result") {
    return {
      suggestedSubject: `测评结果跟进｜${title}`,
      suggestedBody:
        `您好，我近期已完成「${app.position}」相关测评。` +
        `想确认后续评估结果与流程安排，如需要补充信息我可以尽快提供。` +
        `感谢您的辛苦工作。`,
    };
  }
  return {
    suggestedSubject: `面试后流程跟进｜${title}`,
    suggestedBody:
      `您好，我是参与过「${app.position}」面试的候选人。` +
      `想确认后续流程安排与时间预期，若需要补充项目材料我可及时提供。` +
      `感谢您的安排与反馈。`,
  };
}

export function statsDueSoonCount(
  apps: Application[],
  referenceDate: string,
): number {
  const ref = parseYmd(referenceDate);
  let n = 0;
  for (const app of apps) {
    if (!app.deadline) continue;
    const d = parseYmd(app.deadline);
    if (d.getTime() > ref.getTime() && withinNextSevenDaysAfterRef(d, ref)) {
      n += 1;
    }
  }
  return n;
}

export function statsOverdueCount(
  apps: Application[],
  referenceDate: string,
): number {
  const ref = parseYmd(referenceDate);
  let n = 0;
  for (const app of apps) {
    if (!app.deadline) continue;
    const d = parseYmd(app.deadline);
    if (d.getTime() <= ref.getTime()) n += 1;
  }
  return n;
}

function shouldIncludeTask(state: ReminderTaskState | undefined, nowMs: number): boolean {
  if (!state) return true;
  if (state.status === "done") return false;
  if (!state.snoozedUntil) return true;
  const untilMs = new Date(state.snoozedUntil).getTime();
  if (Number.isNaN(untilMs)) return true;
  return untilMs <= nowMs;
}

function primaryActionLabelByStage(stage: Application["stage"]): string {
  if (stage === "written") return "去笔试";
  if (stage === "todo") return "继续网申";
  return "继续处理";
}

function buildSecondaryActions(app: Application): ReminderAction[] {
  const actions: ReminderAction[] = [];
  if (app.jobUrl) {
    actions.push({ type: "open_job_url", label: "打开职位页" });
  }
  actions.push(
    { type: "snooze_2h", label: "稍后 2 小时" },
    { type: "snooze_tomorrow", label: "明天提醒" },
    { type: "mark_done", label: "标记完成" },
  );
  return actions;
}

function parseYmd(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function recommendedActionByStage(stage: Application["stage"]): FollowUpActionType | null {
  if (stage === "applied") return "followup_status_check";
  if (stage === "written") return "followup_written_result";
  if (stage === "interview") return "followup_interview_next_step";
  return null;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** 从「明天」起算 7 个日历日（含第 7 天） */
function withinNextSevenDaysAfterRef(target: Date, ref: Date): boolean {
  const start = addDays(ref, 1);
  const end = addDays(ref, 7);
  return (
    target.getTime() >= start.getTime() && target.getTime() <= end.getTime()
  );
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function staleDaysSinceUpdated(updatedAt: string, ref: Date): number {
  const dt = new Date(updatedAt);
  if (Number.isNaN(dt.getTime())) return 0;
  const start = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
  const end = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  const diffMs = end.getTime() - start.getTime();
  return Math.floor(diffMs / 86_400_000);
}
