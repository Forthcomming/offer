import type {
  Application,
  Channel,
  EmailDraft,
  EmailHub,
  EmailParseSuggestion,
  InboxMessage,
  ResumeVersion,
  Stage,
} from "./types";
import type { ReminderTaskStateMap } from "./reminders";

const APPLICATIONS_KEY = "job-dashboard-applications:v1";
const MATERIALS_KEY = "job-dashboard-materials:v1";
const EMAIL_HUB_KEY = "job-dashboard-email:v1";
const EMAIL_DRAFTS_KEY = "job-dashboard-email-drafts:v1";
const REMINDER_TASK_STATE_KEY = "job-dashboard-reminder-task-state:v1";

const STAGES: Stage[] = [
  "todo",
  "applied",
  "written",
  "interview",
  "offer",
  "rejected",
];

const CHANNELS: Channel[] = ["官网", "邮箱", "内推"];

export function loadApplications(): Application[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(APPLICATIONS_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data.filter(isApplication).map(normalizeApplication);
  } catch {
    return [];
  }
}

export function saveApplications(apps: Application[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(apps));
}

export function loadMaterials(): ResumeVersion[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(MATERIALS_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data.filter(isResumeVersion).map(normalizeResumeVersion);
  } catch {
    return [];
  }
}

export function saveMaterials(materials: ResumeVersion[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(MATERIALS_KEY, JSON.stringify(materials));
}

const EMAIL_PRESET_HOST: Record<EmailHub["settings"]["providerPreset"], string> =
  {
    gmail: "imap.gmail.com",
    outlook: "outlook.office365.com",
    qq: "imap.qq.com",
    custom: "",
  };

export function defaultEmailHub(): EmailHub {
  const now = new Date().toISOString();
  return {
    version: 1,
    settings: {
      providerPreset: "gmail",
      imapHost: EMAIL_PRESET_HOST.gmail,
      emailDisplay: "",
      updatedAt: now,
    },
    messages: [],
    suggestions: [],
  };
}

export function loadEmailHub(): EmailHub {
  if (typeof window === "undefined") return defaultEmailHub();
  try {
    const raw = localStorage.getItem(EMAIL_HUB_KEY);
    if (!raw) return defaultEmailHub();
    const data = JSON.parse(raw) as unknown;
    if (!isEmailHub(data)) return defaultEmailHub();
    return normalizeEmailHub(data);
  } catch {
    return defaultEmailHub();
  }
}

export function saveEmailHub(hub: EmailHub): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(EMAIL_HUB_KEY, JSON.stringify(hub));
}

export function loadEmailDrafts(): EmailDraft[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(EMAIL_DRAFTS_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data.filter(isEmailDraft).map(normalizeEmailDraft);
  } catch {
    return [];
  }
}

export function saveEmailDrafts(drafts: EmailDraft[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(EMAIL_DRAFTS_KEY, JSON.stringify(drafts));
}

export function loadReminderTaskStateMap(): ReminderTaskStateMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(REMINDER_TASK_STATE_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw) as unknown;
    if (!data || typeof data !== "object") return {};
    const entries = Object.entries(data as Record<string, unknown>).filter(
      ([, value]) => isReminderTaskState(value),
    );
    return Object.fromEntries(entries) as ReminderTaskStateMap;
  } catch {
    return {};
  }
}

export function saveReminderTaskStateMap(stateMap: ReminderTaskStateMap): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(REMINDER_TASK_STATE_KEY, JSON.stringify(stateMap));
}

export function imapHostForPreset(
  preset: EmailHub["settings"]["providerPreset"],
): string {
  return EMAIL_PRESET_HOST[preset];
}

function normalizeApplication(a: Application): Application {
  return {
    ...a,
    resumeVersionId: a.resumeVersionId ?? null,
    writtenAt: a.writtenAt ?? null,
    assessmentAt: a.assessmentAt ?? null,
    interviewAt: a.interviewAt ?? null,
  };
}

function isApplication(x: unknown): x is Application {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  const resumeOk =
    o.resumeVersionId === undefined ||
    o.resumeVersionId === null ||
    typeof o.resumeVersionId === "string";
  const writtenOk =
    o.writtenAt === undefined || o.writtenAt === null || typeof o.writtenAt === "string";
  const assessmentOk =
    o.assessmentAt === undefined ||
    o.assessmentAt === null ||
    typeof o.assessmentAt === "string";
  const interviewOk =
    o.interviewAt === undefined ||
    o.interviewAt === null ||
    typeof o.interviewAt === "string";
  return (
    typeof o.id === "string" &&
    typeof o.company === "string" &&
    typeof o.position === "string" &&
    typeof o.channel === "string" &&
    CHANNELS.includes(o.channel as Channel) &&
    typeof o.stage === "string" &&
    STAGES.includes(o.stage as Stage) &&
    (o.deadline === null || typeof o.deadline === "string") &&
    (o.followUpDate === null || typeof o.followUpDate === "string") &&
    writtenOk &&
    assessmentOk &&
    interviewOk &&
    typeof o.notes === "string" &&
    (o.jobUrl === null || typeof o.jobUrl === "string") &&
    typeof o.updatedAt === "string" &&
    resumeOk
  );
}

function isResumeVersion(x: unknown): x is ResumeVersion {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  const syncStatusOk =
    o.syncStatus === undefined ||
    o.syncStatus === "idle" ||
    o.syncStatus === "mock_done";
  const syncUpdatedAtOk =
    o.syncUpdatedAt === undefined ||
    o.syncUpdatedAt === null ||
    typeof o.syncUpdatedAt === "string";
  const attNameOk =
    o.attachmentName === undefined ||
    o.attachmentName === null ||
    typeof o.attachmentName === "string";
  const attDataOk =
    o.attachmentDataUrl === undefined ||
    o.attachmentDataUrl === null ||
    typeof o.attachmentDataUrl === "string";
  return (
    typeof o.id === "string" &&
    typeof o.name === "string" &&
    typeof o.note === "string" &&
    (o.focusTag === null || typeof o.focusTag === "string") &&
    attNameOk &&
    attDataOk &&
    syncStatusOk &&
    syncUpdatedAtOk &&
    typeof o.createdAt === "string" &&
    typeof o.updatedAt === "string"
  );
}

function normalizeResumeVersion(version: ResumeVersion): ResumeVersion {
  return {
    ...version,
    attachmentName: version.attachmentName ?? null,
    attachmentDataUrl: version.attachmentDataUrl ?? null,
    syncStatus: version.syncStatus ?? "idle",
    syncUpdatedAt: version.syncUpdatedAt ?? null,
  };
}

const EMAIL_KINDS: EmailParseSuggestion["kind"][] = [
  "interview_invite",
  "written_test",
  "rejection",
  "ack",
  "offer_letter",
  "unknown",
];

const INBOX_SOURCES: InboxMessage["source"][] = ["demo", "paste"];

function isEmailHub(x: unknown): x is EmailHub {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  if (o.version !== 1) return false;
  if (!o.settings || typeof o.settings !== "object") return false;
  if (!Array.isArray(o.messages)) return false;
  if (!Array.isArray(o.suggestions)) return false;
  const s = o.settings as Record<string, unknown>;
  const presetOk =
    s.providerPreset === "gmail" ||
    s.providerPreset === "outlook" ||
    s.providerPreset === "qq" ||
    s.providerPreset === "custom";
  return (
    presetOk &&
    typeof s.imapHost === "string" &&
    typeof s.emailDisplay === "string" &&
    typeof s.updatedAt === "string"
  );
}

function normalizeEmailHub(hub: EmailHub): EmailHub {
  return {
    ...hub,
    messages: hub.messages.filter(isInboxMessage),
    suggestions: hub.suggestions
      .filter(isEmailParseSuggestion)
      .map((s) => ({
        ...s,
        appliedAt: s.appliedAt ?? null,
      })),
    settings: {
      ...hub.settings,
      imapHost: hub.settings.imapHost ?? "",
      emailDisplay: hub.settings.emailDisplay ?? "",
    },
  };
}

function isInboxMessage(x: unknown): x is InboxMessage {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.subject === "string" &&
    typeof o.from === "string" &&
    typeof o.receivedAt === "string" &&
    typeof o.bodyText === "string" &&
    INBOX_SOURCES.includes(o.source as InboxMessage["source"])
  );
}

function isEmailParseSuggestion(x: unknown): x is EmailParseSuggestion {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.messageId === "string" &&
    EMAIL_KINDS.includes(o.kind as EmailParseSuggestion["kind"]) &&
    typeof o.suggestedStage === "string" &&
    STAGES.includes(o.suggestedStage as Stage) &&
    (o.companyGuess === null || typeof o.companyGuess === "string") &&
    (o.confidence === "low" || o.confidence === "medium") &&
    typeof o.evidence === "string" &&
    typeof o.createdAt === "string" &&
    (o.appliedAt === null ||
      o.appliedAt === undefined ||
      typeof o.appliedAt === "string")
  );
}

function isEmailDraft(x: unknown): x is EmailDraft {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  const statusOk = o.status === "draft" || o.status === "sent";
  return (
    typeof o.id === "string" &&
    typeof o.applicationId === "string" &&
    typeof o.company === "string" &&
    typeof o.position === "string" &&
    (o.actionType === "followup_status_check" ||
      o.actionType === "followup_written_result" ||
      o.actionType === "followup_interview_next_step") &&
    (o.toEmail === undefined || typeof o.toEmail === "string") &&
    typeof o.subject === "string" &&
    typeof o.body === "string" &&
    statusOk &&
    (o.sentAt === undefined || o.sentAt === null || typeof o.sentAt === "string") &&
    typeof o.createdAt === "string" &&
    typeof o.updatedAt === "string"
  );
}

function normalizeEmailDraft(draft: EmailDraft): EmailDraft {
  return {
    ...draft,
    toEmail: draft.toEmail ?? "",
    status: draft.status ?? "draft",
    sentAt: draft.sentAt ?? null,
  };
}

function isReminderTaskState(x: unknown): boolean {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  const statusOk = o.status === "done" || o.status === "snoozed";
  const snoozedUntilOk =
    o.snoozedUntil === null || typeof o.snoozedUntil === "string";
  return statusOk && snoozedUntilOk && typeof o.updatedAt === "string";
}
