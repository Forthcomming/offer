import { describe, expect, it } from "vitest";
import type { Application } from "./types";
import { buildScheduleEvents } from "./schedule";

function appSeed(patch: Partial<Application>): Application {
  return {
    id: "a1",
    company: "C",
    position: "P",
    channel: "官网",
    stage: "applied",
    deadline: null,
    followUpDate: null,
    notes: "",
    jobUrl: null,
    resumeVersionId: null,
    updatedAt: new Date().toISOString(),
    ...patch,
  };
}

describe("buildScheduleEvents", () => {
  it("filters out offer/rejected applications", () => {
    const apps: Application[] = [
      appSeed({ id: "a_offer", stage: "offer", deadline: "2026-04-22" }),
      appSeed({ id: "a_rej", stage: "rejected", writtenAt: "2026-04-22T10:00" }),
      appSeed({ id: "a_ok", stage: "applied", deadline: "2026-04-22" }),
    ];
    const events = buildScheduleEvents(apps);
    expect(events.map((e) => e.applicationId)).toEqual(["a_ok"]);
  });

  it("creates all-day event from deadline", () => {
    const events = buildScheduleEvents([appSeed({ deadline: "2026-04-23" })]);
    expect(events).toHaveLength(1);
    expect(events[0].kind).toBe("deadline");
    expect(events[0].allDay).toBe(true);
    expect(events[0].start.getFullYear()).toBe(2026);
    expect(events[0].start.getMonth()).toBe(3);
    expect(events[0].start.getDate()).toBe(23);
    expect(events[0].start.getHours()).toBe(0);
    expect(events[0].start.getMinutes()).toBe(0);
  });

  it("creates timed events from datetime-local strings", () => {
    const events = buildScheduleEvents([
      appSeed({
        writtenAt: "2026-04-23T09:30",
        assessmentAt: "2026-04-23T12:00",
        interviewAt: "2026-04-24T15:05",
      }),
    ]);
    expect(events.map((e) => e.kind)).toEqual(["written", "assessment", "interview"]);
    expect(events[0].start.getHours()).toBe(9);
    expect(events[0].start.getMinutes()).toBe(30);
    expect(events[2].start.getDate()).toBe(24);
    expect(events[2].start.getHours()).toBe(15);
    expect(events[2].start.getMinutes()).toBe(5);
  });
});

