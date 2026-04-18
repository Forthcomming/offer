import { describe, expect, it } from "vitest";
import type { Application } from "./types";
import {
  buildFollowUpDraft,
  buildFollowUpQueue,
  buildReminders,
  statsDueSoonCount,
  statsOverdueCount,
} from "./reminders";

function app(partial: Partial<Application> & Pick<Application, "id">): Application {
  return {
    company: "Co",
    position: "Dev",
    channel: "官网",
    stage: "todo",
    deadline: null,
    followUpDate: null,
    notes: "",
    jobUrl: null,
    resumeVersionId: null,
    updatedAt: "2026-04-01T00:00:00.000Z",
    ...partial,
  };
}

describe("buildReminders", () => {
  it("flags overdue when deadline is today or before", () => {
    const apps = [
      app({ id: "1", company: "A", deadline: "2026-04-17" }),
      app({ id: "2", company: "B", deadline: "2026-04-18" }),
    ];
    const r = buildReminders(apps, "2026-04-18");
    const overdue = r.filter((x) => x.type === "overdue");
    expect(overdue).toHaveLength(2);
  });

  it("flags due soon within 7 days after reference (not including reference day)", () => {
    const apps = [app({ id: "1", deadline: "2026-04-25" })];
    const r = buildReminders(apps, "2026-04-18");
    expect(r.some((x) => x.type === "due_soon")).toBe(true);
  });

  it("does not flag due soon when deadline is more than 7 days out", () => {
    const apps = [app({ id: "1", deadline: "2026-04-26" })];
    const r = buildReminders(apps, "2026-04-18");
    expect(r.some((x) => x.type === "due_soon")).toBe(false);
  });

  it("flags follow up when followUpDate matches reference", () => {
    const apps = [app({ id: "1", followUpDate: "2026-04-18" })];
    const r = buildReminders(apps, "2026-04-18");
    expect(r.some((x) => x.type === "follow_up")).toBe(true);
  });

  it("binds primary action by reminder type and stage", () => {
    const apps = [
      app({ id: "a1", stage: "written", deadline: "2026-04-18" }),
      app({ id: "a2", stage: "todo", deadline: "2026-04-19" }),
      app({ id: "a3", stage: "applied", followUpDate: "2026-04-18" }),
    ];
    const r = buildReminders(apps, "2026-04-18");
    const written = r.find((x) => x.applicationId === "a1");
    const todo = r.find((x) => x.applicationId === "a2");
    const followup = r.find((x) => x.applicationId === "a3");
    expect(written?.primaryAction.type).toBe("continue_application");
    expect(written?.primaryAction.label).toBe("去笔试");
    expect(todo?.primaryAction.label).toBe("继续网申");
    expect(followup?.primaryAction.type).toBe("compose_followup_email");
  });

  it("uses stable taskKey and filters done/snoozed reminders", () => {
    const apps = [app({ id: "a1", deadline: "2026-04-18" })];
    const first = buildReminders(apps, "2026-04-18");
    const second = buildReminders(apps, "2026-04-18");
    expect(first[0]?.taskKey).toBe(second[0]?.taskKey);

    const doneFiltered = buildReminders(
      apps,
      "2026-04-18",
      {
        [first[0].taskKey]: {
          status: "done",
          snoozedUntil: null,
          updatedAt: "2026-04-18T01:00:00.000Z",
        },
      },
      new Date("2026-04-18T02:00:00.000Z"),
    );
    expect(doneFiltered).toHaveLength(0);

    const snoozedFiltered = buildReminders(
      apps,
      "2026-04-18",
      {
        [first[0].taskKey]: {
          status: "snoozed",
          snoozedUntil: "2026-04-18T03:00:00.000Z",
          updatedAt: "2026-04-18T01:00:00.000Z",
        },
      },
      new Date("2026-04-18T02:00:00.000Z"),
    );
    expect(snoozedFiltered).toHaveLength(0);

    const snoozeExpired = buildReminders(
      apps,
      "2026-04-18",
      {
        [first[0].taskKey]: {
          status: "snoozed",
          snoozedUntil: "2026-04-18T01:30:00.000Z",
          updatedAt: "2026-04-18T01:00:00.000Z",
        },
      },
      new Date("2026-04-18T02:00:00.000Z"),
    );
    expect(snoozeExpired).toHaveLength(1);
  });
});

describe("stats", () => {
   it("counts overdue on or before reference day", () => {
    const apps = [
      app({ id: "1", deadline: "2026-04-17" }),
      app({ id: "2", deadline: "2026-04-18" }),
    ];
    expect(statsOverdueCount(apps, "2026-04-18")).toBe(2);
  });

  it("counts due soon in the7-day window after reference", () => {
    const apps = [
      app({ id: "1", deadline: "2026-04-19" }),
      app({ id: "2", deadline: "2026-04-26" }),
    ];
    expect(statsDueSoonCount(apps, "2026-04-18")).toBe(1);
  });
});

describe("buildFollowUpQueue", () => {
  it("includes applied items stale for 7 days", () => {
    const apps = [
      app({
        id: "applied-1",
        company: "A",
        stage: "applied",
        updatedAt: "2026-04-11T12:00:00.000Z",
      }),
    ];
    const queue = buildFollowUpQueue(apps, "2026-04-18");
    expect(queue).toHaveLength(1);
    expect(queue[0].actionType).toBe("followup_status_check");
  });

  it("includes written/interview items stale for 3 days", () => {
    const apps = [
      app({
        id: "written-1",
        stage: "written",
        updatedAt: "2026-04-15T08:00:00.000Z",
      }),
      app({
        id: "interview-1",
        stage: "interview",
        updatedAt: "2026-04-15T08:00:00.000Z",
      }),
    ];
    const queue = buildFollowUpQueue(apps, "2026-04-18");
    expect(queue).toHaveLength(2);
    expect(queue.map((x) => x.actionType)).toEqual([
      "followup_written_result",
      "followup_interview_next_step",
    ]);
  });

  it("excludes unsupported stages and invalid updatedAt", () => {
    const apps = [
      app({ id: "todo-1", stage: "todo", updatedAt: "2026-04-01T00:00:00.000Z" }),
      app({ id: "offer-1", stage: "offer", updatedAt: "2026-04-01T00:00:00.000Z" }),
      app({ id: "bad-1", stage: "applied", updatedAt: "invalid-date" }),
    ];
    const queue = buildFollowUpQueue(apps, "2026-04-18");
    expect(queue).toHaveLength(0);
  });
});

describe("buildFollowUpDraft", () => {
  it("returns subject/body by action type", () => {
    const input = { company: "腾讯", position: "客户端开发实习生" };
    const draftA = buildFollowUpDraft(input, "followup_status_check");
    const draftW = buildFollowUpDraft(input, "followup_written_result");
    const draftI = buildFollowUpDraft(input, "followup_interview_next_step");

    expect(draftA.suggestedSubject).toContain("跟进申请进度");
    expect(draftW.suggestedSubject).toContain("测评结果跟进");
    expect(draftI.suggestedSubject).toContain("面试后流程跟进");
    expect(draftA.suggestedBody).toContain("礼貌跟进");
  });
});
