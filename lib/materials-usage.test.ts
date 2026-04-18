import { describe, expect, it } from "vitest";
import type { Application } from "./types";
import { countApplicationsUsingResume } from "./materials-usage";

function app(
  partial: Partial<Application> & Pick<Application, "id">,
): Application {
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

describe("countApplicationsUsingResume", () => {
  it("counts applications referencing resume id", () => {
    const apps = [
      app({ id: "1", resumeVersionId: "r1" }),
      app({ id: "2", resumeVersionId: "r2" }),
      app({ id: "3", resumeVersionId: "r1" }),
    ];
    expect(countApplicationsUsingResume(apps, "r1")).toBe(2);
    expect(countApplicationsUsingResume(apps, "r2")).toBe(1);
    expect(countApplicationsUsingResume(apps, "rx")).toBe(0);
  });
});
