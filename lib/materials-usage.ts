import type { Application } from "./types";

export function countApplicationsUsingResume(
  apps: Application[],
  resumeId: string,
): number {
  return apps.filter((a) => a.resumeVersionId === resumeId).length;
}
