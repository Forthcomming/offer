import type { Application, Stage } from "./types";

export type ScheduleEventKind = "deadline" | "written" | "assessment" | "interview";

export type ScheduleEvent = {
  id: string;
  applicationId: string;
  kind: ScheduleEventKind;
  title: string;
  start: Date;
  allDay: boolean;
  stage: Stage;
};

export function buildScheduleEvents(apps: Application[]): ScheduleEvent[] {
  const events: ScheduleEvent[] = [];

  for (const app of apps) {
    if (app.stage === "offer" || app.stage === "rejected") continue;

    if (app.deadline) {
      const start = parseYmdAsLocalDateStart(app.deadline);
      if (start) {
        const raw = app.deadline;
        events.push({
          id: `deadline:${app.id}:${raw}`,
          applicationId: app.id,
          kind: "deadline",
          title: `${app.company} · ${app.position}`,
          start,
          allDay: true,
          stage: app.stage,
        });
      }
    }

    addDateTimeEvent(events, app, "written", app.writtenAt ?? null);
    addDateTimeEvent(events, app, "assessment", app.assessmentAt ?? null);
    addDateTimeEvent(events, app, "interview", app.interviewAt ?? null);
  }

  return events.sort((a, b) => a.start.getTime() - b.start.getTime());
}

function addDateTimeEvent(
  out: ScheduleEvent[],
  app: Application,
  kind: Exclude<ScheduleEventKind, "deadline">,
  raw: string | null,
) {
  if (!raw) return;
  const start = parseDateTimeLocal(raw);
  if (!start) return;
  out.push({
    id: `${kind}:${app.id}:${raw}`,
    applicationId: app.id,
    kind,
    title: `${app.company} · ${app.position}`,
    start,
    allDay: false,
    stage: app.stage,
  });
}

function parseYmdAsLocalDateStart(ymd: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(y, mo - 1, d, 0, 0, 0, 0);
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

/** `datetime-local` 格式：YYYY-MM-DDTHH:mm（按本地时间解析） */
function parseDateTimeLocal(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(s);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const hh = Number(m[4]);
  const mm = Number(m[5]);
  const dt = new Date(y, mo - 1, d, hh, mm, 0, 0);
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

