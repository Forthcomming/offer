export type Stage =
  | "todo"
  | "applied"
  | "written"
  | "interview"
  | "offer"
  | "rejected";

export type Channel = "官网" | "邮箱" | "内推";

export type ResumeSyncStatus = "idle" | "mock_done";

export interface ResumeVersion {
  id: string;
  name: string;
  note: string;
  /** 可选：投递方向/JD 标签，便于筛选 */
  focusTag: string | null;
  /** 本地材料附件（Data URL，体积受 localStorage 限制） */
  attachmentName: string | null;
  attachmentDataUrl: string | null;
  /** 占位：招聘网站同步状态（真实同步待接入） */
  syncStatus?: ResumeSyncStatus;
  /** 占位：最近一次同步时间 */
  syncUpdatedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Application {
  id: string;
  company: string;
  position: string;
  channel: Channel;
  stage: Stage;
  deadline: string | null;
  followUpDate: string | null;
  notes: string;
  jobUrl: string | null;
  /** 关联的简历材料版本 */
  resumeVersionId: string | null;
  updatedAt: string;
}

export type FollowUpActionType =
  | "followup_status_check"
  | "followup_written_result"
  | "followup_interview_next_step";

export interface FollowUpQueueItem {
  applicationId: string;
  company: string;
  position: string;
  actionType: FollowUpActionType;
  reason: string;
  suggestedSubject: string;
  suggestedBody: string;
}

export type EmailDraftStatus = "draft" | "sent";

export interface EmailDraft {
  id: string;
  applicationId: string;
  company: string;
  position: string;
  actionType: FollowUpActionType;
  /** 收件人邮箱（由用户确认/填写） */
  toEmail: string;
  subject: string;
  body: string;
  status: EmailDraftStatus;
  sentAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

/** 邮箱中心（本地演示 / 未来可接 IMAP） */
export type EmailProviderPreset = "gmail" | "outlook" | "qq" | "custom";

export interface EmailAccountSettings {
  providerPreset: EmailProviderPreset;
  imapHost: string;
  /** 展示用邮箱账号，不保存密码 */
  emailDisplay: string;
  updatedAt: string;
}

export type InboxMessageSource = "demo" | "paste";

export interface InboxMessage {
  id: string;
  subject: string;
  from: string;
  receivedAt: string;
  bodyText: string;
  source: InboxMessageSource;
}

export type EmailParseKind =
  | "interview_invite"
  | "written_test"
  | "rejection"
  | "ack"
  | "offer_letter"
  | "unknown";

export interface EmailParseSuggestion {
  id: string;
  messageId: string;
  kind: EmailParseKind;
  suggestedStage: Stage;
  companyGuess: string | null;
  confidence: "low" | "medium";
  evidence: string;
  createdAt: string;
  appliedAt: string | null;
}

export interface EmailHub {
  version: 1;
  settings: EmailAccountSettings;
  messages: InboxMessage[];
  suggestions: EmailParseSuggestion[];
}

export const CHANNELS: Channel[] = ["官网", "邮箱", "内推"];

export const STAGES: {
  id: Stage;
  label: string;
  columnClass: string;
}[] = [
  { id: "todo", label: "待投递", columnClass: "bg-white/10" },
  { id: "applied", label: "已投递", columnClass: "bg-indigo-400/10" },
  { id: "written", label: "笔试阶段", columnClass: "bg-violet-400/10" },
  { id: "interview", label: "面试阶段", columnClass: "bg-sky-400/10" },
  { id: "offer", label: "Offer", columnClass: "bg-emerald-400/10" },
  { id: "rejected", label: "已拒绝", columnClass: "bg-stone-400/10" },
];
